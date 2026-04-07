package com.marketplace.security;

import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final String issuer;

    private static final String UNSAFE_DEFAULT = "mySecretKey123456789012345678901234567890";

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.access-token-expiration}") long accessTokenExpirationMs,
                      @Value("${jwt.issuer}") String issuer,
                      @Value("${spring.profiles.active:dev}") String activeProfile) {
        if ("prod".equalsIgnoreCase(activeProfile) && UNSAFE_DEFAULT.equals(secret)) {
            throw new IllegalStateException(
                "JWT_SECRET must be set to a secure value in production. "
                + "Refusing to start with the default development secret.");
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException exception) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.issuer = issuer;
    }

    public String generateAccessToken(UserAccount user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(issuer)
            .subject(String.valueOf(user.getId()))
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
            .claims(Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name()
            ))
            .signWith(secretKey)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }

    public Role extractRole(String token) {
        return Role.valueOf(parse(token).get("role", String.class));
    }
}
