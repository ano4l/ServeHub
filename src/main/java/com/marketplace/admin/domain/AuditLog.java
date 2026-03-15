package com.marketplace.admin.domain;

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
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private UserAccount actor;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 60)
    private String entityType;

    private Long entityId;

    @Column(length = 2000)
    private String detail;

    @Column(length = 45)
    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected AuditLog() {
    }

    public AuditLog(UserAccount actor, String action, String entityType, Long entityId,
                    String detail, String ipAddress) {
        this.actor = actor;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.detail = detail;
        this.ipAddress = ipAddress;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public UserAccount getActor() { return actor; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getDetail() { return detail; }
    public String getIpAddress() { return ipAddress; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
