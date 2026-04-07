package com.marketplace.messaging.application;

import com.marketplace.booking.api.BookingController.BookingResponse;
import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingEvent;
import com.marketplace.messaging.api.ChatController.ChatMessageResponse;
import com.marketplace.notification.domain.Notification;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class RealtimeMessagingService {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeMessagingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishChatMessage(Booking booking, ChatMessageResponse message) {
        publishToParticipants(
            booking,
            "/queue/bookings/" + booking.getId() + "/chat",
            message
        );
    }

    public void publishBookingUpdate(Booking booking, BookingEvent event) {
        BookingRealtimeEvent payload = new BookingRealtimeEvent(
            booking.getId(),
            event.getEventType(),
            event.getDetail(),
            event.getOccurredAt(),
            toBookingResponse(booking)
        );

        afterCommit(() -> {
            for (String userId : participantUserIds(booking)) {
                messagingTemplate.convertAndSendToUser(userId, "/queue/bookings", payload);
                messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/bookings/" + booking.getId() + "/events",
                    payload
                );
            }
        });
    }

    public void publishNotification(Notification notification) {
        NotificationRealtimeEvent payload = new NotificationRealtimeEvent(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            notification.isRead(),
            notification.getLink(),
            notification.getCreatedAt()
        );

        afterCommit(() -> messagingTemplate.convertAndSendToUser(
            notification.getUser().getId().toString(),
            "/queue/notifications",
            payload
        ));
    }

    private void publishToParticipants(Booking booking, String destination, Object payload) {
        afterCommit(() -> {
            for (String userId : participantUserIds(booking)) {
                messagingTemplate.convertAndSendToUser(userId, destination, payload);
            }
        });
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()
            || !TransactionSynchronizationManager.isActualTransactionActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private Set<String> participantUserIds(Booking booking) {
        Set<String> userIds = new LinkedHashSet<>();
        userIds.add(booking.getCustomer().getId().toString());
        userIds.add(booking.getProvider().getUser().getId().toString());
        return userIds;
    }

    private BookingResponse toBookingResponse(Booking booking) {
        return new BookingResponse(
            booking.getId(),
            booking.getStatus(),
            booking.getCustomer().getId(),
            booking.getCustomer().getFullName(),
            booking.getProvider().getId(),
            booking.getProvider().getUser().getFullName(),
            booking.getServiceOffering().getId(),
            booking.getServiceOffering().getServiceName(),
            booking.getScheduledFor(),
            booking.getAddress(),
            booking.getNotes(),
            booking.getQuotedPrice(),
            booking.getCancelledReason(),
            booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null
        );
    }

    public record BookingRealtimeEvent(
        Long bookingId,
        String eventType,
        String detail,
        OffsetDateTime occurredAt,
        BookingResponse booking
    ) {
    }

    public record NotificationRealtimeEvent(
        Long id,
        String type,
        String title,
        String message,
        boolean read,
        String link,
        OffsetDateTime createdAt
    ) {
    }
}
