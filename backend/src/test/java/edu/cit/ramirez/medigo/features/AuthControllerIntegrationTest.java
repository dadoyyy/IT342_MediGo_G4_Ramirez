package edu.cit.ramirez.medigo.features;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.ramirez.medigo.features.auth.dto.LoginRequest;
import edu.cit.ramirez.medigo.features.auth.dto.RegisterRequest;
import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController.
 * Uses H2 in-memory database and full Spring context.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    private static final String BASE_URL = "/api/v1/auth";

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // ── POST /register ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /register — 201 Created for valid PATIENT registration")
    void register_validPatient_returns201() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Juan")
                .lastname("Dela Cruz")
                .email("juan@gmail.com")
                .password("Password1!")
                .role("PATIENT")
                .build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("juan@gmail.com"))
                .andExpect(jsonPath("$.data.user.role").value("PATIENT"));
    }

    @Test
    @DisplayName("POST /register — 201 Created for valid DOCTOR registration")
    void register_validDoctor_returns201() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Maria")
                .lastname("Santos")
                .email("doctor@gmail.com")
                .password("Password1!")
                .role("DOCTOR")
                .licenseNumber("PRC-2024-12345")
                .build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.role").value("DOCTOR"));
    }

    @Test
    @DisplayName("POST /register — 409 Conflict for duplicate email")
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("duplicate@gmail.com")
                .password("Password1!").role("PATIENT").build();

        // First registration
        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("POST /register — 400 Bad Request for missing required fields")
    void register_missingFields_returns400() throws Exception {
        String invalidJson = """
                {
                    "email": "invalid-email",
                    "password": "weak"
                }
                """;

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("POST /register — 400 Bad Request for weak password")
    void register_weakPassword_returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("juan@gmail.com")
                .password("weakpass")  // no uppercase, no special char
                .role("PATIENT").build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    // ── POST /login ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /login — 200 OK for valid credentials")
    void login_validCredentials_returns200() throws Exception {
        // Register first
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("login@gmail.com")
                .password("Password1!").role("PATIENT").build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Verify the user
        User user = userRepository.findByEmail("login@gmail.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Then login
        LoginRequest loginRequest = new LoginRequest("login@gmail.com", "Password1!");

        mockMvc.perform(post(BASE_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("login@gmail.com"));
    }

    @Test
    @DisplayName("POST /login — 401 Unauthorized for wrong password")
    void login_wrongPassword_returns401() throws Exception {
        // Register first
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("wrongpass@gmail.com")
                .password("Password1!").role("PATIENT").build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Verify the user
        User user = userRepository.findByEmail("wrongpass@gmail.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Login with wrong password
        LoginRequest loginRequest = new LoginRequest("wrongpass@gmail.com", "WrongPassword!");

        mockMvc.perform(post(BASE_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("POST /login — 401 Unauthorized for non-existent email")
    void login_unknownEmail_returns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest("nobody@gmail.com", "Password1!");

        mockMvc.perform(post(BASE_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    // ── POST /logout ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /logout — 204 No Content with valid Bearer token")
    void logout_validToken_returns204() throws Exception {
        // Register and get token
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("logout@gmail.com")
                .password("Password1!").role("PATIENT").build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Verify
        User user = userRepository.findByEmail("logout@gmail.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Login to get token
        LoginRequest loginRequest = new LoginRequest("logout@gmail.com", "Password1!");
        MvcResult loginResult = mockMvc.perform(post(BASE_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).path("data").path("token").asText();

        // Logout
        mockMvc.perform(post(BASE_URL + "/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /logout — 204 No Content even without token (graceful)")
    void logout_noToken_returns204() throws Exception {
        mockMvc.perform(post(BASE_URL + "/logout"))
                .andExpect(status().isNoContent());
    }

    // ── GET /me ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me — 200 OK returns current user profile")
    void me_authenticated_returns200() throws Exception {
        // Register and get token
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstname("Juan").lastname("Dela Cruz")
                .email("me@gmail.com")
                .password("Password1!").role("PATIENT").build();

        mockMvc.perform(post(BASE_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Verify
        User user = userRepository.findByEmail("me@gmail.com").orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Login to get token
        LoginRequest loginRequest = new LoginRequest("me@gmail.com", "Password1!");
        MvcResult loginResult = mockMvc.perform(post(BASE_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        mockMvc.perform(get(BASE_URL + "/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("me@gmail.com"))
                .andExpect(jsonPath("$.data.role").value("PATIENT"));
    }

    @Test
    @DisplayName("GET /me — 401 Unauthorized without token")
    void me_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get(BASE_URL + "/me"))
                .andExpect(status().isUnauthorized());
    }
}
