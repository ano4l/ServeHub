package com.marketplace.notification.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.notification.domain.Notification;
import com.marketplace.notification.domain.NotificationRepository;
import com.marketplace.payment.domain.PaymentTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;

    public NotificationService(JavaMailSender mailSender, NotificationRepository notificationRepository) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
    }

    public void sendBookingUpdate(Booking booking, String headline, String detail) {
        String subject = "[ServeHub] " + headline;
        String body = """
            Booking: %s
            Customer: %s
            Provider: %s
            Status: %s
            Address: %s

            %s
            """.formatted(
            booking.getId(),
            booking.getCustomer().getFullName(),
            booking.getProvider().getUser().getFullName(),
            booking.getStatus(),
            booking.getAddress(),
            detail
        );
        send(booking.getCustomer().getEmail(), subject, body);
        send(booking.getProvider().getUser().getEmail(), subject, body);

        createInApp(booking.getCustomer(), "BOOKING", headline, detail, "/bookings/" + booking.getId());
        createInApp(booking.getProvider().getUser(), "BOOKING", headline, detail, "/bookings/" + booking.getId());
    }

    public void sendPaymentReceipt(PaymentTransaction payment) {
        String subject = "[ServeHub] Payment " + payment.getStatus();
        String body = """
            Payment reference: %s
            Booking: %s
            Status: %s
            Gross: %s
            Commission: %s
            Provider net: %s
            """.formatted(
            payment.getReference(),
            payment.getBooking().getId(),
            payment.getStatus(),
            payment.getGrossAmount(),
            payment.getCommissionAmount(),
            payment.getProviderNetAmount()
        );
        send(payment.getBooking().getCustomer().getEmail(), subject, body);
    }

    public void sendPasswordResetEmail(String email, String token) {
        String subject = "[ServeHub] Password Reset Request";
        String body = """
            You have requested a password reset.

            Use this token to reset your password: %s

            This token expires in 1 hour.

            If you did not request this, please ignore this email.
            """.formatted(token);
        send(email, subject, body);
    }

    public void sendEmailVerification(String email, String token) {
        String subject = "[ServeHub] Verify Your Email";
        String body = """
            Welcome to ServeHub!

            Please verify your email using this token: %s

            This token expires in 24 hours.
            """.formatted(token);
        send(email, subject, body);
    }

    public void createInApp(UserAccount user, String type, String title, String message, String link) {
        try {
            notificationRepository.save(new Notification(user, type, title,
                message.length() > 1000 ? message.substring(0, 1000) : message, link));
        } catch (Exception e) {
            log.warn("Failed to create in-app notification for user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void send(String email, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception exception) {
            log.info("Mail delivery skipped for {}: {}", email, exception.getMessage());
        }
    }
}
