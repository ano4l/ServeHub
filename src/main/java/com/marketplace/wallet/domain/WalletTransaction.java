package com.marketplace.wallet.domain;

import com.marketplace.booking.domain.Booking;
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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "wallet_transactions")
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TransactionType type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 120)
    private String reference;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_booking_id")
    private Booking relatedBooking;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected WalletTransaction() {
    }

    public WalletTransaction(UserAccount user, TransactionType type, BigDecimal amount,
                             String reference, String description, BigDecimal balanceAfter,
                             Booking relatedBooking) {
        this.user = user;
        this.type = type;
        this.amount = amount;
        this.reference = reference;
        this.description = description;
        this.balanceAfter = balanceAfter;
        this.relatedBooking = relatedBooking;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public UserAccount getUser() { return user; }
    public TransactionType getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public String getReference() { return reference; }
    public String getDescription() { return description; }
    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public Booking getRelatedBooking() { return relatedBooking; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
