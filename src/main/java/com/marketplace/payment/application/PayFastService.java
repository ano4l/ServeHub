package com.marketplace.payment.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.payment.domain.PaymentTransaction;
import com.marketplace.payment.domain.PaymentTransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayFastService {

    private static final Logger log = LoggerFactory.getLogger(PayFastService.class);

    private final PayFastConfig config;
    private final PaymentTransactionRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BigDecimal commissionRate;

    public PayFastService(PayFastConfig config,
                          PaymentTransactionRepository paymentRepository,
                          BookingRepository bookingRepository,
                          @Value("${app.commission.default-rate}") BigDecimal commissionRate) {
        this.config = config;
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.commissionRate = commissionRate;
    }

    /**
     * Generate a PayFast checkout URL for a booking.
     * Creates the PaymentTransaction if it doesn't exist yet.
     */
    @Transactional
    public CheckoutResult initiateCheckout(Long bookingId, String buyerEmail, String buyerFirstName) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));

        // Create or get existing payment
        PaymentTransaction payment = paymentRepository.findByBookingId(bookingId)
            .orElseGet(() -> {
                BigDecimal commission = booking.getQuotedPrice()
                    .multiply(commissionRate)
                    .setScale(2, RoundingMode.HALF_UP);
                BigDecimal providerNet = booking.getQuotedPrice().subtract(commission);
                return paymentRepository.save(new PaymentTransaction(
                    booking,
                    booking.getQuotedPrice(),
                    commission,
                    providerNet,
                    "pf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20)
                ));
            });

        // Build PayFast form data
        Map<String, String> data = new LinkedHashMap<>();
        data.put("merchant_id", config.getMerchantId());
        data.put("merchant_key", config.getMerchantKey());
        data.put("return_url", config.getReturnUrl() + "?booking_id=" + bookingId);
        data.put("cancel_url", config.getCancelUrl() + "?booking_id=" + bookingId);
        data.put("notify_url", config.getNotifyUrl());

        if (buyerEmail != null && !buyerEmail.isBlank()) {
            data.put("email_address", buyerEmail.trim());
        }
        if (buyerFirstName != null && !buyerFirstName.isBlank()) {
            data.put("name_first", buyerFirstName.trim());
        }

        data.put("m_payment_id", payment.getReference());
        data.put("amount", booking.getQuotedPrice().setScale(2, RoundingMode.HALF_UP).toPlainString());
        data.put("item_name", "Booking #" + bookingId);
        data.put("item_description", booking.getServiceOffering().getServiceName());
        data.put("custom_str1", String.valueOf(bookingId));

        // Generate signature
        String signature = generateSignature(data, config.getPassphrase());
        data.put("signature", signature);

        // Build checkout URL with query params
        String queryString = data.entrySet().stream()
            .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
            .collect(Collectors.joining("&"));

        String checkoutUrl = config.getBaseUrl() + "?" + queryString;

        log.info("PayFast checkout initiated for booking {} ref={}", bookingId, payment.getReference());
        return new CheckoutResult(checkoutUrl, payment.getReference(), payment.getId());
    }

    /**
     * Validate and process PayFast ITN (Instant Transaction Notification).
     * Called when PayFast POSTs to our notify URL after payment.
     */
    @Transactional
    public boolean processItn(Map<String, String> params) {
        String paymentRef = params.get("m_payment_id");
        String paymentStatus = params.get("payment_status");
        String pfPaymentId = params.get("pf_payment_id");
        String amountGross = params.get("amount_gross");

        log.info("PayFast ITN received: ref={} status={} pfId={}", paymentRef, paymentStatus, pfPaymentId);

        if (paymentRef == null || paymentRef.isBlank()) {
            log.warn("ITN missing m_payment_id");
            return false;
        }

        // Validate signature
        if (!validateItnSignature(params)) {
            log.warn("ITN signature validation failed for ref={}", paymentRef);
            return false;
        }

        // Find our payment
        PaymentTransaction payment = paymentRepository.findByReference(paymentRef).orElse(null);
        if (payment == null) {
            log.warn("ITN: payment not found for ref={}", paymentRef);
            return false;
        }

        // Validate amount
        if (amountGross != null) {
            BigDecimal itnAmount = new BigDecimal(amountGross);
            if (itnAmount.compareTo(payment.getGrossAmount()) != 0) {
                log.warn("ITN amount mismatch: expected={} got={}", payment.getGrossAmount(), itnAmount);
                return false;
            }
        }

        // Process based on status
        switch (paymentStatus != null ? paymentStatus : "") {
            case "COMPLETE" -> {
                payment.markAuthorized();
                payment.setPayfastPaymentId(pfPaymentId);
                log.info("Payment AUTHORIZED for booking {} ref={}", payment.getBooking().getId(), paymentRef);
            }
            case "CANCELLED" -> {
                log.info("Payment CANCELLED for booking {} ref={}", payment.getBooking().getId(), paymentRef);
            }
            default -> {
                log.info("Payment status {} for ref={}", paymentStatus, paymentRef);
            }
        }

        return true;
    }

    /**
     * Generate MD5 signature for PayFast data.
     */
    static String generateSignature(Map<String, String> data, String passphrase) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(encode(entry.getKey())).append("=").append(encode(entry.getValue().trim()));
            }
        }
        if (passphrase != null && !passphrase.isEmpty()) {
            sb.append("&passphrase=").append(encode(passphrase.trim()));
        }
        return md5(sb.toString());
    }

    private boolean validateItnSignature(Map<String, String> params) {
        String receivedSignature = params.get("signature");
        if (receivedSignature == null) return false;

        // Rebuild data map without signature
        Map<String, String> data = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!"signature".equals(entry.getKey())) {
                data.put(entry.getKey(), entry.getValue());
            }
        }

        String expected = generateSignature(data, config.getPassphrase());
        return expected.equalsIgnoreCase(receivedSignature);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("MD5 hashing failed", e);
        }
    }

    public record CheckoutResult(String checkoutUrl, String reference, Long paymentId) {}
}
