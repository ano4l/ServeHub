package com.marketplace.identity.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByUserIdOrderByDefaultAddressDescCreatedAtDesc(Long userId);

    Optional<CustomerAddress> findByIdAndUserId(Long id, Long userId);
}
