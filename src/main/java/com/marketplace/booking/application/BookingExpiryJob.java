package com.marketplace.booking.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingEvent;
import com.marketplace.booking.domain.BookingEventRepository;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.booking.domain.BookingStatus;
import com.marketplace.messaging.application.RealtimeMessagingService;
import com.marketplace.notification.application.NotificationService;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BookingExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(BookingExpiryJob.class);

    private final BookingRepository bookingRepository;
    private final BookingEventRepository eventRepository;
    private final NotificationService notificationService;
    private final RealtimeMessagingService realtimeMessagingService;
    private final int autoExpireMinutes;

    public BookingExpiryJob(BookingRepository bookingRepository,
                            BookingEventRepository eventRepository,
                            NotificationService notificationService,
                            RealtimeMessagingService realtimeMessagingService,
                            @Value("${app.booking.auto-expire-minutes:30}") int autoExpireMinutes) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.notificationService = notificationService;
        this.realtimeMessagingService = realtimeMessagingService;
        this.autoExpireMinutes = autoExpireMinutes;
    }

    @Scheduled(fixedDelayString = "${app.booking.expiry-check-interval-ms:60000}")
    @Transactional
    public void expireStaleBookings() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(autoExpireMinutes);
        List<Booking> stale = bookingRepository.findByStatusAndCreatedAtBefore(
            BookingStatus.REQUESTED, cutoff);

        if (stale.isEmpty()) {
            return;
        }

        log.info("Expiring {} stale REQUESTED bookings older than {} minutes", stale.size(), autoExpireMinutes);

        for (Booking booking : stale) {
            try {
                booking.transitionTo(BookingStatus.EXPIRED);
                BookingEvent event = eventRepository.save(new BookingEvent(
                    booking, "AUTO_EXPIRED",
                    "Booking auto-expired after " + autoExpireMinutes + " minutes without provider response"));
                notificationService.sendBookingUpdate(booking,
                    "Booking expired",
                    "Your booking request expired because the provider did not respond within "
                        + autoExpireMinutes + " minutes.");
                realtimeMessagingService.publishBookingUpdate(booking, event);
            } catch (Exception e) {
                log.warn("Failed to expire booking {}: {}", booking.getId(), e.getMessage());
            }
        }
    }
}
