package com.marketplace.identity.domain;

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
@Table(name = "saved_payment_methods")
public class SavedPaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 40)
    private String brand;

    @Column(nullable = false, length = 4)
    private String last4;

    @Column(name = "holder_name", nullable = false, length = 120)
    private String holderName;

    @Column(nullable = false, length = 10)
    private String expiry;

    @Column(nullable = false)
    private boolean defaultMethod;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected SavedPaymentMethod() {
    }

    public SavedPaymentMethod(UserAccount user, String brand, String last4, String holderName, String expiry, boolean defaultMethod) {
        this.user = user;
        this.brand = brand;
        this.last4 = last4;
        this.holderName = holderName;
        this.expiry = expiry;
        this.defaultMethod = defaultMethod;
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

    public String getBrand() {
        return brand;
    }

    public String getLast4() {
        return last4;
    }

    public String getHolderName() {
        return holderName;
    }

    public String getExpiry() {
        return expiry;
    }

    public boolean isDefaultMethod() {
        return defaultMethod;
    }

    public void setHolderName(String holderName) {
        this.holderName = holderName;
    }

    public void setExpiry(String expiry) {
        this.expiry = expiry;
    }

    public void setDefaultMethod(boolean defaultMethod) {
        this.defaultMethod = defaultMethod;
    }
}
