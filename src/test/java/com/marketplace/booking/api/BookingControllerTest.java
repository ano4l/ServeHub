package com.marketplace.booking.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.catalog.domain.ServiceOffering;
import com.marketplace.catalog.domain.ServiceOfferingRepository;
import com.marketplace.identity.domain.Role;
import com.marketplace.identity.domain.UserAccount;
import com.marketplace.identity.domain.UserAccountRepository;
import com.marketplace.provider.domain.ProviderProfile;
import com.marketplace.provider.domain.ProviderProfileRepository;
import com.marketplace.provider.domain.VerificationStatus;
import com.marketplace.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookingControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserAccountRepository userRepository;
    @Autowired private ProviderProfileRepository providerRepository;
    @Autowired private ServiceOfferingRepository serviceRepository;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private UserAccount customer;
    private UserAccount providerUser;
    private ProviderProfile provider;
    private ServiceOffering offering;
    private String customerToken;
    private String providerToken;

    @BeforeEach
    void setUp() {
        customer = userRepository.save(new UserAccount(
            "Test Customer", "booking-customer@test.com", "+27820000001",
            passwordEncoder.encode("pass"), Role.CUSTOMER));

        providerUser = userRepository.save(new UserAccount(
            "Test Provider", "booking-provider@test.com", "+27820000002",
            passwordEncoder.encode("pass"), Role.PROVIDER));

        provider = providerRepository.save(new ProviderProfile(
            providerUser, VerificationStatus.VERIFIED, "Cape Town", 25, "Test provider bio"));

        offering = serviceRepository.save(new ServiceOffering(
            provider, "Plumbing", "Pipe Repair",
            com.marketplace.catalog.domain.PricingType.FIXED,
            BigDecimal.valueOf(350), 60));

        customerToken = jwtService.generateAccessToken(customer);
        providerToken = jwtService.generateAccessToken(providerUser);
    }

    @Test
    void createBooking_asCustomer_succeeds() throws Exception {
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd, Cape Town"
        );

        mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", notNullValue()))
            .andExpect(jsonPath("$.status", is("REQUESTED")))
            .andExpect(jsonPath("$.serviceName", is("Pipe Repair")))
            .andExpect(jsonPath("$.quotedPrice", is(350.0)));
    }

    @Test
    void createBooking_withoutAuth_returns401or403() throws Exception {
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd"
        );

        mockMvc.perform(post("/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void createBooking_pastDate_returns400() throws Exception {
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().minusDays(1).toString(),
            "address", "123 Main Rd"
        );

        mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listBookings_asCustomer_returnsOwnBookings() throws Exception {
        // Create a booking first
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd"
        );
        mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());

        // List bookings
        mockMvc.perform(get("/bookings")
                .header("Authorization", "Bearer " + customerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void acceptBooking_asProvider_succeeds() throws Exception {
        // Create a booking
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd"
        );
        var result = mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andReturn();

        var responseMap = objectMapper.readValue(
            result.getResponse().getContentAsString(), Map.class);
        var bookingId = responseMap.get("id");

        // Accept as provider
        mockMvc.perform(put("/bookings/" + bookingId + "/accept")
                .header("Authorization", "Bearer " + providerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("ACCEPTED")));
    }

    @Test
    void declineBooking_asProvider_succeeds() throws Exception {
        // Create a booking
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd"
        );
        var result = mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andReturn();

        var responseMap = objectMapper.readValue(
            result.getResponse().getContentAsString(), Map.class);
        var bookingId = responseMap.get("id");

        // Decline as provider
        var declineBody = Map.of("reason", "Not available");
        mockMvc.perform(put("/bookings/" + bookingId + "/decline")
                .header("Authorization", "Bearer " + providerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(declineBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("DECLINED")));
    }

    @Test
    void cancelBooking_asCustomer_succeeds() throws Exception {
        // Create a booking
        var body = Map.of(
            "serviceOfferingId", offering.getId(),
            "scheduledFor", OffsetDateTime.now().plusDays(3).toString(),
            "address", "123 Main Rd"
        );
        var result = mockMvc.perform(post("/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andReturn();

        var responseMap = objectMapper.readValue(
            result.getResponse().getContentAsString(), Map.class);
        var bookingId = responseMap.get("id");

        // Cancel as customer
        var cancelBody = Map.of("reason", "Changed my mind");
        mockMvc.perform(put("/bookings/" + bookingId + "/cancel")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cancelBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("CANCELLED")));
    }
}
