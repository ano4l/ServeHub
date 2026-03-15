package com.marketplace.review.domain;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.ProviderProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserAccount customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(nullable = false)
    private int rating;

    private Integer qualityRating;

    private Integer punctualityRating;

    private Integer professionalismRating;

    @Column(length = 2000)
    private String comment;

    @Column(length = 2000)
    private String providerResponse;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Review() {
    }

    public Review(Booking booking, UserAccount customer, ProviderProfile provider,
                  int rating, Integer qualityRating, Integer punctualityRating,
                  Integer professionalismRating, String comment) {
        this.booking = booking;
        this.customer = customer;
        this.provider = provider;
        this.rating = rating;
        this.qualityRating = qualityRating;
        this.punctualityRating = punctualityRating;
        this.professionalismRating = professionalismRating;
        this.comment = comment;
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

    public Long getId() { return id; }
    public Booking getBooking() { return booking; }
    public UserAccount getCustomer() { return customer; }
    public ProviderProfile getProvider() { return provider; }
    public int getRating() { return rating; }
    public Integer getQualityRating() { return qualityRating; }
    public Integer getPunctualityRating() { return punctualityRating; }
    public Integer getProfessionalismRating() { return professionalismRating; }
    public String getComment() { return comment; }
    public String getProviderResponse() { return providerResponse; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setProviderResponse(String providerResponse) {
        this.providerResponse = providerResponse;
    }
}
