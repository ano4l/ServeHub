package com.marketplace.review.api;

import com.marketplace.review.application.ReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/bookings/{bookingId}/review")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ReviewResponse createReview(@PathVariable Long bookingId,
                                       @Valid @RequestBody CreateReviewRequest request) {
        return reviewService.createReview(bookingId, request);
    }

    @GetMapping("/bookings/{bookingId}/review")
    @PreAuthorize("isAuthenticated()")
    public ReviewResponse getByBookingId(@PathVariable Long bookingId) {
        return reviewService.getByBookingId(bookingId);
    }

    @GetMapping("/providers/{providerId}/reviews")
    public Page<ReviewResponse> getByProviderId(@PathVariable Long providerId,
                                                @PageableDefault(size = 10) Pageable pageable) {
        return reviewService.getByProviderId(providerId, pageable);
    }

    @PostMapping("/bookings/{bookingId}/review/response")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN','SUPPORT')")
    public ReviewResponse addProviderResponse(@PathVariable Long bookingId,
                                              @Valid @RequestBody ProviderResponseRequest request) {
        return reviewService.addProviderResponse(bookingId, request.response());
    }

    public record CreateReviewRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        @Min(1) @Max(5) Integer qualityRating,
        @Min(1) @Max(5) Integer punctualityRating,
        @Min(1) @Max(5) Integer professionalismRating,
        String comment
    ) {}

    public record ProviderResponseRequest(
        @NotNull String response
    ) {}

    public record ReviewResponse(
        Long id,
        Long bookingId,
        Long customerId,
        String customerName,
        Long providerId,
        int rating,
        Integer qualityRating,
        Integer punctualityRating,
        Integer professionalismRating,
        String comment,
        String providerResponse,
        String createdAt
    ) {}
}
