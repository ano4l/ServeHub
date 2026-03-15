package com.marketplace.provider.api;

import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/providers")
public class ProviderController {

    private final ProviderProfileRepository providerRepository;
    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public ProviderController(ProviderProfileRepository providerRepository,
                              UserAccountRepository userRepository,
                              PasswordEncoder passwordEncoder,
                              CurrentUserService currentUserService) {
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Page<ProviderDetailResponse> listProviders(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "25") Double radius,
            @PageableDefault(size = 20) Pageable pageable) {
        if (lat != null && lng != null) {
            return providerRepository.findNearby(lat, lng, radius, pageable)
                .map(ProviderDetailResponse::from);
        }
        return providerRepository.findByVerificationStatusIn(
            List.of(VerificationStatus.VERIFIED, VerificationStatus.PENDING_REVIEW), pageable)
            .map(ProviderDetailResponse::from);
    }

    @GetMapping("/{id}")
    public ProviderDetailResponse getProvider(@PathVariable Long id) {
        ProviderProfile provider = providerRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + id));
        return ProviderDetailResponse.from(provider);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    public ProviderDetailResponse getProfile() {
        UserAccount user = currentUserService.requireUser();
        ProviderProfile provider = providerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Provider profile not found"));
        return ProviderDetailResponse.from(provider);
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    @Transactional
    public ProviderDetailResponse updateProfile(@Valid @RequestBody UpdateProviderRequest request) {
        UserAccount user = currentUserService.requireUser();
        ProviderProfile provider = providerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Provider profile not found"));
        if (request.bio() != null) provider.setBio(request.bio());
        if (request.city() != null) provider.setCity(request.city());
        if (request.serviceRadiusKm() != null) provider.setServiceRadiusKm(request.serviceRadiusKm());
        if (request.latitude() != null) provider.setLatitude(request.latitude());
        if (request.longitude() != null) provider.setLongitude(request.longitude());
        if (request.profileImageUrl() != null) provider.setProfileImageUrl(request.profileImageUrl());
        return ProviderDetailResponse.from(provider);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProviderDetailResponse createProvider(@Valid @RequestBody CreateProviderRequest request) {
        UserAccount user = userRepository.save(new UserAccount(
            request.fullName(),
            request.email(),
            request.phoneNumber(),
            passwordEncoder.encode(request.password()),
            Role.PROVIDER
        ));

        ProviderProfile provider = providerRepository.save(new ProviderProfile(
            user,
            VerificationStatus.PENDING_REVIEW,
            request.city(),
            request.serviceRadiusKm(),
            request.bio()
        ));

        return ProviderDetailResponse.from(provider);
    }

    public record UpdateProviderRequest(
        String bio,
        String city,
        Integer serviceRadiusKm,
        Double latitude,
        Double longitude,
        String profileImageUrl
    ) {}

    public record CreateProviderRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String phoneNumber,
        @NotBlank String password,
        @NotBlank String city,
        @Min(1) @Max(200) Integer serviceRadiusKm,
        @NotBlank String bio
    ) {
    }

    public record ProviderDetailResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String city,
        String bio,
        Integer serviceRadiusKm,
        VerificationStatus verificationStatus,
        BigDecimal averageRating,
        int reviewCount,
        BigDecimal completionRate,
        Integer responseTimeMinutes,
        String profileImageUrl,
        Double latitude,
        Double longitude
    ) {
        static ProviderDetailResponse from(ProviderProfile provider) {
            return new ProviderDetailResponse(
                provider.getId(),
                provider.getUser().getId(),
                provider.getUser().getFullName(),
                provider.getUser().getEmail(),
                provider.getCity(),
                provider.getBio(),
                provider.getServiceRadiusKm(),
                provider.getVerificationStatus(),
                provider.getAverageRating(),
                provider.getReviewCount(),
                provider.getCompletionRate(),
                provider.getResponseTimeMinutes(),
                provider.getProfileImageUrl(),
                provider.getLatitude(),
                provider.getLongitude()
            );
        }
    }
}
