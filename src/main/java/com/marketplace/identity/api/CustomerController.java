package com.marketplace.identity.api;

import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerController(UserAccountRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public List<CustomerResponse> listCustomers() {
        return userRepository.findAll().stream()
            .filter(user -> user.getRole() == Role.CUSTOMER)
            .map(user -> new CustomerResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhoneNumber()))
            .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        UserAccount user = userRepository.save(new UserAccount(
            request.fullName(),
            request.email(),
            request.phoneNumber(),
            passwordEncoder.encode(request.password()),
            Role.CUSTOMER
        ));
        return new CustomerResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhoneNumber());
    }

    public record CreateCustomerRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String phoneNumber,
        @NotBlank String password
    ) {
    }

    public record CustomerResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber
    ) {
    }
}
