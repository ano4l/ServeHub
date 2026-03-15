package com.marketplace.booking.domain;

import java.util.EnumSet;
import java.util.Set;

public enum BookingStatus {
    REQUESTED,
    ACCEPTED,
    IN_PROGRESS,
    COMPLETED,
    DECLINED,
    EXPIRED,
    CANCELLED,
    REVIEWABLE;

    public Set<BookingStatus> allowedNextStatuses() {
        return switch (this) {
            case REQUESTED -> EnumSet.of(ACCEPTED, DECLINED, EXPIRED, CANCELLED);
            case ACCEPTED -> EnumSet.of(IN_PROGRESS, CANCELLED);
            case IN_PROGRESS -> EnumSet.of(COMPLETED);
            case COMPLETED -> EnumSet.of(REVIEWABLE);
            default -> EnumSet.noneOf(BookingStatus.class);
        };
    }
}
