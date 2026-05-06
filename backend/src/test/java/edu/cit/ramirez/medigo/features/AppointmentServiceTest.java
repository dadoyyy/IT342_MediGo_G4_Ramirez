package edu.cit.ramirez.medigo.features;

import edu.cit.ramirez.medigo.features.appointment.AppointmentRepository;
import edu.cit.ramirez.medigo.features.appointment.AppointmentService;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentCreateRequest;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentDto;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentStatusUpdateRequest;
import edu.cit.ramirez.medigo.features.appointment.dto.AppointmentUpdateRequest;
import edu.cit.ramirez.medigo.features.appointment.entity.Appointment;
import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus;
import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile;
import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.BadRequestException;
import edu.cit.ramirez.medigo.shared.exception.ForbiddenActionException;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AppointmentService — all dependencies are mocked.
 */
@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private DoctorProfileRepository doctorProfileRepository;
    @Mock private AppointmentRepository appointmentRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private User patientUser;
    private User doctorUser;
    private DoctorProfile doctorProfile;
    private Appointment pendingAppointment;
    private Appointment confirmedAppointment;
    private Appointment cancelledAppointment;

    @BeforeEach
    void setUp() {
        patientUser = User.builder()
                .id(1L).email("patient@example.com")
                .fullName("Juan Patient").role("PATIENT")
                .passwordHash("hash").createdAt(Instant.now()).build();

        doctorUser = User.builder()
                .id(2L).email("doctor@example.com")
                .fullName("Dr. Maria Doctor").role("DOCTOR")
                .passwordHash("hash").createdAt(Instant.now()).build();

        doctorProfile = DoctorProfile.builder()
                .id(1L).doctor(doctorUser)
                .specialization("Cardiology").clinicName("Heart Clinic")
                .clinicAddress("123 Main St").verified(true).build();

        pendingAppointment = Appointment.builder()
                .id(10L).patient(patientUser).doctor(doctorUser)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Consultation").notes("First visit")
                .status(AppointmentStatus.PENDING_DOCTOR_APPROVAL)
                .createdAt(Instant.now()).build();

        confirmedAppointment = Appointment.builder()
                .id(11L).patient(patientUser).doctor(doctorUser)
                .appointmentAt(LocalDateTime.now().plusDays(2))
                .appointmentType("Follow-up").notes(null)
                .status(AppointmentStatus.CONFIRMED)
                .createdAt(Instant.now()).build();

        cancelledAppointment = Appointment.builder()
                .id(12L).patient(patientUser).doctor(doctorUser)
                .appointmentAt(LocalDateTime.now().plusDays(3))
                .appointmentType("Check-up").notes(null)
                .status(AppointmentStatus.CANCELLED)
                .createdAt(Instant.now()).build();
    }

    // ── createAppointment() ───────────────────────────────────────────────────

    @Test
    @DisplayName("createAppointment() — success: patient books with verified doctor")
    void createAppointment_success() {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(2L)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Consultation")
                .notes("First visit")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorProfileRepository.findByDoctorId(2L)).thenReturn(Optional.of(doctorProfile));
        when(appointmentRepository.existsByDoctorIdAndAppointmentAtAndStatusNotIn(any(), any(), any())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(pendingAppointment);

        AppointmentDto result = appointmentService.createAppointment("patient@example.com", request);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(AppointmentStatus.PENDING_DOCTOR_APPROVAL);
        assertThat(result.getPatientId()).isEqualTo(1L);
        assertThat(result.getDoctorId()).isEqualTo(2L);
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("createAppointment() — throws ForbiddenActionException when doctor tries to book")
    void createAppointment_doctorCannotBook() {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(2L)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Consultation")
                .build();

        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(doctorUser));

        assertThatThrownBy(() -> appointmentService.createAppointment("doctor@example.com", request))
                .isInstanceOf(ForbiddenActionException.class);

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("createAppointment() — throws BadRequestException when slot is taken")
    void createAppointment_slotTaken_throwsException() {
        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(2L)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Consultation")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorProfileRepository.findByDoctorId(2L)).thenReturn(Optional.of(doctorProfile));
        when(appointmentRepository.existsByDoctorIdAndAppointmentAtAndStatusNotIn(any(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment("patient@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already reserved");
    }

    @Test
    @DisplayName("createAppointment() — throws BadRequestException when doctor is not verified")
    void createAppointment_unverifiedDoctor_throwsException() {
        DoctorProfile unverifiedProfile = DoctorProfile.builder()
                .id(2L).doctor(doctorUser).specialization("General")
                .clinicName("Clinic").clinicAddress("Address").verified(false).build();

        AppointmentCreateRequest request = AppointmentCreateRequest.builder()
                .doctorId(2L)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Consultation")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorProfileRepository.findByDoctorId(2L)).thenReturn(Optional.of(unverifiedProfile));

        assertThatThrownBy(() -> appointmentService.createAppointment("patient@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not verified");
    }

    // ── cancelAppointment() ───────────────────────────────────────────────────

    @Test
    @DisplayName("cancelAppointment() — success: patient cancels own pending appointment")
    void cancelAppointment_success() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentDto result = appointmentService.cancelAppointment("patient@example.com", 10L);

        assertThat(result.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancelAppointment() — throws ForbiddenActionException when patient doesn't own appointment")
    void cancelAppointment_notOwner_throwsException() {
        User otherPatient = User.builder().id(99L).email("other@example.com")
                .fullName("Other").role("PATIENT").passwordHash("h").createdAt(Instant.now()).build();

        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherPatient));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));

        assertThatThrownBy(() -> appointmentService.cancelAppointment("other@example.com", 10L))
                .isInstanceOf(ForbiddenActionException.class);
    }

    @Test
    @DisplayName("cancelAppointment() — throws BadRequestException when appointment already cancelled")
    void cancelAppointment_alreadyCancelled_throwsException() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(12L)).thenReturn(Optional.of(cancelledAppointment));

        assertThatThrownBy(() -> appointmentService.cancelAppointment("patient@example.com", 12L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("can no longer be cancelled");
    }

    // ── updateAppointment() ───────────────────────────────────────────────────

    @Test
    @DisplayName("updateAppointment() — success: patient updates pending appointment")
    void updateAppointment_success() {
        AppointmentUpdateRequest request = AppointmentUpdateRequest.builder()
                .appointmentAt(LocalDateTime.now().plusDays(5))
                .appointmentType("Follow-up")
                .notes("Updated notes")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));
        when(appointmentRepository.existsByDoctorIdAndAppointmentAtAndStatusNotIn(any(), any(), any())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentDto result = appointmentService.updateAppointment("patient@example.com", 10L, request);

        assertThat(result).isNotNull();
        assertThat(result.getAppointmentType()).isEqualTo("Follow-up");
    }

    @Test
    @DisplayName("updateAppointment() — throws BadRequestException when appointment is completed")
    void updateAppointment_completedStatus_throwsException() {
        Appointment completedAppointment = Appointment.builder()
                .id(13L).patient(patientUser).doctor(doctorUser)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Check-up").status(AppointmentStatus.COMPLETED)
                .createdAt(Instant.now()).build();

        AppointmentUpdateRequest request = AppointmentUpdateRequest.builder()
                .appointmentAt(LocalDateTime.now().plusDays(5))
                .appointmentType("Follow-up")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(13L)).thenReturn(Optional.of(completedAppointment));

        assertThatThrownBy(() -> appointmentService.updateAppointment("patient@example.com", 13L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only pending or confirmed");
    }

    // ── updateStatus() ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateStatus() — doctor confirms pending appointment")
    void updateStatus_confirm_success() {
        AppointmentStatusUpdateRequest request = new AppointmentStatusUpdateRequest(AppointmentStatus.CONFIRMED);

        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentDto result = appointmentService.updateStatus("doctor@example.com", 10L, request);

        assertThat(result.getStatus()).isEqualTo(AppointmentStatus.CONFIRMED);
    }

    @Test
    @DisplayName("updateStatus() — throws BadRequestException when marking pending as completed")
    void updateStatus_completePending_throwsException() {
        AppointmentStatusUpdateRequest request = new AppointmentStatusUpdateRequest(AppointmentStatus.COMPLETED);

        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));

        assertThatThrownBy(() -> appointmentService.updateStatus("doctor@example.com", 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only confirmed appointments");
    }

    @Test
    @DisplayName("updateStatus() — throws ForbiddenActionException when patient tries to update status")
    void updateStatus_patientForbidden() {
        AppointmentStatusUpdateRequest request = new AppointmentStatusUpdateRequest(AppointmentStatus.CONFIRMED);

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));

        assertThatThrownBy(() -> appointmentService.updateStatus("patient@example.com", 10L, request))
                .isInstanceOf(ForbiddenActionException.class);
    }

    // ── getMyAppointments() ───────────────────────────────────────────────────

    @Test
    @DisplayName("getMyAppointments() — returns patient's appointments")
    void getMyAppointments_patient() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByPatientId(1L)).thenReturn(List.of(pendingAppointment, confirmedAppointment));

        List<AppointmentDto> result = appointmentService.getMyAppointments("patient@example.com");

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getMyAppointments() — returns doctor's appointments")
    void getMyAppointments_doctor() {
        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findByDoctorId(2L)).thenReturn(List.of(pendingAppointment));

        List<AppointmentDto> result = appointmentService.getMyAppointments("doctor@example.com");

        assertThat(result).hasSize(1);
    }

    // ── deleteAppointment() ───────────────────────────────────────────────────

    @Test
    @DisplayName("deleteAppointment() — success: patient deletes cancelled appointment")
    void deleteAppointment_success() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(12L)).thenReturn(Optional.of(cancelledAppointment));
        doNothing().when(appointmentRepository).delete(any(Appointment.class));

        AppointmentDto result = appointmentService.deleteAppointment("patient@example.com", 12L);

        assertThat(result).isNotNull();
        verify(appointmentRepository).delete(cancelledAppointment);
    }

    @Test
    @DisplayName("deleteAppointment() — throws BadRequestException when appointment is not cancelled")
    void deleteAppointment_notCancelled_throwsException() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(pendingAppointment));

        assertThatThrownBy(() -> appointmentService.deleteAppointment("patient@example.com", 10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only cancelled appointments");
    }

    @Test
    @DisplayName("deleteAppointment() — throws ResourceNotFoundException for unknown appointment")
    void deleteAppointment_notFound_throwsException() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.deleteAppointment("patient@example.com", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
