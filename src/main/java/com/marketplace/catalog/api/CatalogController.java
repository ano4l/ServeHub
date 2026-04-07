package com.marketplace.catalog.api;

import com.marketplace.catalog.domain.PricingType;
import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.catalog.domain.ServiceOfferingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/catalog/services")
public class CatalogController {

    private final ServiceOfferingRepository serviceRepository;
    private final ProviderProfileRepository providerRepository;
    private final CurrentUserService currentUserService;

    public CatalogController(ServiceOfferingRepository serviceRepository,
                             ProviderProfileRepository providerRepository,
                             CurrentUserService currentUserService) {
        this.serviceRepository = serviceRepository;
        this.providerRepository = providerRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Page<ServiceOfferingResponse> listServices(@RequestParam(required = false) String category,
                                                      @RequestParam(required = false) Long providerId,
                                                      @RequestParam(required = false) String query,
                                                      @RequestParam(required = false) String city,
                                                      @RequestParam(required = false) BigDecimal minPrice,
                                                      @RequestParam(required = false) BigDecimal maxPrice,
                                                      @RequestParam(required = false) Double lat,
                                                      @RequestParam(required = false) Double lng,
                                                      @RequestParam(required = false, defaultValue = "25") Double radiusKm,
                                                      @PageableDefault(size = 20) Pageable pageable) {
        String normalizedCategory = normalize(category);
        String normalizedQuery = normalize(query);
        String normalizedCity = normalize(city);
        String categoryKey = normalizeKey(normalizedCategory);
        String queryPattern = likePattern(normalizedQuery);
        String cityPattern = likePattern(normalizedCity);

        Page<ServiceOffering> services;
        if (providerId != null) {
            services = serviceRepository.searchByProvider(
                providerId,
                categoryKey,
                queryPattern,
                minPrice,
                maxPrice,
                pageable
            );
        } else {
            services = serviceRepository.searchCatalog(
                List.of(VerificationStatus.VERIFIED, VerificationStatus.PENDING_REVIEW),
                categoryKey,
                cityPattern,
                queryPattern,
                minPrice,
                maxPrice,
                lat,
                lng,
                radiusKm,
                pageable
            );
        }
        return services.map(ServiceOfferingResponse::from);
    }

    @GetMapping("/providers/{providerId}/offerings")
    public Page<ServiceOfferingResponse> listProviderOfferings(@PathVariable Long providerId,
                                                               @RequestParam(required = false) String category,
                                                               @RequestParam(required = false) String query,
                                                               @RequestParam(required = false) BigDecimal minPrice,
                                                               @RequestParam(required = false) BigDecimal maxPrice,
                                                               @PageableDefault(size = 20) Pageable pageable) {
        return listServices(category, providerId, query, null, minPrice, maxPrice, null, null, 25.0, pageable);
    }

    @GetMapping("/offerings")
    public Page<ServiceOfferingResponse> listOfferings(@RequestParam(required = false) String category,
                                                       @RequestParam(required = false) Long providerId,
                                                       @RequestParam(required = false) String query,
                                                       @RequestParam(required = false) String city,
                                                       @RequestParam(required = false) BigDecimal minPrice,
                                                       @RequestParam(required = false) BigDecimal maxPrice,
                                                       @RequestParam(required = false) Double lat,
                                                       @RequestParam(required = false) Double lng,
                                                       @RequestParam(required = false, defaultValue = "25") Double radiusKm,
                                                       @PageableDefault(size = 20) Pageable pageable) {
        return listServices(category, providerId, query, city, minPrice, maxPrice, lat, lng, radiusKm, pageable);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeKey(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT);
    }

    private String likePattern(String value) {
        return value == null ? null : "%" + value.toLowerCase(Locale.ROOT) + "%";
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public ServiceOfferingResponse createService(@Valid @RequestBody CreateServiceOfferingRequest request) {
        ProviderProfile provider = providerRepository.findById(request.providerId())
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + request.providerId()));
        assertProviderCanManageOfferings(provider);

        ServiceOffering offering = serviceRepository.save(new ServiceOffering(
            provider,
            request.category(),
            request.serviceName(),
            request.pricingType(),
            request.price(),
            request.estimatedDurationMinutes()
        ));

        return ServiceOfferingResponse.from(offering);
    }

