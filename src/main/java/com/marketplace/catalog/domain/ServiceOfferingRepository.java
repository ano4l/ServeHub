package com.marketplace.catalog.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findByCategoryIgnoreCase(String category);
}
