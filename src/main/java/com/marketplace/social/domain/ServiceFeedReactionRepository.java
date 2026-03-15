package com.marketplace.social.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ServiceFeedReactionRepository extends JpaRepository<ServiceFeedReaction, Long> {
    Optional<ServiceFeedReaction> findByServiceOfferingIdAndUserIdAndType(Long serviceOfferingId, Long userId, FeedReactionType type);

    List<ServiceFeedReaction> findByUserIdAndServiceOfferingIdIn(Long userId, List<Long> serviceOfferingIds);

    @Query("""
        select r.serviceOffering.id as serviceOfferingId, r.type as type, count(r) as total
        from ServiceFeedReaction r
        where r.serviceOffering.id in :serviceOfferingIds
        group by r.serviceOffering.id, r.type
    """)
    List<ReactionCountView> countByServiceOfferingIds(List<Long> serviceOfferingIds);

    interface ReactionCountView {
        Long getServiceOfferingId();
        FeedReactionType getType();
        long getTotal();
    }
}
