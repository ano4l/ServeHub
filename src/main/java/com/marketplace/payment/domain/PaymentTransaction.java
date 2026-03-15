package com.marketplace.payment.domain;

import com.marketplace.booking.domain.Booking;
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
import java.time.OffsetDateTime;

@Entity
@Table(name = "payments")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PaymentStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal providerNetAmount;

    @Column(nullable = false, length = 80)
    private String reference;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected PaymentTransaction() {
    }

    public PaymentTransaction(Booking booking, BigDecimal grossAmount, BigDecimal commissionAmount,
                              BigDecimal providerNetAmount, String reference) {
        this.booking = booking;
        this.status = PaymentStatus.INITIATED;
        this.grossAmount = grossAmount;
        this.commissionAmount = commissionAmount;
        this.providerNetAmount = providerNetAmount;
        this.reference = reference;
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Booking getBooking() {
        return booking;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public BigDecimal getProviderNetAmount() {
        return providerNetAmount;
    }

    public String getReference() {
        return reference;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void markAuthorized() {
        this.status = PaymentStatus.AUTHORIZED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markCaptured() {
        this.status = PaymentStatus.CAPTURED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;
        this.updatedAt = OffsetDateTime.now();
    }
}
