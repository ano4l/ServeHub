package com.marketplace.provider.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderDocumentRepository extends JpaRepository<ProviderDocument, Long> {

    List<ProviderDocument> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    List<ProviderDocument> findByProviderIdAndStatus(Long providerId, String status);

    long countByProviderIdAndStatus(Long providerId, String status);
}
