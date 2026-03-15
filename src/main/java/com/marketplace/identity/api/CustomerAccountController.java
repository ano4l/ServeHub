package com.marketplace.identity.api;

import com.marketplace.identity.domain.CustomerAddress;
import com.marketplace.identity.domain.CustomerAddressRepository;
import com.marketplace.identity.domain.SavedPaymentMethod;
import com.marketplace.identity.domain.SavedPaymentMethodRepository;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.YearMonth;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers/me")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerAccountController {

    private final CurrentUserService currentUserService;
    private final UserAccountRepository userRepository;
    private final CustomerAddressRepository addressRepository;
    private final SavedPaymentMethodRepository paymentMethodRepository;

    public CustomerAccountController(CurrentUserService currentUserService,
                                     UserAccountRepository userRepository,
                                     CustomerAddressRepository addressRepository,
                                     SavedPaymentMethodRepository paymentMethodRepository) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @GetMapping
    public CustomerProfileResponse getProfile() {
        return toProfileResponse(currentUserService.requireUser());
    }

    @PutMapping
    @Transactional
    public CustomerProfileResponse updateProfile(@Valid @RequestBody UpdateCustomerProfileRequest request) {
        UserAccount user = currentUserService.requireUser();
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(request.email(), user.getId())) {
            throw new IllegalArgumentException("Email already in use");
        }
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhoneNumber(request.phoneNumber().trim());
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().isBlank() ? null : request.avatarUrl().trim());
        }
        return toProfileResponse(user);
    }

    @GetMapping("/addresses")
    public List<CustomerAddressResponse> listAddresses() {
        UserAccount user = currentUserService.requireUser();
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(user.getId())
            .stream()
            .map(this::toAddressResponse)
            .toList();
    }

    @PostMapping("/addresses")
    @Transactional
    public CustomerAddressResponse createAddress(@Valid @RequestBody UpsertCustomerAddressRequest request) {
        UserAccount user = currentUserService.requireUser();
        boolean makeDefault = request.defaultAddress() == null || request.defaultAddress();
        if (makeDefault) {
            clearAddressDefaults(user.getId());
        }
        CustomerAddress address = addressRepository.save(new CustomerAddress(
            user,
            request.label().trim(),
            request.value().trim(),
            request.note() == null || request.note().isBlank() ? null : request.note().trim(),
            makeDefault
        ));
        return toAddressResponse(address);
    }

    @PutMapping("/addresses/{addressId}")
    @Transactional
    public CustomerAddressResponse updateAddress(@PathVariable Long addressId,
                                                 @Valid @RequestBody UpsertCustomerAddressRequest request) {
        UserAccount user = currentUserService.requireUser();
        CustomerAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Address not found: " + addressId));
        address.setLabel(request.label().trim());
        address.setValue(request.value().trim());
        address.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        if (Boolean.TRUE.equals(request.defaultAddress())) {
            clearAddressDefaults(user.getId());
            address.setDefaultAddress(true);
        } else if (request.defaultAddress() != null) {
            address.setDefaultAddress(false);
        }
        ensureAddressDefault(user.getId(), address.getId());
        return toAddressResponse(address);
    }

    @DeleteMapping("/addresses/{addressId}")
    @Transactional
    public void deleteAddress(@PathVariable Long addressId) {
        UserAccount user = currentUserService.requireUser();
        CustomerAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Address not found: " + addressId));
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);
        if (wasDefault) {
            addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(user.getId())
                .stream()
                .findFirst()
                .ifPresent(next -> next.setDefaultAddress(true));
        }
    }

    @GetMapping("/payment-methods")
    public List<SavedPaymentMethodResponse> listPaymentMethods() {
        UserAccount user = currentUserService.requireUser();
        return paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(user.getId())
            .stream()
            .map(this::toPaymentMethodResponse)
            .toList();
    }

    @PostMapping("/payment-methods")
    @Transactional
    public SavedPaymentMethodResponse createPaymentMethod(@Valid @RequestBody CreateSavedPaymentMethodRequest request) {
        UserAccount user = currentUserService.requireUser();
        String digits = digitsOnly(request.cardNumber());
        if (digits.length() < 12) {
            throw new IllegalArgumentException("Card number must have at least 12 digits");
        }
        boolean makeDefault = request.defaultMethod() == null || request.defaultMethod();
        if (makeDefault) {
            clearPaymentMethodDefaults(user.getId());
        }
        SavedPaymentMethod method = paymentMethodRepository.save(new SavedPaymentMethod(
            user,
            inferBrand(digits),
            digits.substring(digits.length() - 4),
            request.holderName().trim(),
            normalizeExpiry(request.expiry()),
            makeDefault
        ));
        return toPaymentMethodResponse(method);
    }

    @PutMapping("/payment-methods/{paymentMethodId}")
    @Transactional
    public SavedPaymentMethodResponse updatePaymentMethod(@PathVariable Long paymentMethodId,
                                                          @Valid @RequestBody UpdateSavedPaymentMethodRequest request) {
        UserAccount user = currentUserService.requireUser();
        SavedPaymentMethod method = paymentMethodRepository.findByIdAndUserId(paymentMethodId, user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Payment method not found: " + paymentMethodId));
        if (request.holderName() != null) {
            method.setHolderName(request.holderName().trim());
        }
        if (request.expiry() != null) {
            method.setExpiry(normalizeExpiry(request.expiry()));
        }
        if (Boolean.TRUE.equals(request.defaultMethod())) {
            clearPaymentMethodDefaults(user.getId());
            method.setDefaultMethod(true);
        } else if (request.defaultMethod() != null) {
            method.setDefaultMethod(false);
        }
        ensurePaymentMethodDefault(user.getId(), method.getId());
        return toPaymentMethodResponse(method);
    }

    @DeleteMapping("/payment-methods/{paymentMethodId}")
    @Transactional
    public void deletePaymentMethod(@PathVariable Long paymentMethodId) {
        UserAccount user = currentUserService.requireUser();
        SavedPaymentMethod method = paymentMethodRepository.findByIdAndUserId(paymentMethodId, user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Payment method not found: " + paymentMethodId));
        boolean wasDefault = method.isDefaultMethod();
        paymentMethodRepository.delete(method);
        if (wasDefault) {
            paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(user.getId())
                .stream()
                .findFirst()
                .ifPresent(next -> next.setDefaultMethod(true));
        }
    }

    private void clearAddressDefaults(Long userId) {
        addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
            .forEach(address -> address.setDefaultAddress(false));
    }

    private void ensureAddressDefault(Long userId, Long currentAddressId) {
        boolean hasDefault = addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId)
            .stream()
            .anyMatch(CustomerAddress::isDefaultAddress);
        if (!hasDefault) {
            addressRepository.findByIdAndUserId(currentAddressId, userId)
                .ifPresent(address -> address.setDefaultAddress(true));
        }
    }

    private void clearPaymentMethodDefaults(Long userId) {
        paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(userId)
            .forEach(method -> method.setDefaultMethod(false));
    }

    private void ensurePaymentMethodDefault(Long userId, Long currentMethodId) {
        boolean hasDefault = paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(userId)
            .stream()
            .anyMatch(SavedPaymentMethod::isDefaultMethod);
        if (!hasDefault) {
            paymentMethodRepository.findByIdAndUserId(currentMethodId, userId)
                .ifPresent(method -> method.setDefaultMethod(true));
        }
    }

    private CustomerProfileResponse toProfileResponse(UserAccount user) {
        return new CustomerProfileResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhoneNumber(),
            user.getAvatarUrl()
        );
    }

    private CustomerAddressResponse toAddressResponse(CustomerAddress address) {
        return new CustomerAddressResponse(
            address.getId(),
            address.getLabel(),
            address.getValue(),
            address.getNote(),
            address.isDefaultAddress()
        );
    }

    private SavedPaymentMethodResponse toPaymentMethodResponse(SavedPaymentMethod method) {
        return new SavedPaymentMethodResponse(
            method.getId(),
            method.getBrand(),
            method.getLast4(),
            method.getHolderName(),
            method.getExpiry(),
            method.isDefaultMethod()
        );
    }

    private String digitsOnly(String value) {
        return value.replaceAll("\\D", "");
    }

    private String inferBrand(String digits) {
        if (digits.startsWith("4")) {
            return "Visa";
        }
        if (digits.startsWith("5")) {
            return "Mastercard";
        }
        if (digits.startsWith("34") || digits.startsWith("37")) {
            return "American Express";
        }
        return "Card";
    }

    private String normalizeExpiry(String expiry) {
        String normalized = expiry.trim();
        if (!normalized.matches("\\d{2}/\\d{2,4}")) {
            throw new IllegalArgumentException("Expiry must be in MM/YY format");
        }
        String[] parts = normalized.split("/");
        int month = Integer.parseInt(parts[0]);
        int year = Integer.parseInt(parts[1]);
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Expiry month must be between 01 and 12");
        }
        if (parts[1].length() == 2) {
            year += 2000;
        }
        YearMonth expiryMonth = YearMonth.of(year, month);
        if (expiryMonth.isBefore(YearMonth.now())) {
            throw new IllegalArgumentException("Card expiry must be in the future");
        }
        return "%02d/%02d".formatted(month, year % 100);
    }

    public record CustomerProfileResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String avatarUrl
    ) {}

    public record UpdateCustomerProfileRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String phoneNumber,
        String avatarUrl
    ) {}

    public record CustomerAddressResponse(
        Long id,
        String label,
        String value,
        String note,
        boolean defaultAddress
    ) {}

    public record UpsertCustomerAddressRequest(
        @NotBlank String label,
        @NotBlank String value,
        String note,
        Boolean defaultAddress
    ) {}

    public record SavedPaymentMethodResponse(
        Long id,
        String brand,
        String last4,
        String holderName,
        String expiry,
        boolean defaultMethod
    ) {}

    public record CreateSavedPaymentMethodRequest(
        @NotBlank String holderName,
        @NotBlank String cardNumber,
        @NotBlank String expiry,
        Boolean defaultMethod
    ) {}

    public record UpdateSavedPaymentMethodRequest(
        String holderName,
        String expiry,
        Boolean defaultMethod
    ) {}
}
