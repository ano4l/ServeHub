package com.marketplace.payment.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.catalog.domain.PricingType;
import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.catalog.domain.ServiceOfferingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.payment.domain.PaymentTransaction;
import com.marketplace.payment.domain.PaymentTransactionRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PaymentServiceTest {

    @Autowired private PaymentService paymentService;
    @Autowired private UserAccountRepository userRepository;
    @Autowired private ProviderProfileRepository providerRepository;
    @Autowired private ServiceOfferingRepository serviceRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private PaymentTransactionRepository paymentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Booking booking;

    @BeforeEach
    void setUp() {
        UserAccount customer = userRepository.save(new UserAccount(
            "Pay Customer", "pay-customer@test.com", "+27820000010",
            passwordEncoder.encode("pass"), Role.CUSTOMER));

        UserAccount providerUser = userRepository.save(new UserAccount(
            "Pay Provider", "pay-provider@test.com", "+27820000011",
            passwordEncoder.encode("pass"), Role.PROVIDER));

        ProviderProfile provider = providerRepository.save(new ProviderProfile(
            providerUser, VerificationStatus.VERIFIED, "Johannesburg", 20, "Payment test provider"));

        ServiceOffering offering = serviceRepository.save(new ServiceOffering(
            provider, "Electrical", "Wiring Repair", PricingType.FIXED,
            BigDecimal.valueOf(500), 90));

        booking = bookingRepository.save(new Booking(
            customer, provider, offering,
            OffsetDateTime.now().plusDays(2),
            "456 Test Ave, JHB", null,
            BigDecimal.valueOf(500)));
    }

    @Test
    void createForBooking_createsPaymentWithCorrectCommission() {
        PaymentTransaction payment = paymentService.createForBooking(booking);

        assertNotNull(payment.getId());
        assertEquals("AUTHORIZED", payment.getStatus());
        assertTrue(payment.getGrossAmount().compareTo(BigDecimal.valueOf(500)) == 0);
        // Commission should be > 0 and < gross
        assertTrue(payment.getCommissionAmount().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(payment.getCommissionAmount().compareTo(payment.getGrossAmount()) < 0);
        // Provider net = gross - commission
        assertEquals(0,
            payment.getProviderNetAmount().compareTo(
                payment.getGrossAmount().subtract(payment.getCommissionAmount())));
    }

    @Test
    void capturePayment_changesStatusToCaptured() {
        PaymentTransaction payment = paymentService.createForBooking(booking);
        PaymentTransaction captured = paymentService.capture(payment.getId());

        assertEquals("CAPTURED", captured.getStatus());
    }

    @Test
    void refundPayment_changesStatusToRefunded() {
        PaymentTransaction payment = paymentService.createForBooking(booking);
        paymentService.capture(payment.getId());
        PaymentTransaction refunded = paymentService.refund(payment.getId());

        assertEquals("REFUNDED", refunded.getStatus());
    }
}
