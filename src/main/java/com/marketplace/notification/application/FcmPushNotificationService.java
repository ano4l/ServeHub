package com.marketplace.notification.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.notification.domain.NotificationDevice;
import com.marketplace.notification.domain.NotificationDeviceRepository;
import io.jsonwebtoken.Jwts;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class FcmPushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(FcmPushNotificationService.class);

    private final ObjectMapper objectMapper;
    private final NotificationDeviceRepository deviceRepository;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String configuredProjectId;
    private final String serviceAccountPath;
    private final String tokenUri;
    private final String scope;

    private volatile CachedAccessToken cachedAccessToken;
    private volatile ServiceAccountCredentials cachedCredentials;

    public FcmPushNotificationService(
        ObjectMapper objectMapper,
        NotificationDeviceRepository deviceRepository,
        @Value("${app.push.fcm.enabled:false}") boolean enabled,
        @Value("${app.push.fcm.project-id:}") String configuredProjectId,
        @Value("${app.push.fcm.service-account-path:}") String serviceAccountPath,
        @Value("${app.push.fcm.token-uri:https://oauth2.googleapis.com/token}") String tokenUri,
        @Value("${app.push.fcm.scope:https://www.googleapis.com/auth/firebase.messaging}") String scope
    ) {
        this.objectMapper = objectMapper;
        this.deviceRepository = deviceRepository;
        this.httpClient = HttpClient.newHttpClient();
        this.enabled = enabled;
        this.configuredProjectId = configuredProjectId;
        this.serviceAccountPath = serviceAccountPath;
        this.tokenUri = tokenUri;
        this.scope = scope;
    }

    public void sendToDevices(List<NotificationDevice> devices,
                              String type,
                              String title,
                              String body,
                              String link) {
        if (!enabled || devices.isEmpty()) {
            return;
        }

        afterCommit(() -> CompletableFuture.runAsync(() -> dispatch(devices, type, title, body, link)));
    }

    private void dispatch(List<NotificationDevice> devices,
                          String type,
                          String title,
                          String body,
                          String link) {
        try {
            ServiceAccountCredentials credentials = loadCredentials();
            String accessToken = getAccessToken(credentials);
            String projectId = resolveProjectId(credentials);

            for (NotificationDevice device : devices) {
                sendSingle(projectId, accessToken, device, type, title, body, link);
            }
        } catch (Exception exception) {
            log.warn("FCM delivery skipped: {}", exception.getMessage());
        }
    }

    private void sendSingle(String projectId,
                            String accessToken,
                            NotificationDevice device,
                            String type,
                            String title,
                            String body,
                            String link) throws IOException, InterruptedException {
        String payload = objectMapper.writeValueAsString(Map.of(
            "message", Map.of(
                "token", device.getToken(),
                "notification", Map.of(
                    "title", title,
                    "body", body
                ),
                "data", Map.of(
                    "type", type,
                    "link", link == null ? "" : link
                ),
                "android", Map.of(
                    "priority", "high",
                    "notification", Map.of(
                        "click_action", "FLUTTER_NOTIFICATION_CLICK"
                    )
                ),
                "apns", Map.of(
                    "headers", Map.of("apns-priority", "10"),
                    "payload", Map.of(
                        "aps", Map.of("sound", "default")
                    )
                )
            )
        ));

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send"))
            .header("Authorization", "Bearer " + accessToken)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            return;
        }

        if (response.body().contains("UNREGISTERED") || response.body().contains("registration-token-not-registered")) {
            device.setActive(false);
            deviceRepository.save(device);
        }

        log.warn("FCM send failed for device {}: status={} body={}",
            device.getId(), response.statusCode(), response.body());
    }

    private String getAccessToken(ServiceAccountCredentials credentials) throws IOException, InterruptedException {
        CachedAccessToken token = cachedAccessToken;
        if (token != null && token.expiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return token.value();
        }

        Instant now = Instant.now();
        String assertion = Jwts.builder()
            .issuer(credentials.clientEmail())
            .subject(credentials.clientEmail())
            .audience().add(tokenUri).and()
            .issuedAt(java.util.Date.from(now))
            .expiration(java.util.Date.from(now.plusSeconds(3600)))
            .claim("scope", scope)
            .signWith(parsePrivateKey(credentials.privateKey()), Jwts.SIG.RS256)
            .compact();

        String body = "grant_type="
            + URLEncoder.encode("urn:ietf:params:oauth:grant-type:jwt-bearer", StandardCharsets.UTF_8)
            + "&assertion="
            + URLEncoder.encode(assertion, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(tokenUri))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Failed to fetch FCM access token: " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        String accessToken = json.path("access_token").asText();
        long expiresIn = json.path("expires_in").asLong(3600);
        cachedAccessToken = new CachedAccessToken(accessToken, Instant.now().plusSeconds(expiresIn));
        return accessToken;
    }

    private ServiceAccountCredentials loadCredentials() throws IOException {
        if (cachedCredentials != null) {
            return cachedCredentials;
        }
        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            throw new IllegalStateException("FCM service account path is not configured");
        }

        String raw = Files.readString(Path.of(serviceAccountPath));
        JsonNode json = objectMapper.readTree(raw);
        cachedCredentials = new ServiceAccountCredentials(
            json.path("project_id").asText(),
            json.path("client_email").asText(),
            json.path("private_key").asText()
        );
        return cachedCredentials;
    }

    private String resolveProjectId(ServiceAccountCredentials credentials) {
        if (configuredProjectId != null && !configuredProjectId.isBlank()) {
            return configuredProjectId;
        }
        if (credentials.projectId() == null || credentials.projectId().isBlank()) {
            throw new IllegalStateException("FCM project id is not configured");
        }
        return credentials.projectId();
    }

    private PrivateKey parsePrivateKey(String pem) {
        try {
            String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\\n", "")
                .replace("\n", "")
                .replace("\r", "");
            byte[] keyBytes = Base64.getDecoder().decode(normalized);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePrivate(spec);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid FCM private key", exception);
        }
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()
            || !TransactionSynchronizationManager.isActualTransactionActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private record ServiceAccountCredentials(
        String projectId,
        String clientEmail,
        String privateKey
    ) {
    }

    private record CachedAccessToken(
        String value,
        Instant expiresAt
    ) {
    }
}
