package com.marketplace.catalog.domain;

import com.marketplace.provider.domain.VerificationStatus;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findByCategoryIgnoreCase(String category);
    Page<ServiceOffering> findByCategoryIgnoreCase(String category, Pageable pageable);
    List<ServiceOffering> findByProviderIdOrderByServiceNameAsc(Long providerId);
    List<ServiceOffering> findByProviderIdAndCategoryIgnoreCase(Long providerId, String category);
    Page<ServiceOffering> findByProviderIdAndCategoryIgnoreCase(Long providerId, String category, Pageable pageable);
    Page<ServiceOffering> findByProviderId(Long providerId, Pageable pageable);

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

    @Query("""
        select s from ServiceOffering s
        join s.provider p
        join p.user u
        where p.verificationStatus in :statuses
        and (:categoryKey is null or lower(s.category) = :categoryKey)
        and (:cityPattern is null or lower(coalesce(p.city, '')) like :cityPattern)
        and (
            :queryPattern is null
            or lower(s.serviceName) like :queryPattern
            or lower(s.category) like :queryPattern
            or lower(u.fullName) like :queryPattern
            or lower(coalesce(p.bio, '')) like :queryPattern
            or lower(coalesce(p.city, '')) like :queryPattern
        )
        and (:minPrice is null or s.price >= :minPrice)
        and (:maxPrice is null or s.price <= :maxPrice)
        and (
            :lat is null
            or :lng is null
            or (
                p.latitude is not null
                and p.longitude is not null
                and (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude))
                    * cos(radians(p.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radiusKm
            )
        )
        order by p.averageRating desc, p.reviewCount desc, s.serviceName asc
    """)
    Page<ServiceOffering> searchCatalog(
        List<VerificationStatus> statuses,
        String categoryKey,
        String cityPattern,
        String queryPattern,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Double lat,
        Double lng,
        Double radiusKm,
        Pageable pageable
    );

    @Query("""
        select s from ServiceOffering s
        where s.provider.id = :providerId
        and (:categoryKey is null or lower(s.category) = :categoryKey)
        and (
            :queryPattern is null
            or lower(s.serviceName) like :queryPattern
            or lower(s.category) like :queryPattern
        )
        and (:minPrice is null or s.price >= :minPrice)
        and (:maxPrice is null or s.price <= :maxPrice)
        order by s.serviceName asc
    """)
    Page<ServiceOffering> searchByProvider(
        Long providerId,
        String categoryKey,
        String queryPattern,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Pageable pageable
    );
}
