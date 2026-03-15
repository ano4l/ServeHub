package com.marketplace.booking.api;

import com.marketplace.booking.application.BookingService;
import com.marketplace.booking.domain.BookingStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<BookingResponse> listBookings() {
        return bookingService.listBookings();
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse getBooking(@PathVariable Long bookingId) {
        return bookingService.getBooking(bookingId);
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return bookingService.createBooking(request);
    }

    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN','SUPPORT')")
    public BookingResponse updateStatus(@PathVariable Long bookingId,
                                        @Valid @RequestBody UpdateBookingStatusRequest request) {
        return bookingService.updateStatus(bookingId, request);
    }

    @PostMapping("/{bookingId}/accept")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public BookingResponse accept(@PathVariable Long bookingId) {
        return bookingService.accept(bookingId);
    }

    @PostMapping("/{bookingId}/decline")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public BookingResponse decline(@PathVariable Long bookingId,
                                   @Valid @RequestBody BookingReasonRequest request) {
        return bookingService.decline(bookingId, request.reason());
    }

    @PostMapping("/{bookingId}/start")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public BookingResponse start(@PathVariable Long bookingId) {
        return bookingService.start(bookingId);
    }

    @PostMapping("/{bookingId}/complete")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public BookingResponse complete(@PathVariable Long bookingId) {
        return bookingService.complete(bookingId);
    }

    @PostMapping("/{bookingId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse cancel(@PathVariable Long bookingId,
                                  @Valid @RequestBody BookingReasonRequest request) {
        return bookingService.cancel(bookingId, request.reason());
    }

    @PostMapping("/{bookingId}/reschedule")
    @PreAuthorize("isAuthenticated()")
    public BookingResponse reschedule(@PathVariable Long bookingId,
                                     @Valid @RequestBody RescheduleRequest request) {
        return bookingService.reschedule(bookingId, request.newScheduledFor(), request.reason());
    }

    @GetMapping("/{bookingId}/events")
    @PreAuthorize("isAuthenticated()")
    public List<BookingEventResponse> listEvents(@PathVariable Long bookingId) {
        return bookingService.listEvents(bookingId);
    }

    public record CreateBookingRequest(
        Long customerId,
        Long providerId,
        Long serviceOfferingId,
        @Future OffsetDateTime scheduledFor,
        @NotBlank String address,
        String notes,
        Long offeringId,
        @Future OffsetDateTime scheduledAt
    ) {
    }

    public record UpdateBookingStatusRequest(
        @NotNull BookingStatus status,
        String reason
    ) {
    }

    public record BookingReasonRequest(
        @NotBlank String reason
    ) {
    }

    public record RescheduleRequest(
        @NotNull @Future OffsetDateTime newScheduledFor,
        String reason
    ) {}

    public record BookingResponse(
        Long id,
        BookingStatus status,
        Long customerId,
        String customerName,
        Long providerId,
        String providerName,
        Long serviceOfferingId,
        String serviceName,
        OffsetDateTime scheduledFor,
        String address,
        String notes,
        BigDecimal quotedPrice,
        String cancelledReason,
        String createdAt
    ) {
    }

    public record BookingEventResponse(
        Long id,
        String eventType,
        String detail,
        OffsetDateTime occurredAt
    ) {
    }
}
