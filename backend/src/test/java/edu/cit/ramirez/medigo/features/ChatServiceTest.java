package edu.cit.ramirez.medigo.features;

import edu.cit.ramirez.medigo.features.appointment.AppointmentRepository;
import edu.cit.ramirez.medigo.features.appointment.entity.Appointment;
import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus;
import edu.cit.ramirez.medigo.features.chat.ChatMessageRepository;
import edu.cit.ramirez.medigo.features.chat.ChatService;
import edu.cit.ramirez.medigo.features.chat.dto.ChatContactDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatMessageDto;
import edu.cit.ramirez.medigo.features.chat.dto.ChatSendRequest;
import edu.cit.ramirez.medigo.features.chat.entity.ChatMessage;
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
 * Unit tests for ChatService — all dependencies are mocked.
 */
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private DoctorProfileRepository doctorProfileRepository;

    @InjectMocks
    private ChatService chatService;

    private User patientUser;
    private User doctorUser;
    private User anotherPatient;
    private ChatMessage sampleMessage;

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

        anotherPatient = User.builder()
                .id(3L).email("patient2@example.com")
                .fullName("Pedro Patient").role("PATIENT")
                .passwordHash("hash").createdAt(Instant.now()).build();

        sampleMessage = new ChatMessage();
        sampleMessage.setId(100L);
        sampleMessage.setSender(patientUser);
        sampleMessage.setReceiver(doctorUser);
        sampleMessage.setContent("Hello doctor");
        sampleMessage.setSentAt(Instant.now());

        lenient().when(appointmentRepository.existsSuccessfulAppointmentBetween(anyLong(), anyLong()))
                .thenReturn(true);
    }

    // ── getContacts() ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getContacts() — patient sees only doctors")
    void getContacts_patientSeesOnlyDoctors() {
        DoctorProfile docProfile = DoctorProfile.builder()
                .id(10L)
                .doctor(doctorUser)
                .profilePictureUrl("http://example.com/avatar.jpg")
                .build();
        when(doctorProfileRepository.findByDoctorId(2L)).thenReturn(Optional.of(docProfile));
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findAll()).thenReturn(List.of(patientUser, doctorUser, anotherPatient));

        List<ChatContactDto> contacts = chatService.getContacts("patient@example.com", null);

        assertThat(contacts).hasSize(1);
        assertThat(contacts.get(0).getRole()).isEqualTo("DOCTOR");
        assertThat(contacts.get(0).getFullName()).isEqualTo("Dr. Maria Doctor");
        assertThat(contacts.get(0).getProfilePictureUrl()).isEqualTo("http://example.com/avatar.jpg");
    }

    @Test
    @DisplayName("getContacts() — doctor sees allowed patient contacts")
    void getContacts_doctorSeesAllAllowed() {
        User anotherDoctor = User.builder()
                .id(4L).email("doctor2@example.com")
                .fullName("Dr. Pedro").role("DOCTOR")
                .passwordHash("hash").createdAt(Instant.now()).build();

        when(userRepository.findByEmail("doctor@example.com")).thenReturn(Optional.of(doctorUser));
        when(userRepository.findAll()).thenReturn(List.of(patientUser, doctorUser, anotherPatient, anotherDoctor));

        List<ChatContactDto> contacts = chatService.getContacts("doctor@example.com", null);

        // Doctor sees patients (not themselves or other doctors)
        assertThat(contacts).hasSize(2);
    }

    @Test
    @DisplayName("getContacts() — filters by query string")
    void getContacts_withQuery_filtersResults() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findAll()).thenReturn(List.of(patientUser, doctorUser, anotherPatient));

        List<ChatContactDto> contacts = chatService.getContacts("patient@example.com", "maria");

        assertThat(contacts).hasSize(1);
        assertThat(contacts.get(0).getFullName()).containsIgnoringCase("maria");
    }

    // ── getConversation() ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getConversation() — returns messages between patient and doctor")
    void getConversation_success() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(chatMessageRepository.findConversation(1L, 2L)).thenReturn(List.of(sampleMessage));

        List<ChatMessageDto> messages = chatService.getConversation("patient@example.com", 2L);

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getContent()).isEqualTo("Hello doctor");
        assertThat(messages.get(0).getSenderId()).isEqualTo(1L);
        assertThat(messages.get(0).getReceiverId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("getConversation() — throws ForbiddenActionException for patient-to-patient chat")
    void getConversation_patientToPatient_throwsException() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(anotherPatient));

        assertThatThrownBy(() -> chatService.getConversation("patient@example.com", 3L))
                .isInstanceOf(ForbiddenActionException.class);
    }

    @Test
    @DisplayName("getConversation() — throws ResourceNotFoundException for unknown contact")
    void getConversation_unknownContact_throwsException() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getConversation("patient@example.com", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── sendMessage() ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("sendMessage() — patient sends message to doctor successfully")
    void sendMessage_patientToDoctor_success() {
        ChatSendRequest request = ChatSendRequest.builder()
                .receiverId(2L)
                .content("Hello doctor, I need help.")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(sampleMessage);

        ChatMessageDto result = chatService.sendMessage("patient@example.com", request);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("Hello doctor");
        verify(chatMessageRepository).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("sendMessage() — throws ForbiddenActionException when patient messages another patient")
    void sendMessage_patientToPatient_throwsException() {
        ChatSendRequest request = ChatSendRequest.builder()
                .receiverId(3L)
                .content("Hello")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(anotherPatient));

        assertThatThrownBy(() -> chatService.sendMessage("patient@example.com", request))
                .isInstanceOf(ForbiddenActionException.class);

        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    @DisplayName("sendMessage() — throws BadRequestException when appointment doesn't match participants")
    void sendMessage_appointmentMismatch_throwsException() {
        User unrelatedPatient = User.builder()
                .id(5L).email("unrelated@example.com")
                .fullName("Unrelated").role("PATIENT")
                .passwordHash("hash").createdAt(Instant.now()).build();

        Appointment unrelatedAppointment = Appointment.builder()
                .id(50L).patient(unrelatedPatient).doctor(doctorUser)
                .appointmentAt(LocalDateTime.now().plusDays(1))
                .appointmentType("Check-up")
                .status(AppointmentStatus.CONFIRMED)
                .createdAt(Instant.now()).build();

        ChatSendRequest request = ChatSendRequest.builder()
                .receiverId(2L)
                .appointmentId(50L)
                .content("Hello")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findById(50L)).thenReturn(Optional.of(unrelatedAppointment));

        assertThatThrownBy(() -> chatService.sendMessage("patient@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not belong to this conversation");
    }

    @Test
    @DisplayName("sendMessage() — throws ResourceNotFoundException for unknown receiver")
    void sendMessage_unknownReceiver_throwsException() {
        ChatSendRequest request = ChatSendRequest.builder()
                .receiverId(999L)
                .content("Hello")
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.sendMessage("patient@example.com", request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
