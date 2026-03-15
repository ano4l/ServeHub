package com.marketplace.catalog.domain;

import com.marketplace.provider.domain.ProviderProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "provider_services")
public class ServiceOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(nullable = false, length = 120)
    private String category;

    @Column(nullable = false, length = 120)
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PricingType pricingType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer estimatedDurationMinutes;

    protected ServiceOffering() {
    }

    public ServiceOffering(ProviderProfile provider, String category, String serviceName,
                           PricingType pricingType, BigDecimal price, Integer estimatedDurationMinutes) {
        this.provider = provider;
        this.category = category;
        this.serviceName = serviceName;
        this.pricingType = pricingType;
        this.price = price;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
    }

    public Long getId() {
        return id;
    }

    public ProviderProfile getProvider() {
        return provider;
    }

    public String getCategory() {
        return category;
    }

    public String getServiceName() {
        return serviceName;
    }

    public PricingType getPricingType() {
        return pricingType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getEstimatedDurationMinutes() {
        return estimatedDurationMinutes;
    }
}
