package com.marketplace.identity.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserAccountRepository userRepository;

    @BeforeEach
    void cleanUp() {
        // Transactional rollback handles cleanup
    }

    @Test
    void register_happyPath_returnsTokens() throws Exception {
        var body = Map.of(
            "fullName", "Test User",
            "email", "newuser@test.com",
            "phoneNumber", "+27821110000",
            "password", "StrongPass1!",
            "role", "CUSTOMER"
        );

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", notNullValue()))
            .andExpect(jsonPath("$.refreshToken", notNullValue()))
            .andExpect(jsonPath("$.role", is("CUSTOMER")));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        var body = Map.of(
            "fullName", "Dup User",
            "email", "dup@test.com",
            "phoneNumber", "+27821110001",
            "password", "StrongPass1!",
            "role", "CUSTOMER"
        );

        // First register succeeds
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());

        // Second register with same email fails
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_validCredentials_returnsTokens() throws Exception {
        // Register first
        var regBody = Map.of(
            "fullName", "Login User",
            "email", "login@test.com",
            "phoneNumber", "+27821110002",
            "password", "StrongPass1!",
            "role", "CUSTOMER"
        );
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regBody)))
            .andExpect(status().isOk());

        // Login
        var loginBody = Map.of("email", "login@test.com", "password", "StrongPass1!");
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", notNullValue()))
            .andExpect(jsonPath("$.userId", notNullValue()));
    }

    @Test
    void login_wrongPassword_returns400() throws Exception {
        // Register first
        var regBody = Map.of(
            "fullName", "Wrong Pass User",
            "email", "wrongpass@test.com",
            "phoneNumber", "+27821110003",
            "password", "StrongPass1!",
            "role", "CUSTOMER"
        );
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regBody)))
            .andExpect(status().isOk());

        // Login with wrong password
        var loginBody = Map.of("email", "wrongpass@test.com", "password", "WrongPassword!");
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_nonexistentUser_returns404() throws Exception {
        var loginBody = Map.of("email", "nobody@test.com", "password", "anything");
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
            .andExpect(status().isNotFound());
    }

    @Test
    void refresh_validToken_returnsNewTokens() throws Exception {
        // Register to get tokens
        var regBody = Map.of(
            "fullName", "Refresh User",
            "email", "refresh@test.com",
            "phoneNumber", "+27821110004",
            "password", "StrongPass1!",
            "role", "CUSTOMER"
        );
        var result = mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regBody)))
            .andExpect(status().isOk())
            .andReturn();

        var responseMap = objectMapper.readValue(
            result.getResponse().getContentAsString(), Map.class);
        String refreshToken = (String) responseMap.get("refreshToken");

        // Refresh
        var refreshBody = Map.of("refreshToken", refreshToken);
        mockMvc.perform(post("/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", notNullValue()))
            .andExpect(jsonPath("$.refreshToken", notNullValue()));
    }
}
