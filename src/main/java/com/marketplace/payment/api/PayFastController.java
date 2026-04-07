package com.marketplace.payment.api;

import com.marketplace.identity.domain.UserAccount;
import com.marketplace.payment.application.PayFastService;
import com.marketplace.payment.application.PayFastService.CheckoutResult;
import com.marketplace.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payfast")
public class PayFastController {

    private static final Logger log = LoggerFactory.getLogger(PayFastController.class);

    private final PayFastService payFastService;
    private final CurrentUserService currentUserService;

    public PayFastController(PayFastService payFastService,
                             CurrentUserService currentUserService) {
        this.payFastService = payFastService;
        this.currentUserService = currentUserService;
    }

    /**
     * Initiate a PayFast checkout for a booking.
     * Returns a checkout URL that the Flutter app opens in a WebView/browser.
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    public CheckoutResponse initiateCheckout(@Valid @RequestBody CheckoutRequest request) {
        UserAccount user = currentUserService.requireUser();
        CheckoutResult result = payFastService.initiateCheckout(
            request.bookingId(),
            user.getEmail(),
            user.getFullName()
        );
        return new CheckoutResponse(result.checkoutUrl(), result.reference(), result.paymentId());
    }

    /**
     * PayFast ITN (Instant Transaction Notification) webhook.
     * Called by PayFast servers after payment processing.
     * Must be publicly accessible — no auth required.
     */
    @PostMapping("/notify")
    public ResponseEntity<String> handleItn(HttpServletRequest request) {
        Map<String, String> params = new LinkedHashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values.length > 0) {
                params.put(key, values[0]);
            }
        });

        log.info("PayFast ITN received with {} params", params.size());

        boolean valid = payFastService.processItn(params);
        if (valid) {
            return ResponseEntity.ok("OK");
        } else {
            log.warn("PayFast ITN validation failed");
            return ResponseEntity.badRequest().body("INVALID");
        }
    }

    /**
     * Return URL — customer is redirected here after successful payment.
     * In practice, Flutter deep-links or app scheme would handle this.
     */
    @GetMapping("/return")
    public ResponseEntity<Map<String, String>> handleReturn(
            @RequestParam(value = "booking_id", required = false) String bookingId) {
        log.info("PayFast return for booking {}", bookingId);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Payment completed successfully",
            "bookingId", bookingId != null ? bookingId : ""
        ));
    }

    /**
     * Cancel URL — customer is redirected here if they cancel payment.
     */
    @GetMapping("/cancel")
    public ResponseEntity<Map<String, String>> handleCancel(
            @RequestParam(value = "booking_id", required = false) String bookingId) {
        log.info("PayFast cancel for booking {}", bookingId);
        return ResponseEntity.ok(Map.of(
            "status", "cancelled",
            "message", "Payment was cancelled",
            "bookingId", bookingId != null ? bookingId : ""
        ));
    }

    public record CheckoutRequest(@NotNull Long bookingId) {}

    public record CheckoutResponse(String checkoutUrl, String reference, Long paymentId) {}
}
