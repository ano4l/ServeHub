package com.marketplace.messaging.domain;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserAccount sender;

    @Column(nullable = false, length = 4000)
    private String content;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime sentAt;

    protected ChatMessage() {
    }

    public ChatMessage(Booking booking, UserAccount sender, String content) {
        this.booking = booking;
        this.sender = sender;
        this.content = content;
    }

    @PrePersist
    protected void onCreate() {
        this.sentAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Booking getBooking() { return booking; }
    public UserAccount getSender() { return sender; }
    public String getContent() { return content; }
    public OffsetDateTime getSentAt() { return sentAt; }
}
