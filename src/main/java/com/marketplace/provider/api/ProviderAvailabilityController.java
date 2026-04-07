package com.marketplace.provider.api;

import com.marketplace.provider.application.ProviderAvailabilityService;
import com.marketplace.provider.application.ProviderAvailabilityService.BookableDay;
import com.marketplace.provider.application.ProviderAvailabilityService.AvailabilitySlot;
import com.marketplace.provider.application.ProviderAvailabilityService.AvailabilitySlotRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/providers")
public class ProviderAvailabilityController {

    private final ProviderAvailabilityService availabilityService;

    public ProviderAvailabilityController(ProviderAvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/{providerId}/availability")
    public List<AvailabilitySlot> getAvailability(@PathVariable Long providerId) {
        return availabilityService.getAvailability(providerId);
    }

    @GetMapping("/{providerId}/availability/slots")
    public List<BookableDay> getBookableSlots(
            @PathVariable Long providerId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(defaultValue = "60") int durationMinutes,
            @RequestParam(required = false) Long excludeBookingId) {
        return availabilityService.getBookableDays(
            providerId,
            from,
            days,
            durationMinutes,
            excludeBookingId
        );
    }

    @PutMapping("/me/availability")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public List<AvailabilitySlot> setAvailability(
            @Valid @RequestBody List<AvailabilitySlotRequest> slots) {
        return availabilityService.setAvailability(slots);
    }

    @DeleteMapping("/me/availability/{dayOfWeek}")
    @PreAuthorize("hasAnyRole('PROVIDER','ADMIN')")
    public void deleteSlot(@PathVariable int dayOfWeek) {
        availabilityService.deleteSlot(dayOfWeek);
    }
}
