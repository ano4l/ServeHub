package com.marketplace.social.api;

import com.marketplace.social.application.SocialFeedService;
import com.marketplace.social.domain.FeedReactionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/social/feed")
public class SocialFeedController {

    private final SocialFeedService socialFeedService;

    public SocialFeedController(SocialFeedService socialFeedService) {
        this.socialFeedService = socialFeedService;
    }

    @GetMapping
    public List<SocialFeedService.FeedPostResponse> listFeed(@RequestParam(required = false) String category,
                                                             @RequestParam(required = false, name = "q") String query,
                                                             @RequestParam(required = false) Integer size) {
        return socialFeedService.listFeed(category, query, size);
    }

    @GetMapping("/{offeringId}/comments")
    public List<SocialFeedService.CommentResponse> listComments(@PathVariable Long offeringId) {
        return socialFeedService.listComments(offeringId);
    }

    @PostMapping("/{offeringId}/comments")
    public SocialFeedService.CommentResponse addComment(@PathVariable Long offeringId,
                                                        @Valid @RequestBody CreateCommentRequest request) {
        return socialFeedService.addComment(offeringId, request.content());
    }

    @PostMapping("/{offeringId}/likes/toggle")
    public SocialFeedService.ReactionToggleResponse toggleLike(@PathVariable Long offeringId) {
        return socialFeedService.toggleReaction(offeringId, FeedReactionType.LIKE);
    }

    @PostMapping("/{offeringId}/reposts/toggle")
    public SocialFeedService.ReactionToggleResponse toggleRepost(@PathVariable Long offeringId) {
        return socialFeedService.toggleReaction(offeringId, FeedReactionType.REPOST);
    }

    public record CreateCommentRequest(
        @NotBlank @Size(max = 1000) String content
    ) {
    }
}
