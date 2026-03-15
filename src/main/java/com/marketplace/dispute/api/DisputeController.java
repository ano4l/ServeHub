package com.marketplace.dispute.api;

import com.marketplace.dispute.application.DisputeService;
import com.marketplace.dispute.domain.DisputeStatus;
import com.marketplace.dispute.domain.ResolutionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/disputes")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public DisputeResponse create(@Valid @RequestBody CreateDisputeRequest request) {
        return disputeService.create(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public DisputeResponse getById(@PathVariable Long id) {
        return disputeService.getById(id);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<DisputeResponse> list(@PageableDefault(size = 10) Pageable pageable) {
        return disputeService.listForCurrentUser(pageable);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public DisputeResponse update(@PathVariable Long id, @RequestParam DisputeStatus status) {
        return disputeService.update(id, status);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public DisputeResponse resolve(@PathVariable Long id,
                                   @Valid @RequestBody ResolveDisputeRequest request) {
        return disputeService.resolve(id, request);
    }

    public record CreateDisputeRequest(
        @NotNull Long bookingId,
        @NotBlank String reason
    ) {}

    public record ResolveDisputeRequest(
        @NotNull ResolutionType resolutionType,
        String notes
    ) {}

    public record DisputeResponse(
        Long id,
        Long bookingId,
        Long openedById,
        String openedByName,
        String reason,
        DisputeStatus status,
        ResolutionType resolutionType,
        String resolutionNotes,
        String resolvedByName,
        String createdAt,
        String updatedAt
    ) {}
}
