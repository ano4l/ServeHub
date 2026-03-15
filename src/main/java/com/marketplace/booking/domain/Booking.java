package com.marketplace.booking.domain;

import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.identity.domain.UserAccount;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserAccount customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_offering_id", nullable = false)
    private ServiceOffering serviceOffering;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private BookingStatus status;

    @Column(nullable = false)
    private OffsetDateTime scheduledFor;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quotedPrice;

    @Column(length = 500)
    private String cancelledReason;

    @Version
    private int version;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Booking() {
    }

    public Booking(UserAccount customer, ProviderProfile provider, ServiceOffering serviceOffering,
                   OffsetDateTime scheduledFor, String address, String notes, BigDecimal quotedPrice) {
        this.customer = customer;
        this.provider = provider;
        this.serviceOffering = serviceOffering;
        this.scheduledFor = scheduledFor;
        this.address = address;
        this.notes = notes;
        this.quotedPrice = quotedPrice;
        this.status = BookingStatus.REQUESTED;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UserAccount getCustomer() {
        return customer;
    }

    public ProviderProfile getProvider() {
        return provider;
    }

    public ServiceOffering getServiceOffering() {
        return serviceOffering;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public OffsetDateTime getScheduledFor() {
        return scheduledFor;
    }

    public String getAddress() {
        return address;
    }

    public String getNotes() {
        return notes;
    }

    public BigDecimal getQuotedPrice() {
        return quotedPrice;
    }

    public void transitionTo(BookingStatus nextStatus) {
        if (!status.allowedNextStatuses().contains(nextStatus)) {
            throw new IllegalArgumentException("Invalid booking transition: " + status + " -> " + nextStatus);
        }
        this.status = nextStatus;
    }

    public String getCancelledReason() {
        return cancelledReason;
    }

    public void setCancelledReason(String cancelledReason) {
        this.cancelledReason = cancelledReason;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setScheduledFor(OffsetDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
