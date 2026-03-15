package com.marketplace.social.domain;

import com.marketplace.catalog.domain.ServiceOffering;
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
@Table(name = "service_feed_comments")
public class ServiceFeedComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_offering_id", nullable = false)
    private ServiceOffering serviceOffering;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ServiceFeedComment() {
    }

    public ServiceFeedComment(ServiceOffering serviceOffering, UserAccount user, String content) {
        this.serviceOffering = serviceOffering;
        this.user = user;
        this.content = content;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ServiceOffering getServiceOffering() {
        return serviceOffering;
    }

    public UserAccount getUser() {
        return user;
    }

    public String getContent() {
        return content;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
