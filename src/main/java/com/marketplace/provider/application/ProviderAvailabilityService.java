package com.marketplace.provider.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.booking.domain.BookingRepository;
import com.marketplace.booking.domain.BookingStatus;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.ProviderAvailability;
import com.marketplace.provider.domain.ProviderAvailabilityRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.security.CurrentUserService;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProviderAvailabilityService {

    private static final ZoneId SCHEDULE_ZONE = ZoneId.of("Africa/Johannesburg");
    private static final int SLOT_STEP_MINUTES = 30;
    private static final String[] DAY_NAMES = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };
    private static final Set<BookingStatus> NON_BLOCKING_STATUSES = Set.of(
        BookingStatus.DECLINED,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED
    );

    private final ProviderAvailabilityRepository availabilityRepository;
    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerRepository;
    private final CurrentUserService currentUserService;

    public ProviderAvailabilityService(ProviderAvailabilityRepository availabilityRepository,
                                       BookingRepository bookingRepository,
                                       ProviderProfileRepository providerRepository,
                                       CurrentUserService currentUserService) {
        this.availabilityRepository = availabilityRepository;
        this.bookingRepository = bookingRepository;
        this.providerRepository = providerRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlot> getAvailability(Long providerId) {
        providerRepository.findById(providerId)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + providerId));
        return availabilityRepository.findByProviderIdOrderByDayOfWeekAsc(providerId)
            .stream()
            .map(AvailabilitySlot::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BookableDay> getBookableDays(Long providerId,
                                             LocalDate from,
                                             int days,
                                             int durationMinutes,
                                             Long excludeBookingId) {
        if (days < 1 || days > 30) {
            throw new IllegalArgumentException("days must be between 1 and 30");
        }
        if (durationMinutes < 30 || durationMinutes > 12 * 60) {
            throw new IllegalArgumentException("durationMinutes must be between 30 and 720");
        }

        providerRepository.findById(providerId)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + providerId));

        LocalDate startDate = from == null ? LocalDate.now(SCHEDULE_ZONE) : from;
        LocalDate endDateExclusive = startDate.plusDays(days);
        Map<Integer, ProviderAvailability> availabilityByDay = availabilityRepository
            .findByProviderIdOrderByDayOfWeekAsc(providerId)
            .stream()
            .filter(ProviderAvailability::isEnabled)
            .collect(java.util.stream.Collectors.toMap(
                ProviderAvailability::getDayOfWeek,
                slot -> slot
            ));

        OffsetDateTime lookupStart = startDate.minusDays(1).atStartOfDay(SCHEDULE_ZONE).toOffsetDateTime();
        OffsetDateTime lookupEnd = endDateExclusive.plusDays(1).atStartOfDay(SCHEDULE_ZONE).toOffsetDateTime();
        List<Booking> blockingBookings = bookingRepository
            .findByProviderIdAndScheduledForBetweenOrderByScheduledForAsc(providerId, lookupStart, lookupEnd)
            .stream()
            .filter(this::blocksAvailability)
            .filter(booking -> excludeBookingId == null || !booking.getId().equals(excludeBookingId))
            .toList();

        return startDate.datesUntil(endDateExclusive)
            .map(date -> buildBookableDay(date, availabilityByDay.get(toAvailabilityDay(date)), blockingBookings, durationMinutes))
            .toList();
    }

    @Transactional(readOnly = true)
    public void assertBookable(Long providerId,
                               OffsetDateTime scheduledFor,
                               int durationMinutes,
                               Long excludeBookingId) {
        if (durationMinutes < 30) {
            throw new IllegalArgumentException("Booking duration must be at least 30 minutes");
        }

        ProviderProfile provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new EntityNotFoundException("Provider not found: " + providerId));

        ZonedDateTime candidateStart = scheduledFor.toInstant().atZone(SCHEDULE_ZONE);
        ZonedDateTime candidateEnd = candidateStart.plusMinutes(durationMinutes);
        LocalDate localDate = candidateStart.toLocalDate();
        ProviderAvailability availability = availabilityRepository.findByProviderIdAndDayOfWeek(
            provider.getId(),
            toAvailabilityDay(localDate)
        ).orElseThrow(() -> new IllegalArgumentException("Provider is not available on the selected day"));

        if (!availability.isEnabled()) {
            throw new IllegalArgumentException("Provider is not available on the selected day");
        }

        ZonedDateTime windowStart = ZonedDateTime.of(localDate, availability.getStartTime(), SCHEDULE_ZONE);
        ZonedDateTime windowEnd = ZonedDateTime.of(localDate, availability.getEndTime(), SCHEDULE_ZONE);
        if (candidateStart.isBefore(windowStart) || candidateEnd.isAfter(windowEnd)) {
            throw new IllegalArgumentException("Selected time falls outside the provider's working hours");
        }

        OffsetDateTime lookupStart = localDate.minusDays(1).atStartOfDay(SCHEDULE_ZONE).toOffsetDateTime();
        OffsetDateTime lookupEnd = localDate.plusDays(2).atStartOfDay(SCHEDULE_ZONE).toOffsetDateTime();
        boolean overlaps = bookingRepository
            .findByProviderIdAndScheduledForBetweenOrderByScheduledForAsc(providerId, lookupStart, lookupEnd)
            .stream()
            .filter(this::blocksAvailability)
            .filter(booking -> excludeBookingId == null || !booking.getId().equals(excludeBookingId))
            .anyMatch(booking -> overlaps(
                candidateStart.toOffsetDateTime(),
                candidateEnd.toOffsetDateTime(),
                booking.getScheduledFor(),
                booking.getScheduledFor().plusMinutes(durationFor(booking))
            ));

        if (overlaps) {
            throw new IllegalArgumentException("Selected time is no longer available");
        }
    }

    @Transactional
    public List<AvailabilitySlot> setAvailability(List<AvailabilitySlotRequest> slots) {
        ProviderProfile provider = requireCurrentProvider();

        for (AvailabilitySlotRequest slot : slots) {
            if (slot.dayOfWeek() < 0 || slot.dayOfWeek() > 6) {
                throw new IllegalArgumentException("dayOfWeek must be 0-6, got: " + slot.dayOfWeek());
            }
            LocalTime start = LocalTime.parse(slot.startTime());
            LocalTime end = LocalTime.parse(slot.endTime());
            if (!end.isAfter(start)) {
                throw new IllegalArgumentException(
                    "endTime must be after startTime for day " + slot.dayOfWeek());
            }

            var existing = availabilityRepository.findByProviderIdAndDayOfWeek(
                provider.getId(), slot.dayOfWeek());

            if (existing.isPresent()) {
                ProviderAvailability entity = existing.get();
                entity.setStartTime(start);
                entity.setEndTime(end);
                entity.setEnabled(slot.enabled() == null || slot.enabled());
            } else {
                availabilityRepository.save(new ProviderAvailability(
                    provider, slot.dayOfWeek(), start, end,
                    slot.enabled() == null || slot.enabled()));
            }
        }

        return availabilityRepository.findByProviderIdOrderByDayOfWeekAsc(provider.getId())
            .stream()
            .map(AvailabilitySlot::from)
            .toList();
    }

    @Transactional
    public void deleteSlot(int dayOfWeek) {
        ProviderProfile provider = requireCurrentProvider();
        availabilityRepository.deleteByProviderIdAndDayOfWeek(provider.getId(), dayOfWeek);
    }

    private ProviderProfile requireCurrentProvider() {
        UserAccount user = currentUserService.requireUser();
        if (user.getRole() != Role.PROVIDER && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only providers can manage availability");
        }
        return providerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new EntityNotFoundException("Provider profile not found"));
    }

    private BookableDay buildBookableDay(LocalDate date,
                                         ProviderAvailability availability,
                                         List<Booking> bookings,
                                         int durationMinutes) {
        int dayOfWeek = toAvailabilityDay(date);
        if (availability == null || !availability.isEnabled()) {
            return new BookableDay(
                date,
                dayOfWeek,
                DAY_NAMES[dayOfWeek],
                false,
                null,
                null,
                List.of()
            );
        }

        ZonedDateTime windowStart = ZonedDateTime.of(date, availability.getStartTime(), SCHEDULE_ZONE);
        ZonedDateTime windowEnd = ZonedDateTime.of(date, availability.getEndTime(), SCHEDULE_ZONE);
        ZonedDateTime candidateStart = roundUpToSlotBoundary(windowStart);
        ZonedDateTime nowCutoff = roundUpToSlotBoundary(ZonedDateTime.now(SCHEDULE_ZONE).plusMinutes(SLOT_STEP_MINUTES));
        if (candidateStart.toLocalDate().equals(nowCutoff.toLocalDate()) && candidateStart.isBefore(nowCutoff)) {
            candidateStart = nowCutoff;
        }

        ZonedDateTime lastStart = windowEnd.minusMinutes(durationMinutes);
        List<BookableSlot> slots = new java.util.ArrayList<>();

        while (!candidateStart.isAfter(lastStart)) {
            OffsetDateTime start = candidateStart.toOffsetDateTime();
            OffsetDateTime end = candidateStart.plusMinutes(durationMinutes).toOffsetDateTime();
            boolean overlaps = bookings.stream().anyMatch(booking -> overlaps(
                start,
                end,
                booking.getScheduledFor(),
                booking.getScheduledFor().plusMinutes(durationFor(booking))
            ));
            if (!overlaps) {
                slots.add(new BookableSlot(start, end, candidateStart.toLocalTime().toString()));
            }
            candidateStart = candidateStart.plusMinutes(SLOT_STEP_MINUTES);
        }

        return new BookableDay(
            date,
            dayOfWeek,
            DAY_NAMES[dayOfWeek],
            true,
            availability.getStartTime().toString(),
            availability.getEndTime().toString(),
            slots
        );
    }

    private ZonedDateTime roundUpToSlotBoundary(ZonedDateTime value) {
        int minute = value.getMinute();
        int remainder = minute % SLOT_STEP_MINUTES;
        if (remainder == 0 && value.getSecond() == 0 && value.getNano() == 0) {
            return value.withSecond(0).withNano(0);
        }
        return value
            .plusMinutes(remainder == 0 ? 0 : SLOT_STEP_MINUTES - remainder)
            .withSecond(0)
            .withNano(0);
    }

    private boolean blocksAvailability(Booking booking) {
        return !NON_BLOCKING_STATUSES.contains(booking.getStatus());
    }

    private int durationFor(Booking booking) {
        Integer duration = booking.getServiceOffering().getEstimatedDurationMinutes();
        return duration == null || duration < 30 ? 60 : duration;
    }

    private boolean overlaps(OffsetDateTime startA,
                             OffsetDateTime endA,
                             OffsetDateTime startB,
                             OffsetDateTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private int toAvailabilityDay(LocalDate date) {
        return date.getDayOfWeek().getValue() % 7;
    }

    public record AvailabilitySlotRequest(
        int dayOfWeek,
        String startTime,
        String endTime,
        Boolean enabled
    ) {}

    public record AvailabilitySlot(
        Long id,
        int dayOfWeek,
        String dayName,
        String startTime,
        String endTime,
        boolean enabled
    ) {
        static AvailabilitySlot from(ProviderAvailability entity) {
            return new AvailabilitySlot(
                entity.getId(),
                entity.getDayOfWeek(),
                DAY_NAMES[entity.getDayOfWeek()],
                entity.getStartTime().toString(),
                entity.getEndTime().toString(),
                entity.isEnabled()
            );
        }
    }

    public record BookableDay(
        LocalDate date,
        int dayOfWeek,
        String dayName,
        boolean enabled,
        String startTime,
        String endTime,
        List<BookableSlot> slots
    ) {
    }

    public record BookableSlot(
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        String label
    ) {
    }
}
