package com.marketplace.dispute.domain;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opened_by", nullable = false)
    private UserAccount openedBy;

    @Column(nullable = false, length = 2000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private DisputeStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private ResolutionType resolutionType;

    @Column(length = 2000)
    private String resolutionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private UserAccount resolvedBy;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Dispute() {
    }

    public Dispute(Booking booking, UserAccount openedBy, String reason) {
        this.booking = booking;
        this.openedBy = openedBy;
        this.reason = reason;
        this.status = DisputeStatus.OPEN;
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

    public void resolve(ResolutionType resolutionType, String notes, UserAccount resolvedBy) {
        this.status = DisputeStatus.RESOLVED;
        this.resolutionType = resolutionType;
        this.resolutionNotes = notes;
        this.resolvedBy = resolvedBy;
    }

    public void markInReview() {
        this.status = DisputeStatus.IN_REVIEW;
    }

    public void close() {
        this.status = DisputeStatus.CLOSED;
    }

    public Long getId() { return id; }
    public Booking getBooking() { return booking; }
    public UserAccount getOpenedBy() { return openedBy; }
    public String getReason() { return reason; }
    public DisputeStatus getStatus() { return status; }
    public ResolutionType getResolutionType() { return resolutionType; }
    public String getResolutionNotes() { return resolutionNotes; }
    public UserAccount getResolvedBy() { return resolvedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
