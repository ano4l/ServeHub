package com.marketplace.payment.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "payfast")
public class PayFastConfig {

    private String merchantId;
    private String merchantKey;
    private String passphrase;
    private boolean sandbox = true;
    private String returnUrl;
    private String cancelUrl;
    private String notifyUrl;

    public String getBaseUrl() {
        return sandbox
            ? "https://sandbox.payfast.co.za/eng/process"
            : "https://www.payfast.co.za/eng/process";
    }

    public String getPayoutBaseUrl() {
        return sandbox
            ? "https://api.payfast.co.za/payouts"
            : "https://api.payfast.co.za/payouts";
    }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
    public String getMerchantKey() { return merchantKey; }
    public void setMerchantKey(String merchantKey) { this.merchantKey = merchantKey; }
    public String getPassphrase() { return passphrase; }
    public void setPassphrase(String passphrase) { this.passphrase = passphrase; }
    public boolean isSandbox() { return sandbox; }
    public void setSandbox(boolean sandbox) { this.sandbox = sandbox; }
    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
    public String getNotifyUrl() { return notifyUrl; }
    public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }
}
