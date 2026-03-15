package com.marketplace.booking.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingEventRepository extends JpaRepository<BookingEvent, Long> {
    List<BookingEvent> findByBookingIdOrderByOccurredAtAsc(Long bookingId);
}
