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
    public List<ServiceOfferingResponse> listServices(@RequestParam(required = false) String category,
                                                      @RequestParam(required = false) Long providerId) {
        List<ServiceOffering> services;
        if (providerId != null) {
            services = category == null || category.isBlank()
                ? serviceRepository.findByProviderIdOrderByServiceNameAsc(providerId)
                : serviceRepository.findByProviderIdAndCategoryIgnoreCase(providerId, category);
        } else {
            services = category == null || category.isBlank()
                ? serviceRepository.findAll()
                : serviceRepository.findByCategoryIgnoreCase(category);
        }
        return services.stream().map(ServiceOfferingResponse::from).toList();
    }

    @GetMapping("/providers/{providerId}/offerings")
    public List<ServiceOfferingResponse> listProviderOfferings(@PathVariable Long providerId,
                                                               @RequestParam(required = false) String category) {
        return listServices(category, providerId);
    }

    @GetMapping("/offerings")
    public List<ServiceOfferingResponse> listOfferings(@RequestParam(required = false) String category,
                                                       @RequestParam(required = false) Long providerId) {
        return listServices(category, providerId);
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
                offering.getCategory(),
                offering.getServiceName(),
                offering.getPricingType(),
                offering.getPrice(),
                offering.getEstimatedDurationMinutes()
            );
        }
    }
}
