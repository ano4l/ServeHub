package com.marketplace.notification.api;

import com.marketplace.identity.domain.UserAccount;
import com.marketplace.notification.application.NotificationService;
import com.marketplace.notification.domain.Notification;
import com.marketplace.notification.domain.NotificationPreference;
import com.marketplace.notification.domain.NotificationPreferenceRepository;
import com.marketplace.notification.domain.NotificationRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository prefRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    public NotificationController(NotificationRepository notificationRepository,
                                  NotificationPreferenceRepository prefRepository,
                                  CurrentUserService currentUserService,
                                  NotificationService notificationService) {
        this.notificationRepository = notificationRepository;
        this.prefRepository = prefRepository;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public Page<NotificationResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        UserAccount user = currentUserService.requireUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
            .map(this::toResponse);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public NotificationResponse markRead(@PathVariable Long id) {
        UserAccount user = currentUserService.requireUser();
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + id));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Cannot access this notification");
        }
        n.markRead();
        return toResponse(n);
    }

    @PatchMapping("/read-all")
    @Transactional
    public int markAllRead() {
        UserAccount user = currentUserService.requireUser();
        return notificationRepository.markAllReadByUserId(user.getId());
    }

    @GetMapping("/preferences")
    public PreferenceResponse getPreferences() {
        UserAccount user = currentUserService.requireUser();
        NotificationPreference pref = prefRepository.findByUserId(user.getId())
            .orElseGet(() -> prefRepository.save(new NotificationPreference(user)));
        return toPreferenceResponse(pref);
    }

    @PutMapping("/preferences")
    @Transactional
    public PreferenceResponse updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
        UserAccount user = currentUserService.requireUser();
        NotificationPreference pref = prefRepository.findByUserId(user.getId())
            .orElseGet(() -> prefRepository.save(new NotificationPreference(user)));
        if (request.emailEnabled() != null) pref.setEmailEnabled(request.emailEnabled());
        if (request.pushEnabled() != null) pref.setPushEnabled(request.pushEnabled());
        if (request.smsEnabled() != null) pref.setSmsEnabled(request.smsEnabled());
        if (request.bookingUpdates() != null) pref.setBookingUpdates(request.bookingUpdates());
        if (request.messages() != null) pref.setMessages(request.messages());
        if (request.promotions() != null) pref.setPromotions(request.promotions());
        return toPreferenceResponse(pref);
    }

    @PutMapping("/devices")
    @Transactional
    public DeviceResponse registerDevice(@Valid @RequestBody UpdateDeviceRequest request) {
        UserAccount user = currentUserService.requireUser();
        notificationService.registerDevice(
            user,
            request.token(),
            request.platform(),
            request.appVersion(),
            request.locale()
        );
        return new DeviceResponse("registered");
    }

    @PutMapping("/devices/unregister")
    @Transactional
    public DeviceResponse unregisterDevice(@Valid @RequestBody UnregisterDeviceRequest request) {
        UserAccount user = currentUserService.requireUser();
        notificationService.unregisterDevice(user, request.token());
        return new DeviceResponse("unregistered");
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
            n.getId(), n.getType(), n.getTitle(), n.getMessage(),
            n.isRead(), n.getLink(), n.getCreatedAt().toString()
        );
    }

    private PreferenceResponse toPreferenceResponse(NotificationPreference p) {
        return new PreferenceResponse(
            p.isEmailEnabled(), p.isPushEnabled(), p.isSmsEnabled(),
            p.isBookingUpdates(), p.isMessages(), p.isPromotions()
        );
    }

    public record NotificationResponse(
        Long id, String type, String title, String message,
        boolean read, String link, String createdAt
    ) {}

    public record UpdatePreferencesRequest(
        Boolean emailEnabled, Boolean pushEnabled, Boolean smsEnabled,
        Boolean bookingUpdates, Boolean messages, Boolean promotions
    ) {}

    public record PreferenceResponse(
        boolean emailEnabled, boolean pushEnabled, boolean smsEnabled,
        boolean bookingUpdates, boolean messages, boolean promotions
    ) {}

    public record UpdateDeviceRequest(
        @NotBlank String token,
        @NotBlank String platform,
        String appVersion,
        String locale
    ) {}

    public record UnregisterDeviceRequest(
        @NotBlank String token
    ) {}

    public record DeviceResponse(String status) {}
}
