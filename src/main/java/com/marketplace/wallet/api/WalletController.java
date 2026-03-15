package com.marketplace.wallet.api;

import com.marketplace.wallet.application.WalletService;
import com.marketplace.wallet.domain.TransactionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wallet")
@PreAuthorize("isAuthenticated()")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/balance")
    public BalanceResponse getBalance() {
        return walletService.getBalance();
    }

    @GetMapping("/transactions")
    public Page<TransactionResponse> getTransactions(@PageableDefault(size = 20) Pageable pageable) {
        return walletService.getTransactions(pageable);
    }

    @GetMapping("/payouts")
    public Page<TransactionResponse> getPayouts(@PageableDefault(size = 20) Pageable pageable) {
        return walletService.getPayouts(pageable);
    }

    @PostMapping("/payouts")
    @PreAuthorize("hasRole('PROVIDER')")
    public TransactionResponse requestPayout(@Valid @RequestBody PayoutRequest request) {
        return walletService.requestPayout(request.amount());
    }

    public record PayoutRequest(
        @NotNull @DecimalMin("1.00") BigDecimal amount
    ) {}

    public record BalanceResponse(
        BigDecimal available,
        BigDecimal pending,
        BigDecimal totalEarnings,
        BigDecimal thisMonth
    ) {}

    public record TransactionResponse(
        Long id,
        TransactionType type,
        BigDecimal amount,
        String reference,
        String description,
        BigDecimal balanceAfter,
        Long relatedBookingId,
        String createdAt
    ) {}
}
