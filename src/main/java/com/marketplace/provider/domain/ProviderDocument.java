package com.marketplace.provider.domain;

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
@Table(name = "provider_documents")
public class ProviderDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(name = "document_type", nullable = false, length = 60)
    private String documentType;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(nullable = false, length = 24)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private UserAccount reviewedBy;

    @Column(name = "review_notes", length = 500)
    private String reviewNotes;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected ProviderDocument() {
    }

    public ProviderDocument(ProviderProfile provider, String documentType, String fileUrl) {
        this.provider = provider;
        this.documentType = documentType;
        this.fileUrl = fileUrl;
        this.status = "PENDING";
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
    public ProviderProfile getProvider() { return provider; }
    public String getDocumentType() { return documentType; }
    public String getFileUrl() { return fileUrl; }
    public String getStatus() { return status; }
    public UserAccount getReviewedBy() { return reviewedBy; }
    public String getReviewNotes() { return reviewNotes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void approve(UserAccount reviewer, String notes) {
        this.status = "APPROVED";
        this.reviewedBy = reviewer;
        this.reviewNotes = notes;
    }

    public void reject(UserAccount reviewer, String notes) {
        this.status = "REJECTED";
        this.reviewedBy = reviewer;
        this.reviewNotes = notes;
    }
}
