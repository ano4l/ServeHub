package com.marketplace.identity.application;

import com.marketplace.identity.api.AuthController.AuthResponse;
import com.marketplace.identity.api.AuthController.LoginRequest;
import com.marketplace.identity.api.AuthController.RefreshRequest;
import com.marketplace.identity.api.AuthController.RegisterRequest;
import com.marketplace.identity.domain.EmailVerificationToken;
import com.marketplace.identity.domain.EmailVerificationTokenRepository;
import com.marketplace.identity.domain.PasswordResetToken;
import com.marketplace.identity.domain.PasswordResetTokenRepository;
import com.marketplace.identity.domain.RefreshToken;
import com.marketplace.identity.domain.RefreshTokenRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.notification.application.NotificationService;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserAccountRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ProviderProfileRepository providerRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshTokenExpirationMs;

    public AuthService(UserAccountRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       ProviderProfileRepository providerRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailVerificationTokenRepository emailVerificationTokenRepository,
                       NotificationService notificationService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${jwt.refresh-token-expiration}") long refreshTokenExpirationMs) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.providerRepository = providerRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
            throw new IllegalArgumentException("Email already registered");
        });

        UserAccount user = userRepository.save(new UserAccount(
            request.fullName(),
            request.email(),
            request.phoneNumber(),
            passwordEncoder.encode(request.password()),
            request.role()
        ));

        if (request.role() == Role.PROVIDER) {
            if (request.city() == null || request.city().isBlank()
                || request.serviceRadiusKm() == null
                || request.bio() == null || request.bio().isBlank()) {
                throw new IllegalArgumentException("Provider registration requires city, serviceRadiusKm, and bio");
            }
            providerRepository.save(new ProviderProfile(
                user,
                VerificationStatus.PENDING_REVIEW,
                request.city(),
                request.serviceRadiusKm(),
                request.bio()
            ));
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new EntityNotFoundException("Invalid credentials"));

        if (user.isLocked()) {
            throw new IllegalArgumentException("Account is locked. Try again later.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(OffsetDateTime.now().plusMinutes(LOCKOUT_MINUTES));
                log.warn("Account locked for user: {} after {} failed attempts", user.getEmail(), MAX_FAILED_ATTEMPTS);
            }
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
            .orElseThrow(() -> new EntityNotFoundException("Refresh token not found"));

        if (refreshToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshToken.revoke();
            throw new IllegalArgumentException("Refresh token expired");
        }

        refreshToken.revoke();
        return issueTokens(refreshToken.getUser());
    }

    @Transactional
    public void requestPasswordReset(String email) {
        UserAccount user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        String token = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(new PasswordResetToken(
            user, token, OffsetDateTime.now().plusHours(1)
        ));

        try {
            notificationService.sendPasswordResetEmail(user.getEmail(), token);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        resetToken.markUsed();
        UserAccount user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
    }

    @Transactional
    public void sendEmailVerification(UserAccount user) {
        String token = UUID.randomUUID().toString();
        emailVerificationTokenRepository.save(new EmailVerificationToken(
            user, token, OffsetDateTime.now().plusHours(24)
        ));

        try {
            notificationService.sendEmailVerification(user.getEmail(), token);
        } catch (Exception e) {
            log.error("Failed to send email verification to: {}", user.getEmail(), e);
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByTokenAndUsedFalse(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));

        if (verificationToken.isExpired()) {
            throw new IllegalArgumentException("Verification token has expired");
        }

        verificationToken.markUsed();
        UserAccount user = verificationToken.getUser();
        user.setEmailVerified(true);
    }

    private AuthResponse issueTokens(UserAccount user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = UUID.randomUUID().toString() + UUID.randomUUID();

        RefreshToken refreshToken = refreshTokenRepository.save(new RefreshToken(
            user,
            refreshTokenValue,
            OffsetDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000)
        ));

        Long providerId = providerRepository.findByUserId(user.getId())
            .map(ProviderProfile::getId)
            .orElse(null);

        return new AuthResponse(
            user.getId(),
            providerId,
            user.getFullName(),
            user.getEmail(),
            user.getPhoneNumber(),
            user.getRole(),
            user.isEmailVerified(),
            accessToken,
            refreshToken.getToken()
        );
    }
}
