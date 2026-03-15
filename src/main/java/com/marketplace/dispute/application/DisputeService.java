package com.marketplace.dispute.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.booking.domain.BookingStatus;
import com.marketplace.dispute.api.DisputeController.CreateDisputeRequest;
import com.marketplace.dispute.api.DisputeController.DisputeResponse;
import com.marketplace.dispute.api.DisputeController.ResolveDisputeRequest;
import com.marketplace.dispute.domain.Dispute;
import com.marketplace.dispute.domain.DisputeRepository;
import com.marketplace.dispute.domain.DisputeStatus;
import com.marketplace.dispute.domain.ResolutionType;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisputeService {

    private static final Set<BookingStatus> DISPUTABLE_STATUSES = Set.of(
        BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED, BookingStatus.REVIEWABLE
    );

    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final CurrentUserService currentUserService;

    public DisputeService(DisputeRepository disputeRepository,
                          BookingRepository bookingRepository,
                          CurrentUserService currentUserService) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public DisputeResponse create(CreateDisputeRequest request) {
        UserAccount user = currentUserService.requireUser();
        Booking booking = bookingRepository.findById(request.bookingId())
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + request.bookingId()));

        boolean isCustomer = booking.getCustomer().getId().equals(user.getId());
        boolean isProvider = booking.getProvider().getUser().getId().equals(user.getId());
        if (!isCustomer && !isProvider) {
            throw new IllegalArgumentException("Only booking participants can file a dispute");
        }

        if (!DISPUTABLE_STATUSES.contains(booking.getStatus())) {
            throw new IllegalArgumentException("Booking is not in a disputable state");
        }

        if (disputeRepository.existsByBookingIdAndStatusIn(
                request.bookingId(), List.of(DisputeStatus.OPEN, DisputeStatus.IN_REVIEW))) {
            throw new IllegalArgumentException("An active dispute already exists for this booking");
        }

        Dispute dispute = disputeRepository.save(new Dispute(booking, user, request.reason()));
        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getById(Long id) {
        Dispute dispute = disputeRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Dispute not found: " + id));
        assertDisputeAccess(dispute);
        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> listForCurrentUser(Pageable pageable) {
        UserAccount user = currentUserService.requireUser();
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT) {
            return disputeRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
        }
        return disputeRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> listAll(Pageable pageable) {
        return disputeRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> listByStatus(DisputeStatus status, Pageable pageable) {
        return disputeRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    @Transactional
    public DisputeResponse update(Long id, DisputeStatus newStatus) {
        UserAccount user = currentUserService.requireUser();
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.SUPPORT) {
            throw new IllegalArgumentException("Only admin or support can update dispute status");
        }
        Dispute dispute = disputeRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Dispute not found: " + id));
        if (newStatus == DisputeStatus.IN_REVIEW) {
            dispute.markInReview();
        } else if (newStatus == DisputeStatus.CLOSED) {
            dispute.close();
        } else {
            throw new IllegalArgumentException("Use resolve endpoint to resolve disputes");
        }
        return toResponse(dispute);
    }

    @Transactional
    public DisputeResponse resolve(Long id, ResolveDisputeRequest request) {
        UserAccount user = currentUserService.requireUser();
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.SUPPORT) {
            throw new IllegalArgumentException("Only admin or support can resolve disputes");
        }
        Dispute dispute = disputeRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Dispute not found: " + id));

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.CLOSED) {
            throw new IllegalArgumentException("Dispute is already resolved or closed");
        }

        dispute.resolve(request.resolutionType(), request.notes(), user);
        return toResponse(dispute);
    }

    private void assertDisputeAccess(Dispute dispute) {
        UserAccount user = currentUserService.requireUser();
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPPORT) return;
        boolean isOpener = dispute.getOpenedBy().getId().equals(user.getId());
        boolean isCustomer = dispute.getBooking().getCustomer().getId().equals(user.getId());
        boolean isProvider = dispute.getBooking().getProvider().getUser().getId().equals(user.getId());
        if (!isOpener && !isCustomer && !isProvider) {
            throw new IllegalArgumentException("You do not have access to this dispute");
        }
    }

    private DisputeResponse toResponse(Dispute d) {
        return new DisputeResponse(
            d.getId(),
            d.getBooking().getId(),
            d.getOpenedBy().getId(),
            d.getOpenedBy().getFullName(),
            d.getReason(),
            d.getStatus(),
            d.getResolutionType(),
            d.getResolutionNotes(),
            d.getResolvedBy() != null ? d.getResolvedBy().getFullName() : null,
            d.getCreatedAt().toString(),
            d.getUpdatedAt().toString()
        );
    }
}
