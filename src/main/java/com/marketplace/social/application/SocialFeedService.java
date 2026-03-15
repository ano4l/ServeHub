package com.marketplace.social.application;

import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.catalog.domain.ServiceOfferingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.CurrentUserService;
import com.marketplace.social.domain.FeedReactionType;
import com.marketplace.social.domain.ServiceFeedComment;
import com.marketplace.social.domain.ServiceFeedCommentRepository;
import com.marketplace.social.domain.ServiceFeedReaction;
import com.marketplace.social.domain.ServiceFeedReactionRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SocialFeedService {

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ServiceFeedReactionRepository reactionRepository;
    private final ServiceFeedCommentRepository commentRepository;
    private final CurrentUserService currentUserService;

    public SocialFeedService(ServiceOfferingRepository serviceOfferingRepository,
                             ServiceFeedReactionRepository reactionRepository,
                             ServiceFeedCommentRepository commentRepository,
                             CurrentUserService currentUserService) {
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.reactionRepository = reactionRepository;
        this.commentRepository = commentRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<FeedPostResponse> listFeed(String category, String query, Integer size) {
        int pageSize = Math.max(1, Math.min(size == null ? 24 : size, 60));
        String normalizedCategory = category == null || category.isBlank() ? null : category.trim();
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        List<ServiceOffering> offerings = serviceOfferingRepository.findFeedCandidates(
            VerificationStatus.VERIFIED,
            normalizedCategory,
            normalizedQuery,
            PageRequest.of(0, pageSize)
        );

        if (offerings.isEmpty()) {
            return List.of();
        }

        List<Long> offeringIds = offerings.stream().map(ServiceOffering::getId).toList();
        Map<Long, ReactionCounts> reactionCounts = buildReactionCounts(offeringIds);
        Map<Long, Long> commentCounts = commentRepository.countByServiceOfferingIds(offeringIds).stream()
            .collect(Collectors.toMap(ServiceFeedCommentRepository.CommentCountView::getServiceOfferingId, ServiceFeedCommentRepository.CommentCountView::getTotal));
        Map<Long, List<CommentResponse>> commentPreview = buildCommentPreview(offeringIds);

        Set<Long> likedOfferings = Set.of();
        Set<Long> repostedOfferings = Set.of();
        if (currentUserService.currentUser().isPresent()) {
            UserAccount viewer = currentUserService.requireUser();
            List<ServiceFeedReaction> viewerReactions = reactionRepository.findByUserIdAndServiceOfferingIdIn(viewer.getId(), offeringIds);
            likedOfferings = viewerReactions.stream()
                .filter(reaction -> reaction.getType() == FeedReactionType.LIKE)
                .map(reaction -> reaction.getServiceOffering().getId())
                .collect(Collectors.toSet());
            repostedOfferings = viewerReactions.stream()
                .filter(reaction -> reaction.getType() == FeedReactionType.REPOST)
                .map(reaction -> reaction.getServiceOffering().getId())
                .collect(Collectors.toSet());
        }

        Set<Long> finalLikedOfferings = likedOfferings;
        Set<Long> finalRepostedOfferings = repostedOfferings;
        return offerings.stream()
            .map(offering -> {
                ReactionCounts counts = reactionCounts.getOrDefault(offering.getId(), new ReactionCounts(0, 0));
                return new FeedPostResponse(
                    offering.getId(),
                    offering.getProvider().getId(),
                    offering.getProvider().getUser().getFullName(),
                    offering.getProvider().getProfileImageUrl(),
                    offering.getCategory(),
                    offering.getServiceName(),
                    offering.getProvider().getBio(),
                    offering.getProvider().getCity(),
                    offering.getProvider().getVerificationStatus() == VerificationStatus.VERIFIED,
                    offering.getProvider().getAverageRating(),
                    offering.getProvider().getReviewCount(),
                    counts.likes(),
                    commentCounts.getOrDefault(offering.getId(), 0L),
                    counts.reposts(),
                    finalLikedOfferings.contains(offering.getId()),
                    finalRepostedOfferings.contains(offering.getId()),
                    commentPreview.getOrDefault(offering.getId(), List.of())
                );
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long offeringId) {
        requireOffering(offeringId);
        return commentRepository.findByServiceOfferingIdOrderByCreatedAtDesc(offeringId, PageRequest.of(0, 100)).stream()
            .map(this::toCommentResponse)
            .toList();
    }

    @Transactional
    public ReactionToggleResponse toggleReaction(Long offeringId, FeedReactionType type) {
        ServiceOffering offering = requireOffering(offeringId);
        UserAccount actor = requireCustomer();
        reactionRepository.findByServiceOfferingIdAndUserIdAndType(offeringId, actor.getId(), type)
            .ifPresentOrElse(reactionRepository::delete, () -> reactionRepository.save(new ServiceFeedReaction(offering, actor, type)));

        ReactionCounts counts = buildReactionCounts(List.of(offeringId)).getOrDefault(offeringId, new ReactionCounts(0, 0));
        boolean active = reactionRepository.findByServiceOfferingIdAndUserIdAndType(offeringId, actor.getId(), type).isPresent();
        return new ReactionToggleResponse(
            offeringId,
            type,
            active,
            counts.likes(),
            counts.reposts(),
            commentRepository.countByServiceOfferingIds(List.of(offeringId)).stream()
                .findFirst()
                .map(ServiceFeedCommentRepository.CommentCountView::getTotal)
                .orElse(0L)
        );
    }

    @Transactional
    public CommentResponse addComment(Long offeringId, String content) {
        ServiceOffering offering = requireOffering(offeringId);
        UserAccount actor = requireCustomer();
        ServiceFeedComment saved = commentRepository.save(new ServiceFeedComment(offering, actor, content.trim()));
        return toCommentResponse(saved);
    }

    private UserAccount requireCustomer() {
        UserAccount actor = currentUserService.requireUser();
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only customers can engage with feed posts");
        }
        return actor;
    }

    private ServiceOffering requireOffering(Long offeringId) {
        return serviceOfferingRepository.findById(offeringId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service offering not found"));
    }

    private Map<Long, ReactionCounts> buildReactionCounts(List<Long> offeringIds) {
        Map<Long, ReactionCounts> counts = new HashMap<>();
        for (ServiceFeedReactionRepository.ReactionCountView row : reactionRepository.countByServiceOfferingIds(offeringIds)) {
            ReactionCounts current = counts.getOrDefault(row.getServiceOfferingId(), new ReactionCounts(0, 0));
            counts.put(
                row.getServiceOfferingId(),
                row.getType() == FeedReactionType.LIKE
                    ? new ReactionCounts(row.getTotal(), current.reposts())
                    : new ReactionCounts(current.likes(), row.getTotal())
            );
        }
        return counts;
    }

    private Map<Long, List<CommentResponse>> buildCommentPreview(List<Long> offeringIds) {
        Map<Long, List<CommentResponse>> preview = new LinkedHashMap<>();
        int previewLimit = Math.min(Math.max(offeringIds.size() * 4, 12), 160);
        for (ServiceFeedComment comment : commentRepository.findByServiceOfferingIdInOrderByCreatedAtDesc(
            offeringIds,
            PageRequest.of(0, previewLimit)
        )) {
            List<CommentResponse> comments = preview.computeIfAbsent(comment.getServiceOffering().getId(), ignored -> new ArrayList<>());
            if (comments.size() < 2) {
                comments.add(toCommentResponse(comment));
            }
        }
        return preview;
    }

    private CommentResponse toCommentResponse(ServiceFeedComment comment) {
        return new CommentResponse(
            comment.getId(),
            comment.getServiceOffering().getId(),
            comment.getUser().getId(),
            comment.getUser().getFullName(),
            comment.getContent(),
            comment.getCreatedAt()
        );
    }

    private record ReactionCounts(long likes, long reposts) {
    }

    public record FeedPostResponse(
        Long id,
        Long providerId,
        String providerName,
        String providerAvatarUrl,
        String category,
        String serviceName,
        String caption,
        String city,
        boolean verified,
        java.math.BigDecimal rating,
        int reviewCount,
        long likes,
        long comments,
        long reposts,
        boolean likedByViewer,
        boolean repostedByViewer,
        List<CommentResponse> commentPreview
    ) {
    }

    public record CommentResponse(
        Long id,
        Long offeringId,
        Long authorId,
        String authorName,
        String content,
        OffsetDateTime createdAt
    ) {
    }

    public record ReactionToggleResponse(
        Long offeringId,
        FeedReactionType type,
        boolean active,
        long likes,
        long reposts,
        long comments
    ) {
    }
}
