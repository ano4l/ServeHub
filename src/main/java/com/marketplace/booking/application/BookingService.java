package com.marketplace.booking.application;

import com.marketplace.booking.api.BookingController.BookingEventResponse;
import com.marketplace.booking.api.BookingController.BookingResponse;
import com.marketplace.booking.api.BookingController.CreateBookingRequest;
import com.marketplace.booking.api.BookingController.UpdateBookingStatusRequest;
import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingEvent;
import com.marketplace.booking.domain.BookingEventRepository;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.booking.domain.BookingStatus;
import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.catalog.domain.ServiceOfferingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.notification.application.NotificationService;
import com.marketplace.payment.application.PaymentService;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingEventRepository eventRepository;
    private final UserAccountRepository userRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public BookingService(BookingRepository bookingRepository, BookingEventRepository eventRepository,
                          UserAccountRepository userRepository,
                          ServiceOfferingRepository serviceRepository, PaymentService paymentService,
                          NotificationService notificationService, CurrentUserService currentUserService) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listBookings() {
        UserAccount actor = currentUserService.requireUser();
        List<Booking> bookings = switch (actor.getRole()) {
            case ADMIN, SUPPORT -> bookingRepository.findAll();
            case CUSTOMER -> bookingRepository.findByCustomerId(actor.getId());
            case PROVIDER -> bookingRepository.findByProviderUserId(actor.getId());
        };
        return bookings.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long bookingId) {
        return toResponse(requireAccessibleBooking(bookingId));
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        UserAccount actor = currentUserService.requireUser();
        Long customerId = request.customerId() != null ? request.customerId() : actor.getId();
        if (actor.getRole() == Role.CUSTOMER && !actor.getId().equals(customerId)) {
            throw new IllegalArgumentException("Customers may only create bookings for themselves");
        }

        Long offeringId = request.serviceOfferingId() != null ? request.serviceOfferingId() : request.offeringId();
        if (offeringId == null) {
            throw new IllegalArgumentException("serviceOfferingId is required");
        }

        OffsetDateTime scheduledFor = request.scheduledFor() != null ? request.scheduledFor() : request.scheduledAt();
        if (scheduledFor == null || !scheduledFor.isAfter(OffsetDateTime.now())) {
            throw new IllegalArgumentException("scheduledFor must be in the future");
        }

        UserAccount customer = userRepository.findById(customerId)
            .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + customerId));
        if (customer.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("User is not a customer: " + customerId);
        }

        ServiceOffering offering = serviceRepository.findById(offeringId)
            .orElseThrow(() -> new EntityNotFoundException("Service offering not found: " + offeringId));
        ProviderProfile provider = offering.getProvider();
        if (request.providerId() != null && !offering.getProvider().getId().equals(request.providerId())) {
            throw new IllegalArgumentException("Service offering does not belong to provider");
        }
        if (provider.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalArgumentException("Provider must be VERIFIED before accepting bookings");
        }

        Booking booking = bookingRepository.save(new Booking(
            customer,
            provider,
            offering,
            scheduledFor,
            request.address(),
            request.notes(),
            offering.getPrice()
        ));
        eventRepository.save(new BookingEvent(booking, "BOOKING_CREATED", "Booking requested by customer"));
        paymentService.createForBooking(booking);
        notificationService.sendBookingUpdate(booking, "Booking requested", "Your booking request has been created.");

        return toResponse(booking);
    }

    @Transactional
    public BookingResponse updateStatus(Long bookingId, UpdateBookingStatusRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        assertBookingAccess(booking);

        booking.transitionTo(request.status());
        eventRepository.save(new BookingEvent(
            booking,
            "STATUS_CHANGED",
            "Status changed to " + request.status() + (request.reason() == null ? "" : " (" + request.reason() + ")")
        ));
        if (request.status() == com.marketplace.booking.domain.BookingStatus.ACCEPTED) {
            paymentService.authorize(booking.getId());
        }
        if (request.status() == com.marketplace.booking.domain.BookingStatus.COMPLETED) {
            paymentService.capture(booking.getId());
        }
        if (request.status() == com.marketplace.booking.domain.BookingStatus.CANCELLED) {
            paymentService.refund(booking.getId());
        }
        notificationService.sendBookingUpdate(
            booking,
            "Booking " + request.status(),
            request.reason() == null ? "Booking status updated." : request.reason()
        );

        return toResponse(booking);
    }

    @Transactional
    public BookingResponse accept(Long bookingId) {
        return updateStatus(bookingId, new UpdateBookingStatusRequest(com.marketplace.booking.domain.BookingStatus.ACCEPTED, "Accepted by provider"));
    }

    @Transactional
    public BookingResponse decline(Long bookingId, String reason) {
        return updateStatus(bookingId, new UpdateBookingStatusRequest(com.marketplace.booking.domain.BookingStatus.DECLINED, reason));
    }

    @Transactional
    public BookingResponse start(Long bookingId) {
        return updateStatus(bookingId, new UpdateBookingStatusRequest(com.marketplace.booking.domain.BookingStatus.IN_PROGRESS, "Work started"));
    }

    @Transactional
    public BookingResponse complete(Long bookingId) {
        return updateStatus(bookingId, new UpdateBookingStatusRequest(BookingStatus.COMPLETED, "Work completed"));
    }

    @Transactional
    public BookingResponse cancel(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        assertBookingAccess(booking);

        Set<BookingStatus> cancellable = Set.of(BookingStatus.REQUESTED, BookingStatus.ACCEPTED);
        if (!cancellable.contains(booking.getStatus())) {
            throw new IllegalArgumentException("Booking cannot be cancelled in status: " + booking.getStatus());
        }

        booking.transitionTo(BookingStatus.CANCELLED);
        booking.setCancelledReason(reason);
        eventRepository.save(new BookingEvent(booking, "BOOKING_CANCELLED", "Cancelled: " + reason));
        paymentService.refund(booking.getId());
        notificationService.sendBookingUpdate(booking, "Booking Cancelled", reason);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse reschedule(Long bookingId, OffsetDateTime newScheduledFor, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        assertBookingAccess(booking);

        Set<BookingStatus> reschedulable = Set.of(BookingStatus.REQUESTED, BookingStatus.ACCEPTED);
        if (!reschedulable.contains(booking.getStatus())) {
            throw new IllegalArgumentException("Booking cannot be rescheduled in status: " + booking.getStatus());
        }

        OffsetDateTime oldTime = booking.getScheduledFor();
        booking.setScheduledFor(newScheduledFor);
        String detail = "Rescheduled from " + oldTime + " to " + newScheduledFor
            + (reason != null ? " - " + reason : "");
        eventRepository.save(new BookingEvent(booking, "BOOKING_RESCHEDULED", detail));
        notificationService.sendBookingUpdate(booking, "Booking Rescheduled", detail);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingEventResponse> listEvents(Long bookingId) {
        Booking booking = requireAccessibleBooking(bookingId);
        return eventRepository.findByBookingIdOrderByOccurredAtAsc(bookingId).stream()
            .map(event -> new BookingEventResponse(
                event.getId(),
                event.getEventType(),
                event.getDetail(),
                event.getOccurredAt()
            ))
            .toList();
    }

    public Booking requireAccessibleBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
        assertBookingAccess(booking);
        return booking;
    }

    private void assertBookingAccess(Booking booking) {
        UserAccount actor = currentUserService.requireUser();
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPPORT) {
            return;
        }
        if (actor.getRole() == Role.CUSTOMER && booking.getCustomer().getId().equals(actor.getId())) {
            return;
        }
        if (actor.getRole() == Role.PROVIDER && booking.getProvider().getUser().getId().equals(actor.getId())) {
            return;
        }
        throw new IllegalArgumentException("You do not have access to this booking");
    }

    private BookingResponse toResponse(Booking booking) {
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
}
