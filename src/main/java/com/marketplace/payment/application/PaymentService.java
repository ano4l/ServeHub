package com.marketplace.payment.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.notification.application.NotificationService;
import com.marketplace.payment.api.PaymentController.PaymentResponse;
import com.marketplace.payment.domain.PaymentTransaction;
import com.marketplace.payment.domain.PaymentTransactionRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final NotificationService notificationService;
    private final BigDecimal commissionRate;
    private final CurrentUserService currentUserService;

    public PaymentService(PaymentTransactionRepository paymentRepository,
                          NotificationService notificationService,
                          @Value("${app.commission.default-rate}") BigDecimal commissionRate,
                          CurrentUserService currentUserService) {
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.commissionRate = commissionRate;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public PaymentResponse createForBooking(Booking booking) {
        return paymentRepository.findByBookingId(booking.getId())
            .map(this::toResponse)
            .orElseGet(() -> {
                BigDecimal commission = booking.getQuotedPrice()
                    .multiply(commissionRate)
                    .setScale(2, RoundingMode.HALF_UP);
                BigDecimal providerNet = booking.getQuotedPrice().subtract(commission);
                PaymentTransaction payment = paymentRepository.save(new PaymentTransaction(
                    booking,
                    booking.getQuotedPrice(),
                    commission,
                    providerNet,
                    "pay_" + UUID.randomUUID().toString().replace("-", "")
                ));
                notificationService.sendPaymentReceipt(payment);
                return toResponse(payment);
            });
    }

    @Transactional
    public PaymentResponse authorize(Long bookingId) {
        PaymentTransaction payment = paymentRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking " + bookingId));
        assertPaymentAccess(payment);
        payment.markAuthorized();
        notificationService.sendPaymentReceipt(payment);
        return toResponse(payment);
    }

    @Transactional
    public PaymentResponse capture(Long bookingId) {
        PaymentTransaction payment = paymentRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking " + bookingId));
        assertPaymentAccess(payment);
        payment.markCaptured();
        notificationService.sendPaymentReceipt(payment);
        return toResponse(payment);
    }

    @Transactional
    public PaymentResponse refund(Long bookingId) {
        PaymentTransaction payment = paymentRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking " + bookingId));
        assertPaymentAccess(payment);
        payment.markRefunded();
        notificationService.sendPaymentReceipt(payment);
        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getByBookingId(Long bookingId) {
        PaymentTransaction payment = paymentRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking " + bookingId));
        assertPaymentAccess(payment);
        return toResponse(payment);
    }

    private void assertPaymentAccess(PaymentTransaction payment) {
        UserAccount actor = currentUserService.requireUser();
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPPORT) {
            return;
        }
        if (actor.getRole() == Role.CUSTOMER && payment.getBooking().getCustomer().getId().equals(actor.getId())) {
            return;
        }
        if (actor.getRole() == Role.PROVIDER
            && payment.getBooking().getProvider().getUser().getId().equals(actor.getId())) {
            return;
        }
        throw new IllegalArgumentException("You do not have access to this payment");
    }

    private PaymentResponse toResponse(PaymentTransaction payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getBooking().getId(),
            payment.getStatus(),
            payment.getGrossAmount(),
            payment.getCommissionAmount(),
            payment.getProviderNetAmount(),
            payment.getReference(),
            payment.getUpdatedAt()
        );
    }
}
