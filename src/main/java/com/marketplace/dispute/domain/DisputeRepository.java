package com.marketplace.dispute.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    Optional<Dispute> findByBookingId(Long bookingId);

    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);

    long countByStatus(DisputeStatus status);

    @Query("SELECT d FROM Dispute d WHERE d.openedBy.id = :userId ORDER BY d.createdAt DESC")
    Page<Dispute> findByUserId(Long userId, Pageable pageable);

    Page<Dispute> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByBookingIdAndStatusIn(Long bookingId, List<DisputeStatus> statuses);
}
