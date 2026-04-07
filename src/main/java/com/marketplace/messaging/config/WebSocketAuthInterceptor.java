package com.marketplace.messaging.config;

import com.marketplace.identity.domain.Role;
import com.marketplace.security.JwtService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtService jwtService;

    public WebSocketAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    Long userId = jwtService.extractUserId(token);
                    Role role = jwtService.extractRole(token);
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
                    var auth = new UsernamePasswordAuthenticationToken(
                        userId.toString(), null, authorities);
                    accessor.setUser(auth);
                    log.debug("WebSocket CONNECT authenticated for userId={}", userId);
                } catch (Exception e) {
                    log.warn("WebSocket CONNECT auth failed: {}", e.getMessage());
                }
            }
        }

        return message;
    }
}