    @PostMapping("/offerings")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public ServiceOfferingResponse createOffering(@Valid @RequestBody CreateServiceOfferingRequest request) {
        return createService(request);
    }

    @PutMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public ServiceOfferingResponse updateOffering(@PathVariable Long offeringId,
                                                  @Valid @RequestBody UpdateServiceOfferingRequest request) {
        ServiceOffering offering = serviceRepository.findById(offeringId)
            .orElseThrow(() -> new EntityNotFoundException("Service offering not found: " + offeringId));
        assertProviderCanManageOfferings(offering.getProvider());

        if (request.category() != null) {
            offering.setCategory(request.category());
        }
        if (request.serviceName() != null) {
            offering.setServiceName(request.serviceName());
        }
        if (request.pricingType() != null) {
            offering.setPricingType(request.pricingType());
        }
        if (request.price() != null) {
            offering.setPrice(request.price());
        }
        if (request.estimatedDurationMinutes() != null) {
            offering.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        }

        return ServiceOfferingResponse.from(offering);
    }

    @DeleteMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public void deleteOffering(@PathVariable Long offeringId) {
        ServiceOffering offering = serviceRepository.findById(offeringId)
            .orElseThrow(() -> new EntityNotFoundException("Service offering not found: " + offeringId));
        assertProviderCanManageOfferings(offering.getProvider());
        serviceRepository.delete(offering);
    }

    private void assertProviderCanManageOfferings(ProviderProfile provider) {
        var actor = currentUserService.requireUser();
        if (actor.getRole() == Role.PROVIDER && !provider.getUser().getId().equals(actor.getId())) {
            throw new IllegalArgumentException("Providers may only manage their own service offerings");
        }

        if (provider.getVerificationStatus() != VerificationStatus.VERIFIED
            && provider.getVerificationStatus() != VerificationStatus.PENDING_REVIEW) {
            throw new IllegalArgumentException("Provider cannot publish services in status " + provider.getVerificationStatus());
        }
    }

    public record CreateServiceOfferingRequest(
        @NotNull Long providerId,
        @NotBlank String category,
        @NotBlank String serviceName,
        @NotNull PricingType pricingType,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        @NotNull @Min(15) Integer estimatedDurationMinutes
    ) {
    }

    public record UpdateServiceOfferingRequest(
        String category,
        String serviceName,
        PricingType pricingType,
        @DecimalMin("0.00") BigDecimal price,
        @Min(15) Integer estimatedDurationMinutes
    ) {
    }

    public record ServiceOfferingResponse(
        Long id,
        Long providerId,
        String providerName,
        String providerCity,
        String providerBio,
        VerificationStatus verificationStatus,
        BigDecimal averageRating,
        Integer reviewCount,
        Integer serviceRadiusKm,
        Double latitude,
        Double longitude,
        String category,
        String serviceName,
        PricingType pricingType,
        BigDecimal price,
        Integer estimatedDurationMinutes
    ) {
        static ServiceOfferingResponse from(ServiceOffering offering) {
            return new ServiceOfferingResponse(
                offering.getId(),
                offering.getProvider().getId(),
                offering.getProvider().getUser().getFullName(),
                offering.getProvider().getCity(),
                offering.getProvider().getBio(),
                offering.getProvider().getVerificationStatus(),
                offering.getProvider().getAverageRating(),
                offering.getProvider().getReviewCount(),
                offering.getProvider().getServiceRadiusKm(),
                offering.getProvider().getLatitude(),
                offering.getProvider().getLongitude(),
                offering.getCategory(),
                offering.getServiceName(),
                offering.getPricingType(),
                offering.getPrice(),
                offering.getEstimatedDurationMinutes()
            );
        }
    }
}
