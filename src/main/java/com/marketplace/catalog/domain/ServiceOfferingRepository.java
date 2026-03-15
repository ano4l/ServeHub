package com.marketplace.catalog.domain;

import com.marketplace.provider.domain.VerificationStatus;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findByCategoryIgnoreCase(String category);
    List<ServiceOffering> findByProviderIdOrderByServiceNameAsc(Long providerId);
    List<ServiceOffering> findByProviderIdAndCategoryIgnoreCase(Long providerId, String category);

    @Query("""
        select s from ServiceOffering s
        join s.provider p
        join p.user u
        where p.verificationStatus = :status
        and (:category is null or lower(s.category) = lower(:category))
        and (
            :query is null
            or lower(s.serviceName) like lower(concat('%', :query, '%'))
            or lower(s.category) like lower(concat('%', :query, '%'))
            or lower(u.fullName) like lower(concat('%', :query, '%'))
            or lower(coalesce(p.bio, '')) like lower(concat('%', :query, '%'))
            or lower(coalesce(p.city, '')) like lower(concat('%', :query, '%'))
        )
        order by p.averageRating desc, p.reviewCount desc, s.serviceName asc
    """)
    List<ServiceOffering> findFeedCandidates(VerificationStatus status, String category, String query, Pageable pageable);
}
