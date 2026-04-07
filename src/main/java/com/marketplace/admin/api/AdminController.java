package com.marketplace.admin.api;

import com.marketplace.admin.domain.AuditLog;
import com.marketplace.admin.domain.AuditLogRepository;
import com.marketplace.admin.domain.Category;
import com.marketplace.admin.domain.CategoryRepository;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.dispute.domain.DisputeRepository;
import com.marketplace.dispute.domain.DisputeStatus;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.provider.domain.ProviderDocument;
import com.marketplace.provider.domain.ProviderDocumentRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.review.domain.ReviewRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
public class AdminController {

    private final UserAccountRepository userRepository;
    private final ProviderProfileRepository providerRepository;
    private final ProviderDocumentRepository documentRepository;
    private final BookingRepository bookingRepository;
    private final DisputeRepository disputeRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogRepository auditLogRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;

    public AdminController(UserAccountRepository userRepository,
                           ProviderProfileRepository providerRepository,
                           ProviderDocumentRepository documentRepository,
                           BookingRepository bookingRepository,
                           DisputeRepository disputeRepository,
                           ReviewRepository reviewRepository,
                           AuditLogRepository auditLogRepository,
                           CategoryRepository categoryRepository,
                           CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.documentRepository = documentRepository;
        this.bookingRepository = bookingRepository;
        this.disputeRepository = disputeRepository;
        this.reviewRepository = reviewRepository;
        this.auditLogRepository = auditLogRepository;
        this.categoryRepository = categoryRepository;
        this.currentUserService = currentUserService;
    }

    // ── Users ───────────────────────────────────────────────────────────

