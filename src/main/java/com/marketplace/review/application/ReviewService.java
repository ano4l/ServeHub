package com.marketplace.review.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.booking.domain.BookingStatus;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.review.api.ReviewController.ReviewResponse;
import com.marketplace.review.api.ReviewController.CreateReviewRequest;
import com.marketplace.review.domain.Review;
import com.marketplace.review.domain.ReviewRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerRepository;
    private final CurrentUserService currentUserService;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         ProviderProfileRepository providerRepository,
                         CurrentUserService currentUserService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.providerRepository = providerRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public ReviewResponse createReview(Long bookingId, CreateReviewRequest request) {
        UserAccount user = currentUserService.requireUser();
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));

        if (!booking.getCustomer().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Only the customer can review a booking");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED && booking.getStatus() != BookingStatus.REVIEWABLE) {
            throw new IllegalArgumentException("Booking must be completed before reviewing");
        }

        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("Review already exists for this booking");
        }

        Review review = reviewRepository.save(new Review(
            booking,
            user,
            booking.getProvider(),
            request.rating(),
            request.qualityRating(),
            request.punctualityRating(),
            request.professionalismRating(),
            request.comment()
        ));

        booking.transitionTo(BookingStatus.REVIEWABLE);
        updateProviderRating(booking.getProvider().getId());

        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getByBookingId(Long bookingId) {
        Review review = reviewRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Review not found for booking: " + bookingId));
        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getByProviderId(Long providerId, Pageable pageable) {
        return reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public ReviewResponse addProviderResponse(Long bookingId, String response) {
        UserAccount user = currentUserService.requireUser();
        Review review = reviewRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Review not found for booking: " + bookingId));

        boolean isProvider = review.getProvider().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT;
        if (!isProvider && !isAdmin) {
            throw new IllegalArgumentException("Only the provider or admin can respond to a review");
        }

        review.setProviderResponse(response);
        return toResponse(review);
    }

    private void updateProviderRating(Long providerId) {
        Double avgRating = reviewRepository.findAverageRatingByProviderId(providerId);
        int count = reviewRepository.countByProviderId(providerId);
        ProviderProfile provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + providerId));
        provider.setAverageRating(avgRating != null
            ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO);
        provider.setReviewCount(count);
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
            review.getId(),
            review.getBooking().getId(),
            review.getCustomer().getId(),
            review.getCustomer().getFullName(),
            review.getProvider().getId(),
            review.getRating(),
            review.getQualityRating(),
            review.getPunctualityRating(),
            review.getProfessionalismRating(),
            review.getComment(),
            review.getProviderResponse(),
            review.getCreatedAt().toString()
        );
    }
}
