package com.marketplace.provider.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, Long> {

    List<ProviderAvailability> findByProviderIdOrderByDayOfWeekAsc(Long providerId);

    Optional<ProviderAvailability> findByProviderIdAndDayOfWeek(Long providerId, int dayOfWeek);

    void deleteByProviderIdAndDayOfWeek(Long providerId, int dayOfWeek);
}
