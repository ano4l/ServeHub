package com.marketplace.notification.domain;

import com.marketplace.identity.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    @Column(nullable = false)
    private boolean emailEnabled = true;

    @Column(nullable = false)
    private boolean pushEnabled = true;

    @Column(nullable = false)
    private boolean smsEnabled = false;

    @Column(nullable = false)
    private boolean bookingUpdates = true;

    @Column(nullable = false)
    private boolean messages = true;

    @Column(nullable = false)
    private boolean promotions = false;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected NotificationPreference() {
    }

    public NotificationPreference(UserAccount user) {
        this.user = user;
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
    public UserAccount getUser() { return user; }
    public boolean isEmailEnabled() { return emailEnabled; }
    public boolean isPushEnabled() { return pushEnabled; }
    public boolean isSmsEnabled() { return smsEnabled; }
    public boolean isBookingUpdates() { return bookingUpdates; }
    public boolean isMessages() { return messages; }
    public boolean isPromotions() { return promotions; }

    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }
    public void setPushEnabled(boolean pushEnabled) { this.pushEnabled = pushEnabled; }
    public void setSmsEnabled(boolean smsEnabled) { this.smsEnabled = smsEnabled; }
    public void setBookingUpdates(boolean bookingUpdates) { this.bookingUpdates = bookingUpdates; }
    public void setMessages(boolean messages) { this.messages = messages; }
    public void setPromotions(boolean promotions) { this.promotions = promotions; }
}
