package com.marketplace.notification.domain;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notification_devices")
public class NotificationDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(nullable = false, length = 20)
    private String platform;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 40)
    private String appVersion;

    @Column(length = 40)
    private String locale;

    @Column(nullable = false)
    private OffsetDateTime lastSeenAt;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected NotificationDevice() {
    }

    public NotificationDevice(UserAccount user, String token, String platform, String appVersion, String locale) {
        this.user = user;
        this.token = token;
        this.platform = platform;
        this.appVersion = appVersion;
        this.locale = locale;
        this.active = true;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.lastSeenAt = now;
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

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public OffsetDateTime getLastSeenAt() {
        return lastSeenAt;
    }

    public void markSeen() {
        this.lastSeenAt = OffsetDateTime.now();
    }
}
