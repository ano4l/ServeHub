package com.marketplace.messaging.api;

import java.time.OffsetDateTime;

public record ChatMessagePayload(
    Long bookingId,
    String sender,
    String message,
    OffsetDateTime sentAt,
    String clientMessageId
) {
}
