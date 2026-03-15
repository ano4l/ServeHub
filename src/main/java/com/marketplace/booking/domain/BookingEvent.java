package com.marketplace.booking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "booking_events")
public class BookingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false, length = 40)
    private String eventType;

    @Column(nullable = false, length = 1000)
    private String detail;

    @Column(nullable = false)
    private OffsetDateTime occurredAt;

    protected BookingEvent() {
    }

    public BookingEvent(Booking booking, String eventType, String detail) {
        this.booking = booking;
        this.eventType = eventType;
        this.detail = detail;
        this.occurredAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getEventType() {
        return eventType;
    }

    public String getDetail() {
        return detail;
    }

    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}
