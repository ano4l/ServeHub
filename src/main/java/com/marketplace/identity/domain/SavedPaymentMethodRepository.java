package com.marketplace.identity.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, Long> {
    List<SavedPaymentMethod> findByUserIdOrderByDefaultMethodDescCreatedAtDesc(Long userId);

    Optional<SavedPaymentMethod> findByIdAndUserId(Long id, Long userId);
}