    @GetMapping("/users")
    public Page<UserResponse> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toUserResponse);
    }

    @GetMapping("/users/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return toUserResponse(userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + id)));
    }

    @PutMapping("/users/{id}")
    @Transactional
    public UserResponse updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        UserAccount user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        if (request.role() != null) user.setRole(request.role());
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.phoneNumber() != null) user.setPhoneNumber(request.phoneNumber());
        logAction("UPDATE_USER", "User", id, "Updated user: " + request);
        return toUserResponse(user);
    }

    // ── Verifications ───────────────────────────────────────────────────

    @GetMapping("/verifications")
    public List<VerificationResponse> getVerificationQueue() {
        return providerRepository.findByVerificationStatus(VerificationStatus.PENDING_REVIEW)
            .stream().map(this::toVerificationResponse).toList();
    }

    @PostMapping("/verifications/{id}/approve")
    @Transactional
    public VerificationResponse approveProvider(@PathVariable Long id) {
        ProviderProfile provider = providerRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + id));
        provider.setVerificationStatus(VerificationStatus.VERIFIED);
        logAction("APPROVE_PROVIDER", "Provider", id, "Provider approved");
        return toVerificationResponse(provider);
    }

    @PostMapping("/verifications/{id}/reject")
    @Transactional
    public VerificationResponse rejectProvider(@PathVariable Long id,
                                               @Valid @RequestBody RejectProviderRequest request) {
        ProviderProfile provider = providerRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + id));
        provider.setVerificationStatus(VerificationStatus.REJECTED);
        logAction("REJECT_PROVIDER", "Provider", id, "Rejected: " + request.reason());
        return toVerificationResponse(provider);
    }

    // ── Document Reviews ─────────────────────────────────────────────────

    @GetMapping("/verifications/{providerId}/documents")
    public List<DocumentResponse> getProviderDocuments(@PathVariable Long providerId) {
        return documentRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
            .stream().map(this::toDocumentResponse).toList();
    }

    @GetMapping("/documents/pending")
    public List<DocumentResponse> getPendingDocuments() {
        return documentRepository.findAll().stream()
            .filter(d -> "PENDING".equals(d.getStatus()))
            .map(this::toDocumentResponse).toList();
    }

    @PostMapping("/documents/{docId}/approve")
    @Transactional
    public DocumentResponse approveDocument(@PathVariable Long docId,
                                            @RequestBody(required = false) ReviewDocumentRequest request) {
        ProviderDocument doc = documentRepository.findById(docId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found: " + docId));
        UserAccount reviewer = currentUserService.requireUser();
        doc.approve(reviewer, request != null ? request.notes() : null);
        logAction("APPROVE_DOCUMENT", "ProviderDocument", docId,
            "Approved document type=" + doc.getDocumentType());

        // Auto-verify provider if all documents are approved
        checkAutoVerify(doc.getProvider());
        return toDocumentResponse(doc);
    }

    @PostMapping("/documents/{docId}/reject")
    @Transactional
    public DocumentResponse rejectDocument(@PathVariable Long docId,
                                           @Valid @RequestBody ReviewDocumentRequest request) {
        ProviderDocument doc = documentRepository.findById(docId)
            .orElseThrow(() -> new EntityNotFoundException("Document not found: " + docId));
        UserAccount reviewer = currentUserService.requireUser();
        doc.reject(reviewer, request.notes());
        logAction("REJECT_DOCUMENT", "ProviderDocument", docId,
            "Rejected document: " + request.notes());
        return toDocumentResponse(doc);
    }

    private void checkAutoVerify(ProviderProfile provider) {
        long pending = documentRepository.countByProviderIdAndStatus(provider.getId(), "PENDING");
        long rejected = documentRepository.countByProviderIdAndStatus(provider.getId(), "REJECTED");
        long approved = documentRepository.countByProviderIdAndStatus(provider.getId(), "APPROVED");
        if (pending == 0 && rejected == 0 && approved > 0
                && provider.getVerificationStatus() == VerificationStatus.PENDING_REVIEW) {
            provider.setVerificationStatus(VerificationStatus.VERIFIED);
            logAction("AUTO_VERIFY_PROVIDER", "Provider", provider.getId(),
                "All documents approved — provider auto-verified");
        }
    }

    // ── Analytics ───────────────────────────────────────────────────────

    @GetMapping("/analytics")
    public AnalyticsResponse getAnalytics() {
        long totalUsers = userRepository.count();
        long totalProviders = providerRepository.count();
        long totalBookings = bookingRepository.count();
        long pendingVerifications = providerRepository.countByVerificationStatus(VerificationStatus.PENDING_REVIEW);
        long openDisputes = disputeRepository.countByStatus(DisputeStatus.OPEN);
        long totalReviews = reviewRepository.count();
        return new AnalyticsResponse(totalUsers, totalProviders, totalBookings,
            pendingVerifications, openDisputes, totalReviews, 0, 0);
    }

    // ── Audit Logs ──────────────────────────────────────────────────────

    @GetMapping("/audit-logs")
    public Page<AuditLogResponse> getAuditLogs(@PageableDefault(size = 20) Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toAuditLogResponse);
    }

    // ── Categories ──────────────────────────────────────────────────────

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll().stream().map(this::toCategoryResponse).toList();
    }

    @PostMapping("/categories")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Category slug already exists: " + request.slug());
        }
        Category cat = categoryRepository.save(new Category(
            request.name(), request.slug(), request.icon(), request.displayOrder()));
        logAction("CREATE_CATEGORY", "Category", cat.getId(), "Created category: " + cat.getName());
        return toCategoryResponse(cat);
    }

    @PutMapping("/categories/{id}")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse updateCategory(@PathVariable Long id,
                                           @Valid @RequestBody UpdateCategoryRequest request) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
        if (request.name() != null) cat.setName(request.name());
        if (request.icon() != null) cat.setIcon(request.icon());
        if (request.displayOrder() != null) cat.setDisplayOrder(request.displayOrder());
        if (request.active() != null) cat.setActive(request.active());
        logAction("UPDATE_CATEGORY", "Category", id, "Updated category");
        return toCategoryResponse(cat);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private void logAction(String action, String entityType, Long entityId, String detail) {
        try {
            UserAccount actor = currentUserService.requireUser();
            auditLogRepository.save(new AuditLog(actor, action, entityType, entityId, detail, null));
        } catch (Exception ignored) {
            // Best-effort audit logging
        }
    }

    private UserResponse toUserResponse(UserAccount u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhoneNumber(),
            u.getRole(), u.isEmailVerified(), u.isLocked(),
            u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
    }

    private VerificationResponse toVerificationResponse(ProviderProfile p) {
        return new VerificationResponse(p.getId(), p.getUser().getId(), p.getUser().getFullName(),
            p.getUser().getEmail(), p.getCity(), p.getBio(), p.getVerificationStatus(),
            p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
    }

    private DocumentResponse toDocumentResponse(ProviderDocument d) {
        return new DocumentResponse(
            d.getId(),
            d.getProvider().getId(),
            d.getProvider().getUser().getFullName(),
            d.getDocumentType(),
            d.getFileUrl(),
            d.getStatus(),
            d.getReviewedBy() != null ? d.getReviewedBy().getFullName() : null,
            d.getReviewNotes(),
            d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
    }

    private AuditLogResponse toAuditLogResponse(AuditLog l) {
        return new AuditLogResponse(l.getId(),
            l.getActor() != null ? l.getActor().getFullName() : "System",
            l.getAction(), l.getEntityType(), l.getEntityId(), l.getDetail(),
            l.getCreatedAt().toString());
    }

    private CategoryResponse toCategoryResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getIcon(),
            c.getDisplayOrder(), c.isActive());
    }

    // ── Records ─────────────────────────────────────────────────────────

    public record UserResponse(Long id, String fullName, String email, String phoneNumber,
                               Role role, boolean emailVerified, boolean locked, String createdAt) {}

    public record UpdateUserRequest(String fullName, String phoneNumber, Role role) {}

    public record VerificationResponse(Long id, Long userId, String fullName, String email,
                                       String city, String bio, VerificationStatus status, String createdAt) {}

    public record RejectProviderRequest(@NotBlank String reason) {}

    public record DocumentResponse(Long id, Long providerId, String providerName,
                                   String documentType, String fileUrl, String status,
                                   String reviewerName, String reviewNotes, String createdAt) {}

    public record ReviewDocumentRequest(String notes) {}

    public record AnalyticsResponse(long totalUsers, long totalProviders, long totalBookings,
                                    long pendingVerifications, long openDisputes, long totalReviews,
                                    long revenue, long completionRate) {}

    public record AuditLogResponse(Long id, String actorName, String action, String entityType,
                                   Long entityId, String detail, String createdAt) {}

    public record CategoryResponse(Long id, String name, String slug, String icon,
                                   int displayOrder, boolean active) {}

    public record CreateCategoryRequest(@NotBlank String name, @NotBlank String slug,
                                        String icon, @NotNull Integer displayOrder) {}

    public record UpdateCategoryRequest(String name, String icon, Integer displayOrder, Boolean active) {}
}
