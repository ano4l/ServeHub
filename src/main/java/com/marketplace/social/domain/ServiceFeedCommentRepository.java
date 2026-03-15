package com.marketplace.social.domain;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceFeedCommentRepository extends JpaRepository<ServiceFeedComment, Long> {
    List<ServiceFeedComment> findByServiceOfferingIdOrderByCreatedAtDesc(Long serviceOfferingId, Pageable pageable);

    List<ServiceFeedComment> findByServiceOfferingIdInOrderByCreatedAtDesc(List<Long> serviceOfferingIds, Pageable pageable);

    @Query("""
        select c.serviceOffering.id as serviceOfferingId, count(c) as total
        from ServiceFeedComment c
        where c.serviceOffering.id in :serviceOfferingIds
        group by c.serviceOffering.id
    """)
    List<CommentCountView> countByServiceOfferingIds(List<Long> serviceOfferingIds);

    interface CommentCountView {
        Long getServiceOfferingId();
        long getTotal();
    }
}
