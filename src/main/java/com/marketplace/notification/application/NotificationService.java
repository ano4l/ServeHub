package com.marketplace.notification.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.messaging.application.RealtimeMessagingService;
import com.marketplace.notification.domain.Notification;
import com.marketplace.notification.domain.NotificationDevice;
import com.marketplace.notification.domain.NotificationDeviceRepository;
import com.marketplace.notification.domain.NotificationPreference;
import com.marketplace.notification.domain.NotificationPreferenceRepository;
import com.marketplace.notification.domain.NotificationRepository;
import com.marketplace.payment.domain.PaymentTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository prefRepository;
    private final NotificationDeviceRepository deviceRepository;
    private final RealtimeMessagingService realtimeMessagingService;
    private final FcmPushNotificationService fcmPushNotificationService;

    public NotificationService(JavaMailSender mailSender,
                               NotificationRepository notificationRepository,
                               NotificationPreferenceRepository prefRepository,
                               NotificationDeviceRepository deviceRepository,
                               RealtimeMessagingService realtimeMessagingService,
                               FcmPushNotificationService fcmPushNotificationService) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
        this.prefRepository = prefRepository;
        this.deviceRepository = deviceRepository;
        this.realtimeMessagingService = realtimeMessagingService;
        this.fcmPushNotificationService = fcmPushNotificationService;
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

        deliverUserNotification(booking.getCustomer(), "BOOKING", headline, detail, "/bookings/" + booking.getId());
        deliverUserNotification(booking.getProvider().getUser(), "BOOKING", headline, detail, "/bookings/" + booking.getId());
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
        deliverUserNotification(
            payment.getBooking().getCustomer(),
            "PAYMENT",
            "Payment " + payment.getStatus(),
            "Payment update for booking #" + payment.getBooking().getId(),
            "/bookings/" + payment.getBooking().getId()
        );
    }

    public void sendChatMessageNotification(Booking booking, UserAccount sender, String messagePreview) {
        UserAccount recipient = booking.getCustomer().getId().equals(sender.getId())
            ? booking.getProvider().getUser()
            : booking.getCustomer();

        String title = "New message from " + sender.getFullName();
        String detail = messagePreview.length() > 120
            ? messagePreview.substring(0, 120) + "..."
            : messagePreview;

        deliverUserNotification(recipient, "MESSAGE", title, detail, "/chat/" + booking.getId());
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

    public Notification createInApp(UserAccount user, String type, String title, String message, String link) {
        try {
            Notification notification = notificationRepository.save(new Notification(user, type, title,
                message.length() > 1000 ? message.substring(0, 1000) : message, link));
            realtimeMessagingService.publishNotification(notification);
            return notification;
        } catch (Exception e) {
            log.warn("Failed to create in-app notification for user {}: {}", user.getId(), e.getMessage());
            return null;
        }
    }

    public void registerDevice(UserAccount user, String token, String platform, String appVersion, String locale) {
        if (token == null || token.isBlank()) {
            return;
        }
        var device = deviceRepository.findByToken(token)
            .orElseGet(() -> new NotificationDevice(
                user, token, normalizePlatform(platform), appVersion, locale
            ));
        device.setUser(user);
        device.setPlatform(normalizePlatform(platform));
        device.setAppVersion(appVersion);
        device.setLocale(locale);
        device.setActive(true);
        device.markSeen();
        deviceRepository.save(device);
    }

    public void unregisterDevice(UserAccount user, String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        deviceRepository.findByToken(token)
            .filter(device -> device.getUser().getId().equals(user.getId()))
            .ifPresent(device -> {
                device.setActive(false);
                deviceRepository.save(device);
            });
    }

    private void deliverUserNotification(UserAccount user, String type, String title, String message, String link) {
        Notification notification = createInApp(user, type, title, message, link);
        if (notification == null) {
            return;
        }

        NotificationPreference preference = prefRepository.findByUserId(user.getId())
            .orElseGet(() -> prefRepository.save(new NotificationPreference(user)));
        if (!shouldSendPush(preference, type)) {
            return;
        }

        fcmPushNotificationService.sendToDevices(
            deviceRepository.findByUserIdAndActiveTrue(user.getId()),
            type,
            title,
            message,
            link
        );
    }

    private boolean shouldSendPush(NotificationPreference preference, String type) {
        if (!preference.isPushEnabled()) {
            return false;
        }

        return switch (type.toUpperCase()) {
            case "MESSAGE" -> preference.isMessages();
            case "PROMOTION" -> preference.isPromotions();
            default -> preference.isBookingUpdates();
        };
    }

    private String normalizePlatform(String platform) {
        if (platform == null || platform.isBlank()) {
            return "UNKNOWN";
        }
        return platform.trim().toUpperCase();
    }

    @Async
    void send(String email, String subject, String body) {
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
