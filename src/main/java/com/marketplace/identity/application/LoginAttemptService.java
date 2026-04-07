package com.marketplace.identity.application;

import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserAccountRepository userRepository;

    public LoginAttemptService(UserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedLogin(Long userId) {
        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(OffsetDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            log.warn("Account locked for user: {} after {} failed attempts", user.getEmail(), MAX_FAILED_ATTEMPTS);
        }
    }
}
