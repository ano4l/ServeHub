package com.marketplace.wallet.application;

import com.marketplace.booking.domain.Booking;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.security.CurrentUserService;
import com.marketplace.wallet.api.WalletController.BalanceResponse;
import com.marketplace.wallet.api.WalletController.TransactionResponse;
import com.marketplace.wallet.domain.TransactionType;
import com.marketplace.wallet.domain.WalletTransaction;
import com.marketplace.wallet.domain.WalletTransactionRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

    private final WalletTransactionRepository walletRepository;
    private final CurrentUserService currentUserService;

    public WalletService(WalletTransactionRepository walletRepository,
                         CurrentUserService currentUserService) {
        this.walletRepository = walletRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public BalanceResponse getBalance() {
        UserAccount user = currentUserService.requireUser();
        BigDecimal available = walletRepository.findLatestBalanceByUserId(user.getId())
            .orElse(BigDecimal.ZERO);
        BigDecimal totalEarnings = walletRepository.sumEarningsByUserId(user.getId());
        BigDecimal thisMonth = walletRepository.sumEarningsThisMonthByUserId(user.getId());
        BigDecimal pending = walletRepository.sumPendingEarningsByUserId(user.getId());
        return new BalanceResponse(available, pending, totalEarnings, thisMonth);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(Pageable pageable) {
        UserAccount user = currentUserService.requireUser();
        return walletRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getPayouts(Pageable pageable) {
        UserAccount user = currentUserService.requireUser();
        return walletRepository.findPayoutsByUserId(user.getId(), pageable)
            .map(this::toResponse);
    }

    @Transactional
    public TransactionResponse requestPayout(BigDecimal amount) {
        UserAccount user = currentUserService.requireUser();
        BigDecimal available = walletRepository.findLatestBalanceByUserId(user.getId())
            .orElse(BigDecimal.ZERO);

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payout amount must be positive");
        }
        if (amount.compareTo(available) > 0) {
            throw new IllegalArgumentException("Insufficient balance for payout");
        }

        BigDecimal newBalance = available.subtract(amount);
        String ref = "payout_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        WalletTransaction tx = walletRepository.save(new WalletTransaction(
            user, TransactionType.PAYOUT, amount.negate(), ref,
            "Payout request", newBalance, null
        ));
        return toResponse(tx);
    }

    @Transactional
    public void creditEarning(UserAccount provider, BigDecimal amount, Booking booking, String description) {
        BigDecimal currentBalance = walletRepository.findLatestBalanceByUserId(provider.getId())
            .orElse(BigDecimal.ZERO);
        BigDecimal newBalance = currentBalance.add(amount);
        String ref = "earn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        walletRepository.save(new WalletTransaction(
            provider, TransactionType.EARNING, amount, ref,
            description, newBalance, booking
        ));
    }

    @Transactional
    public void debitRefund(UserAccount provider, BigDecimal amount, Booking booking, String description) {
        BigDecimal currentBalance = walletRepository.findLatestBalanceByUserId(provider.getId())
            .orElse(BigDecimal.ZERO);
        BigDecimal newBalance = currentBalance.subtract(amount);
        String ref = "refund_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        walletRepository.save(new WalletTransaction(
            provider, TransactionType.REFUND, amount.negate(), ref,
            description, newBalance, booking
        ));
    }

    private TransactionResponse toResponse(WalletTransaction tx) {
        return new TransactionResponse(
            tx.getId(),
            tx.getType(),
            tx.getAmount(),
            tx.getReference(),
            tx.getDescription(),
            tx.getBalanceAfter(),
            tx.getRelatedBooking() != null ? tx.getRelatedBooking().getId() : null,
            tx.getCreatedAt().toString()
        );
    }
}
