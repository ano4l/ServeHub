package com.marketplace.wallet.domain;

import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Page<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.type = 'PAYOUT' ORDER BY wt.createdAt DESC")
    Page<WalletTransaction> findPayoutsByUserId(Long userId, Pageable pageable);

    @Query("SELECT wt.balanceAfter FROM WalletTransaction wt WHERE wt.user.id = :userId ORDER BY wt.createdAt DESC LIMIT 1")
    Optional<BigDecimal> findLatestBalanceByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt WHERE wt.user.id = :userId AND wt.type = 'EARNING'")
    BigDecimal sumEarningsByUserId(Long userId);

    @Query("""
        SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt
        WHERE wt.user.id = :userId AND wt.type = 'EARNING'
        AND EXTRACT(MONTH FROM wt.createdAt) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
        AND EXTRACT(YEAR FROM wt.createdAt) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
    """)
    BigDecimal sumEarningsThisMonthByUserId(Long userId);

    @Query("""
        SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt
        WHERE wt.user.id = :userId AND wt.type = 'EARNING'
        AND wt.relatedBooking.id IN (
            SELECT p.booking.id FROM com.marketplace.payment.domain.PaymentTransaction p
            WHERE p.status = 'AUTHORIZED'
        )
    """)
    BigDecimal sumPendingEarningsByUserId(Long userId);
}
