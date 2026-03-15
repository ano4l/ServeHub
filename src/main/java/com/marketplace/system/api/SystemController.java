package com.marketplace.system.api;

import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/system")
public class SystemController {

    @GetMapping("/modules")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public Map<String, Object> modules() {
        return Map.of(
            "phase", "modular-monolith",
            "implemented", List.of(
                "provider-onboarding-foundation",
                "catalog-service-foundation",
                "booking-service-with-audit-events",
                "payment-service-with-commission",
                "notification-service-email-templates",
                "basic-websocket-chat"
            ),
            "next", List.of(
                "redis-locks-and-rate-limits",
                "ledger-and-payouts",
                "disputes-and-refunds",
                "provider-availability-and-scheduling"
            )
        );
    }
}
