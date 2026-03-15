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
@Table(name = "customer_addresses")
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(nullable = false, length = 255)
    private String value;

    @Column(length = 255)
    private String note;

    @Column(nullable = false)
    private boolean defaultAddress;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected CustomerAddress() {
    }

    public CustomerAddress(UserAccount user, String label, String value, String note, boolean defaultAddress) {
        this.user = user;
        this.label = label;
        this.value = value;
        this.note = note;
        this.defaultAddress = defaultAddress;
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

    public String getLabel() {
        return label;
    }

    public String getValue() {
        return value;
    }

    public String getNote() {
        return note;
    }

    public boolean isDefaultAddress() {
        return defaultAddress;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public void setDefaultAddress(boolean defaultAddress) {
        this.defaultAddress = defaultAddress;
    }
}
