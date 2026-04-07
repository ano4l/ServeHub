package com.marketplace.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final int requestsPerMinute;
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public RateLimitingFilter(
            @Value("${app.rate-limit.requests-per-minute:60}") int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = resolveKey(request);
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(requestsPerMinute));

        if (bucket.tryConsume()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.getRemaining()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"message\":\"Rate limit exceeded. Try again later.\",\"status\":429}");
            response.setHeader("Retry-After", "60");
        }
    }

    private String resolveKey(HttpServletRequest request) {
        // Use authenticated user if available, otherwise IP
        var principal = request.getUserPrincipal();
        if (principal != null) {
            return "user:" + principal.getName();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Don't rate-limit health checks, actuator, or WebSocket
        return path.startsWith("/actuator") || path.startsWith("/ws")
            || path.equals("/livez") || path.equals("/readyz");
    }

    private static class TokenBucket {
        private final int maxTokens;
        private final AtomicInteger tokens;
        private volatile long lastRefillTimestamp;

        TokenBucket(int maxTokens) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.lastRefillTimestamp = Instant.now().getEpochSecond();
        }

        boolean tryConsume() {
            refill();
            return tokens.getAndUpdate(current -> current > 0 ? current - 1 : 0) > 0;
        }

        int getRemaining() {
            refill();
            return tokens.get();
        }

        private void refill() {
            long now = Instant.now().getEpochSecond();
            long elapsed = now - lastRefillTimestamp;
            if (elapsed >= 60) {
                tokens.set(maxTokens);
                lastRefillTimestamp = now;
            }
        }
    }
}
