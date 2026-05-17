package edu.cit.ramirez.medigo.features;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.ramirez.medigo.features.appointment.AppointmentRepository;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentCreateRequest;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentStatusUpdateRequest;
import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus;
import edu.cit.ramirez.medigo.features.auth.dto.RegisterRequest;
import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileUpsertRequest;
import edu.cit.ramirez.medigo.features.user.UserRepository;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AppointmentController.
 * Uses H2 in-memory database and full Spring context.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AppointmentControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;

    private static final String AUTH_URL = "/api/v1/auth";
    private static final String APPT_URL = "/api/v1/appointments";
    private static final String DOCTOR_URL = "/api/v1/doctors";

    private String patientToken;
    private String doctorToken;
    private Long doctorUserId;

    @BeforeEach
    void setUp() throws Exception {
        appointmentRepository.deleteAll();
        doctorProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Register patient
        patientToken = registerAndGetToken("patient@test.com", "PATIENT");

        // Register doctor
        doctorToken = registerAndGetToken("doctor@test.com", "DOCTOR");

        // Get doctor's user ID
        MvcResult meResult = mockMvc.perform(get(AUTH_URL + "/me")
                        .header("Authorization", "Bearer " + doctorToken))
                .andReturn();
        doctorUserId = objectMapper.readTree(meResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Create doctor profile
        DoctorProfileUpsertRequest profileRequest = DoctorProfileUpsertRequest.builder()
                .specialization("Cardiology")
                .clinicName("Heart Clinic")
                .clinicAddress("123 Main St, Manila")
                .build();

        mockMvc.perform(put(DOCTOR_URL + "/me/profile")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isOk());

        // Mark the doctor profile as verified in database
        edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile profile = 
                doctorProfileRepository.findByDoctorId(doctorUserId).orElseThrow();
        profile.setVerified(true);
        doctorProfileRepository.save(profile);
    }

    // ── POST /appointments ────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /appointments — 201 Created for valid patient booking")
    void createAppointment_validPatient_returns201() throws Exception {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .notes("First visit")
                .build();

        mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING_DOCTOR_APPROVAL"))
                .andExpect(jsonPath("$.data.appointmentType").value("Consultation"))
                .andExpect(jsonPath("$.data.doctorId").value(doctorUserId));
    }

    @Test
    @DisplayName("POST /appointments — 403 Forbidden when doctor tries to book")
    void createAppointment_doctorForbidden_returns403() throws Exception {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /appointments — 401 Unauthorized without token")
    void createAppointment_noToken_returns401() throws Exception {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        mockMvc.perform(post(APPT_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /appointments ─────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /appointments — 200 OK returns patient's appointments")
    void listAppointments_patient_returns200() throws Exception {
        // Create an appointment first
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // List appointments
        mockMvc.perform(get(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("GET /appointments — 200 OK returns doctor's appointments")
    void listAppointments_doctor_returns200() throws Exception {
        // Create an appointment as patient
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Doctor lists their appointments
        mockMvc.perform(get(APPT_URL)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    // ── PUT /appointments/{id}/cancel ─────────────────────────────────────────

    @Test
    @DisplayName("PUT /appointments/{id}/cancel — 200 OK patient cancels own appointment")
    void cancelAppointment_patient_returns200() throws Exception {
        // Create appointment
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        MvcResult createResult = mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long appointmentId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Cancel it
        mockMvc.perform(put(APPT_URL + "/" + appointmentId + "/cancel")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    // ── PUT /appointments/{id}/status ─────────────────────────────────────────

    @Test
    @DisplayName("PUT /appointments/{id}/status — 200 OK doctor confirms appointment")
    void updateStatus_doctorConfirms_returns200() throws Exception {
        // Create appointment as patient
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        MvcResult createResult = mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long appointmentId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Doctor confirms
        AppointmentStatusUpdateRequest statusRequest = new AppointmentStatusUpdateRequest(AppointmentStatus.CONFIRMED);

        mockMvc.perform(put(APPT_URL + "/" + appointmentId + "/status")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("PUT /appointments/{id}/status — 403 Forbidden when patient tries to update status")
    void updateStatus_patientForbidden_returns403() throws Exception {
        // Create appointment
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(doctorUserId)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Consultation")
                .build();

        MvcResult createResult = mockMvc.perform(post(APPT_URL)
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long appointmentId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        AppointmentStatusUpdateRequest statusRequest = new AppointmentStatusUpdateRequest(AppointmentStatus.CONFIRMED);

        mockMvc.perform(put(APPT_URL + "/" + appointmentId + "/status")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isForbidden());
    }

    // ── GET /doctors/search ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /doctors/search — 200 OK returns verified doctors")
    void searchDoctors_returns200() throws Exception {
        mockMvc.perform(get(DOCTOR_URL + "/search")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].specialization").value("Cardiology"));
    }

    @Test
    @DisplayName("GET /doctors/search — 200 OK with query filter")
    void searchDoctors_withQuery_returns200() throws Exception {
        mockMvc.perform(get(DOCTOR_URL + "/search")
                        .param("q", "cardio")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("GET /doctors/search — 200 OK with no match returns empty list")
    void searchDoctors_noMatch_returnsEmpty() throws Exception {
        mockMvc.perform(get(DOCTOR_URL + "/search")
                        .param("q", "xyz_no_match_999")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String registerAndGetToken(String email, String role) throws Exception {
        String gmailEmail = email.split("@")[0] + "@gmail.com";

        RegisterRequest request = RegisterRequest.builder()
                .firstname("Test").lastname("User")
                .email(gmailEmail).password("Password1!").role(role).build();

        mockMvc.perform(post(AUTH_URL + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Verify the user manually in database
        edu.cit.ramirez.medigo.features.user.entity.User user = userRepository.findByEmail(gmailEmail).orElseThrow();
        user.setVerified(true);
        userRepository.save(user);

        // Login to get token
        edu.cit.ramirez.medigo.features.auth.dto.LoginRequest loginRequest = 
                new edu.cit.ramirez.medigo.features.auth.dto.LoginRequest(gmailEmail, "Password1!");

        MvcResult loginResult = mockMvc.perform(post(AUTH_URL + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
