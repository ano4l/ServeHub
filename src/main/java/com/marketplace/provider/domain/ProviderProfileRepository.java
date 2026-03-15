package com.marketplace.provider.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    Optional<ProviderProfile> findByUserId(Long userId);

    List<ProviderProfile> findByVerificationStatus(VerificationStatus status);

    Page<ProviderProfile> findByVerificationStatusIn(List<VerificationStatus> statuses, Pageable pageable);

    @Query("""
        SELECT p FROM ProviderProfile p
        WHERE p.verificationStatus = 'VERIFIED'
        AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        AND (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude))
            * cos(radians(p.longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm
        ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude))
            * cos(radians(p.longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(p.latitude)))) ASC
    """)
    Page<ProviderProfile> findNearby(double lat, double lng, double radiusKm, Pageable pageable);
}
