package com.marketplace.provider.domain;

import com.marketplace.identity.domain.UserAccount;
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
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "providers")
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private VerificationStatus verificationStatus;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(nullable = false)
    private Integer serviceRadiusKm;

    @Column(nullable = false, length = 255)
    private String bio;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(nullable = false)
    private int reviewCount = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal completionRate = BigDecimal.ZERO;

    private Integer responseTimeMinutes;

    @Column(length = 500)
    private String profileImageUrl;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected ProviderProfile() {
    }

    public ProviderProfile(UserAccount user, VerificationStatus verificationStatus, String city,
                           Integer serviceRadiusKm, String bio) {
        this.user = user;
        this.verificationStatus = verificationStatus;
        this.city = city;
        this.serviceRadiusKm = serviceRadiusKm;
        this.bio = bio;
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

    public UserAccount getUser() {
        return user;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public String getCity() {
        return city;
    }

    public Integer getServiceRadiusKm() {
        return serviceRadiusKm;
    }

    public String getBio() {
        return bio;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }

    public BigDecimal getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(BigDecimal completionRate) {
        this.completionRate = completionRate;
    }

    public Integer getResponseTimeMinutes() {
        return responseTimeMinutes;
    }

    public void setResponseTimeMinutes(Integer responseTimeMinutes) {
        this.responseTimeMinutes = responseTimeMinutes;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setServiceRadiusKm(Integer serviceRadiusKm) {
        this.serviceRadiusKm = serviceRadiusKm;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}
