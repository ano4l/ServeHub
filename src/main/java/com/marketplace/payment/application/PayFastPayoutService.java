package com.marketplace.payment.application;

import com.marketplace.identity.domain.UserAccount;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.wallet.domain.WalletTransaction;
import com.marketplace.wallet.domain.WalletTransactionRepository;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayFastPayoutService {

    private static final Logger log = LoggerFactory.getLogger(PayFastPayoutService.class);

    private final PayFastConfig config;
    private final WalletTransactionRepository walletRepository;
    private final ProviderProfileRepository providerRepository;

    public PayFastPayoutService(PayFastConfig config,
                                  WalletTransactionRepository walletRepository,
                                  ProviderProfileRepository providerRepository) {
        this.config = config;
        this.walletRepository = walletRepository;
        this.providerRepository = providerRepository;
    }

    /**
     * Send a payout to a provider via PayFast Payouts API.
     * Requires the provider to have bank details stored.
     */
    @Transactional
    public PayoutResult sendPayout(Long providerUserId, BigDecimal amount, String bankAccountNumber,
                                     String bankCode, String accountHolderName) {
        var provider = providerRepository.findByUserId(providerUserId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found"));

        String payoutId = "payout_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Build PayFast payout request
        Map<String, String> data = Map.of(
            "merchant_id", config.getMerchantId(),
            "merchant_key", config.getMerchantKey(),
            "payout_id", payoutId,
            "amount", amount.setScale(2).toPlainString(),
            "bank_account_number", bankAccountNumber,
            "bank_code", bankCode,
            "account_holder_name", accountHolderName,
            "reference", "Payout for provider " + provider.getId()
        );

        String signature = generateSignature(data, config.getPassphrase());

        // In production, this would make an actual HTTP POST to PayFast
        // For sandbox/development, we simulate success
        if (config.isSandbox()) {
            log.info("[SANDBOX] Payout {} simulated for provider {} amount R{}",
                     payoutId, provider.getId(), amount);
            return new PayoutResult(true, payoutId, "sandbox_simulated");
        }

        try {
            boolean success = postPayoutToPayFast(data, signature);
            if (success) {
                log.info("PayFast payout {} initiated for provider {} amount R{}",
                         payoutId, provider.getId(), amount);
                return new PayoutResult(true, payoutId, "initiated");
            } else {
                log.error("PayFast payout failed for provider {}", provider.getId());
                return new PayoutResult(false, null, "api_error");
            }
        } catch (Exception e) {
            log.error("PayFast payout exception", e);
            return new PayoutResult(false, null, e.getMessage());
        }
    }

    private boolean postPayoutToPayFast(Map<String, String> data, String signature) throws Exception {
        URL url = new URL(config.getPayoutBaseUrl() + "/create");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setDoOutput(true);

        StringBuilder postData = new StringBuilder();
        for (Map.Entry<String, String> entry : data.entrySet()) {
            if (postData.length() > 0) postData.append("&");
            postData.append(entry.getKey()).append("=")
                    .append(java.net.URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        postData.append("&signature=").append(signature);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(postData.toString().getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        return responseCode == 200 || responseCode == 201;
    }

    private String generateSignature(Map<String, String> data, String passphrase) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : data.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toList())) {
            if (sb.length() > 0) sb.append("&");
            sb.append(entry.getKey()).append("=").append(entry.getValue().trim());
        }
        if (passphrase != null && !passphrase.isEmpty()) {
            sb.append("&passphrase=").append(passphrase.trim());
        }
        return md5(sb.toString());
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new RuntimeException("MD5 failed", e);
        }
    }

    public record PayoutResult(boolean success, String payoutId, String status) {}
}
