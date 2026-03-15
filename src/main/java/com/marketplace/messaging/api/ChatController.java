package com.marketplace.messaging.api;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.messaging.domain.ChatMessage;
import com.marketplace.messaging.domain.ChatMessageRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final BookingRepository bookingRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUserService;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatMessageRepository chatMessageRepository,
                          BookingRepository bookingRepository,
                          UserAccountRepository userAccountRepository,
                          CurrentUserService currentUserService) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.bookingRepository = bookingRepository;
        this.userAccountRepository = userAccountRepository;
        this.currentUserService = currentUserService;
    }

    @MessageMapping("/bookings/{bookingId}/chat")
    public void send(@DestinationVariable Long bookingId, @Payload ChatMessagePayload payload) {
        if (payload.message() == null || payload.message().isBlank()) {
            return;
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        Long senderId = null;
        try { senderId = Long.parseLong(payload.sender()); } catch (NumberFormatException ignored) {}
        UserAccount sender = senderId != null ? userAccountRepository.findById(senderId).orElse(null) : null;
        if (booking != null && sender != null) {
            chatMessageRepository.save(new ChatMessage(booking, sender, payload.message().trim()));
        }

        ChatMessagePayload outbound = new ChatMessagePayload(
            bookingId,
            payload.sender(),
            payload.message().trim(),
            payload.sentAt() == null ? OffsetDateTime.now() : payload.sentAt()
        );
        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, outbound);
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
                m.getSentAt().toString()
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

        ChatMessagePayload outbound = new ChatMessagePayload(
            bookingId,
            sender.getId().toString(),
            saved.getContent(),
            saved.getSentAt()
        );
        messagingTemplate.convertAndSend("/topic/bookings/" + bookingId, outbound);

        return new ChatMessageResponse(
            saved.getId(),
            bookingId,
            sender.getId(),
            sender.getFullName(),
            saved.getContent(),
            saved.getSentAt().toString()
        );
    }

    private Booking requireAccessibleBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        UserAccount actor = currentUserService.requireUser();
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

    public record ChatMessageResponse(
        Long id,
        Long bookingId,
        Long senderId,
        String senderName,
        String content,
        String sentAt
    ) {}

    public record CreateChatMessageRequest(
        @NotBlank String content
    ) {}
}
