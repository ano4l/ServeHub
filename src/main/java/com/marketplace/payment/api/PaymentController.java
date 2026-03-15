package com.marketplace.payment.api;

import com.marketplace.payment.application.PaymentService;
import com.marketplace.payment.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public PaymentResponse getByBookingId(@PathVariable Long bookingId) {
        return paymentService.getByBookingId(bookingId);
    }

    @PostMapping("/booking/{bookingId}/authorize")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public PaymentResponse authorize(@PathVariable Long bookingId) {
        return paymentService.authorize(bookingId);
    }

    @PostMapping("/booking/{bookingId}/capture")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public PaymentResponse capture(@PathVariable Long bookingId) {
        return paymentService.capture(bookingId);
    }

    @PostMapping("/booking/{bookingId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public PaymentResponse refund(@PathVariable Long bookingId) {
        return paymentService.refund(bookingId);
    }

    public record PaymentResponse(
        Long id,
        Long bookingId,
        PaymentStatus status,
        BigDecimal grossAmount,
        BigDecimal commissionAmount,
        BigDecimal providerNetAmount,
        String reference,
        OffsetDateTime updatedAt
    ) {
    }
}
