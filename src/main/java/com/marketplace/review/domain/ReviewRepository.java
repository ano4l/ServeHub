package com.marketplace.review.domain;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBookingId(Long bookingId);

    Page<Review> findByProviderIdOrderByCreatedAtDesc(Long providerId, Pageable pageable);

    boolean existsByBookingId(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId")
    Double findAverageRatingByProviderId(Long providerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.provider.id = :providerId")
    int countByProviderId(Long providerId);
}
