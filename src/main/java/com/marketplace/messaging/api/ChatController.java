package com.marketplace.messaging.api;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.messaging.application.RealtimeMessagingService;
import com.marketplace.messaging.domain.ChatMessage;
import com.marketplace.messaging.domain.ChatMessageRepository;
import com.marketplace.notification.application.NotificationService;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.security.Principal;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final BookingRepository bookingRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUserService;
    private final RealtimeMessagingService realtimeMessagingService;
    private final NotificationService notificationService;

    public ChatController(ChatMessageRepository chatMessageRepository,
                          BookingRepository bookingRepository,
                          UserAccountRepository userAccountRepository,
                          CurrentUserService currentUserService,
                          RealtimeMessagingService realtimeMessagingService,
                          NotificationService notificationService) {
        this.chatMessageRepository = chatMessageRepository;
        this.bookingRepository = bookingRepository;
        this.userAccountRepository = userAccountRepository;
        this.currentUserService = currentUserService;
        this.realtimeMessagingService = realtimeMessagingService;
        this.notificationService = notificationService;
    }

    @MessageMapping("/bookings/{bookingId}/chat")
    public void send(@DestinationVariable Long bookingId, @Payload ChatMessagePayload payload, Principal principal) {
        if (payload.message() == null || payload.message().isBlank()) {
            return;
        }

        UserAccount sender = requirePrincipalUser(principal);
        Booking booking = requireAccessibleBooking(bookingId, sender);
        ChatMessage saved = chatMessageRepository.save(new ChatMessage(
            booking,
            sender,
            payload.message().trim()
        ));

        ChatMessageResponse outbound = new ChatMessageResponse(
            saved.getId(),
            bookingId,
            sender.getId(),
            sender.getFullName(),
            saved.getContent(),
            saved.getSentAt().toString(),
            payload.clientMessageId()
        );
        realtimeMessagingService.publishChatMessage(booking, outbound);
        notificationService.sendChatMessageNotification(booking, sender, saved.getContent());
    }

    @GetMapping("/bookings/{bookingId}/messages")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public Page<ChatMessageResponse> getMessages(@PathVariable Long bookingId,
                                                 @PageableDefault(size = 50) Pageable pageable) {
        Booking booking = requireAccessibleBooking(bookingId);
        return chatMessageRepository.findByBookingIdOrderBySentAtAsc(booking.getId(), pageable)
            .map(m -> new ChatMessageResponse(
                m.getId(),
                m.getBooking().getId(),
                m.getSender().getId(),
                m.getSender().getFullName(),
                m.getContent(),
                m.getSentAt().toString(),
                null
            ));
    }

    @PostMapping("/bookings/{bookingId}/messages")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ChatMessageResponse sendMessage(@PathVariable Long bookingId,
                                           @Valid @RequestBody CreateChatMessageRequest request) {
        Booking booking = requireAccessibleBooking(bookingId);
        UserAccount sender = currentUserService.requireUser();

        ChatMessage saved = chatMessageRepository.save(new ChatMessage(
            booking,
            sender,
            request.content().trim()
        ));

        ChatMessageResponse response = new ChatMessageResponse(
            saved.getId(),
            bookingId,
            sender.getId(),
            sender.getFullName(),
            saved.getContent(),
            saved.getSentAt().toString(),
            request.clientMessageId()
        );
        realtimeMessagingService.publishChatMessage(booking, response);
        notificationService.sendChatMessageNotification(booking, sender, saved.getContent());

        return response;
    }

    private Booking requireAccessibleBooking(Long bookingId) {
        return requireAccessibleBooking(bookingId, currentUserService.requireUser());
    }

    private Booking requireAccessibleBooking(Long bookingId, UserAccount actor) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPPORT) {
            return booking;
        }
        if (actor.getRole() == Role.CUSTOMER && booking.getCustomer().getId().equals(actor.getId())) {
            return booking;
        }
        if (actor.getRole() == Role.PROVIDER && booking.getProvider().getUser().getId().equals(actor.getId())) {
            return booking;
        }
        throw new IllegalArgumentException("You do not have access to this booking conversation");
    }

    private UserAccount requirePrincipalUser(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("Unauthenticated WebSocket session");
        }
        try {
            Long userId = Long.parseLong(principal.getName());
            return userAccountRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("Invalid WebSocket principal", error);
        }
    }

    public record ChatMessageResponse(
        Long id,
        Long bookingId,
        Long senderId,
        String senderName,
        String content,
        String sentAt,
        String clientMessageId
    ) {}

    public record CreateChatMessageRequest(
        @NotBlank String content,
        String clientMessageId
    ) {}
}
