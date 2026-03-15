package com.marketplace.social.domain;

import com.marketplace.catalog.domain.ServiceOffering;
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
import java.time.OffsetDateTime;

@Entity
@Table(name = "service_feed_reactions")
public class ServiceFeedReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_offering_id", nullable = false)
    private ServiceOffering serviceOffering;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedReactionType type;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ServiceFeedReaction() {
    }

    public ServiceFeedReaction(ServiceOffering serviceOffering, UserAccount user, FeedReactionType type) {
        this.serviceOffering = serviceOffering;
        this.user = user;
        this.type = type;
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

    public FeedReactionType getType() {
        return type;
    }
}
