package edu.cit.ramirez.medigo.features.appointment;

import edu.cit.ramirez.medigo.features.appointment.dto.*;
import edu.cit.ramirez.medigo.features.appointment.entity.*;
import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.DoctorSpecializationChangeRequestRepository;
import edu.cit.ramirez.medigo.features.chat.ChatMessageRepository;
import edu.cit.ramirez.medigo.features.chat.entity.ChatMessage;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileUpsertRequest;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorSpecializationChangeRequestCreateRequest;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorSpecializationChangeRequestDto;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeRequest;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeStatus;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile;
import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.BadRequestException;
import edu.cit.ramirez.medigo.shared.exception.ForbiddenActionException;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorSpecializationChangeRequestRepository doctorChangeRequestRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

    @PostConstruct
    public void logUploadDir() {
        log.info("📁 Upload directory: {}", Paths.get(uploadDir).toAbsolutePath());
    }

    @Transactional(readOnly = true)
    public List<DoctorProfileDto> searchDoctors(String query) {
        String normalized = query == null ? null : query.trim();
        return doctorProfileRepository.searchVerifiedDoctors(normalized).stream()
                .map(this::toDoctorProfileDto)
                .toList();
    }

    @Transactional
    public DoctorProfileDto upsertDoctorProfile(String email, DoctorProfileUpsertRequest request) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctor.getId())
                .orElseGet(() -> DoctorProfile.builder().doctor(doctor).build());

        String requestedSpec = request.getSpecialization().trim();
        if (profile.isVerified()) {
            String currentSpec = profile.getSpecialization() == null ? "" : profile.getSpecialization().trim();
            if (!currentSpec.equalsIgnoreCase(requestedSpec)) {
                throw new BadRequestException("Specialization changes require admin approval.");
            }
        } else {
            profile.setSpecialization(requestedSpec);
        }
        profile.setClinicName(request.getClinicName().trim());
        profile.setClinicAddress(request.getClinicAddress().trim());
        // Do NOT set verified here — admin must approve via /admin/doctors/{id}/approve

        DoctorProfile saved = doctorProfileRepository.save(profile);
        return toDoctorProfileDto(saved);
    }

    @Transactional
    public DoctorSpecializationChangeRequestDto requestSpecializationChange(
            String email,
            DoctorSpecializationChangeRequestCreateRequest request
    ) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        if (!profile.isVerified()) {
            throw new BadRequestException("You can update specialization directly before verification.");
        }

        String requestedSpec = request.getRequestedSpecialization().trim();
        String currentSpec = profile.getSpecialization() == null ? "" : profile.getSpecialization().trim();
        if (currentSpec.equalsIgnoreCase(requestedSpec)) {
            throw new BadRequestException("Requested specialization matches your current specialization.");
        }

        doctorChangeRequestRepository.findTopByDoctorIdAndStatusOrderByCreatedAtDesc(
                doctor.getId(), DoctorSpecializationChangeStatus.PENDING
        ).ifPresent(existing -> {
            throw new BadRequestException("You already have a pending specialization change request.");
        });

        DoctorSpecializationChangeRequest changeRequest = DoctorSpecializationChangeRequest.builder()
                .doctor(doctor)
                .currentSpecialization(currentSpec)
                .requestedSpecialization(requestedSpec)
                .reason(request.getReason() == null ? null : request.getReason().trim())
                .status(DoctorSpecializationChangeStatus.PENDING)
                .build();

        DoctorSpecializationChangeRequest saved = doctorChangeRequestRepository.save(changeRequest);
        return toChangeRequestDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DoctorSpecializationChangeRequestDto> getMySpecializationChangeRequests(String email) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");
        return doctorChangeRequestRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId()).stream()
                .map(this::toChangeRequestDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorProfileDto getMyDoctorProfile(String email) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        // Return null-safe DTO for new doctors who haven't saved a profile yet
        return doctorProfileRepository.findByDoctorId(doctor.getId())
                .map(this::toDoctorProfileDto)
                .orElseGet(() -> DoctorProfileDto.builder()
                        .doctorId(doctor.getId())
                        .doctorName(doctor.getFullName())
                        .email(doctor.getEmail())
                        .verified(false)
                        .build());
    }

    @Transactional
    public AppointmentDto createAppointment(String email, AppointmentCreateRequest request) {
        User patient = findUserByEmail(email);
        ensureRole(patient, "PATIENT");

        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found."));
        ensureRole(doctor, "DOCTOR");

        DoctorProfile doctorProfile = doctorProfileRepository.findByDoctorId(doctor.getId())
                .orElseThrow(() -> new BadRequestException("Selected doctor has no active profile yet."));

        if (!doctorProfile.isVerified()) {
            throw new BadRequestException("Selected doctor is not verified yet.");
        }

        boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentAtAndStatusNotIn(
                doctor.getId(),
                request.getAppointmentAt(),
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED)
        );
        if (slotTaken) {
            throw new BadRequestException("Selected schedule is already reserved. Please choose another time.");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentAt(request.getAppointmentAt())
                .appointmentType(request.getAppointmentType().trim())
                .notes(request.getNotes() == null ? null : request.getNotes().trim())
                .status(AppointmentStatus.PENDING_DOCTOR_APPROVAL)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return toAppointmentDto(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getMyAppointments(String email) {
        User currentUser = findUserByEmail(email);
        List<Appointment> appointments = "DOCTOR".equalsIgnoreCase(currentUser.getRole())
                ? appointmentRepository.findByDoctorId(currentUser.getId())
                : appointmentRepository.findByPatientId(currentUser.getId());

        return appointments.stream().map(this::toAppointmentDto).toList();
    }

    @Transactional
    public AppointmentDto updateAppointment(String email, Long id, AppointmentUpdateRequest request) {
        User patient = findUserByEmail(email);
        ensureRole(patient, "PATIENT");

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenActionException("You can only update your own appointments.");
        }

        if (appointment.getStatus() != AppointmentStatus.PENDING_DOCTOR_APPROVAL
                && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only pending or confirmed appointments can be updated.");
        }

        boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentAtAndStatusNotIn(
                appointment.getDoctor().getId(),
                request.getAppointmentAt(),
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED)
        );
        if (slotTaken && !appointment.getAppointmentAt().equals(request.getAppointmentAt())) {
            throw new BadRequestException("Selected schedule is already reserved. Please choose another time.");
        }

        appointment.setAppointmentAt(request.getAppointmentAt());
        appointment.setAppointmentType(request.getAppointmentType().trim());
        appointment.setNotes(request.getNotes() == null ? null : request.getNotes().trim());
        appointment.setStatus(AppointmentStatus.PENDING_DOCTOR_APPROVAL);

        Appointment saved = appointmentRepository.save(appointment);
        return toAppointmentDto(saved);
    }

    @Transactional
    public AppointmentDto cancelAppointment(String email, Long id) {
        User patient = findUserByEmail(email);
        ensureRole(patient, "PATIENT");

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenActionException("You can only cancel your own appointments.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Appointment can no longer be cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toAppointmentDto(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentDto deleteAppointment(String email, Long id) {
        User patient = findUserByEmail(email);
        ensureRole(patient, "PATIENT");

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenActionException("You can only delete your own appointments.");
        }

        if (appointment.getStatus() != AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Only cancelled appointments can be deleted.");
        }

        AppointmentDto dto = toAppointmentDto(appointment);
        appointmentRepository.delete(appointment);
        return dto;
    }

    @Transactional
    public AppointmentDto updateStatus(String email, Long id, AppointmentStatusUpdateRequest request) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenActionException("You can only manage appointments assigned to you.");
        }

        AppointmentStatus target = request.getStatus();
        AppointmentStatus previous = appointment.getStatus();
        if (target != AppointmentStatus.CONFIRMED
                && target != AppointmentStatus.REJECTED
                && target != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Doctor can only set status to CONFIRMED, REJECTED, or COMPLETED.");
        }

        if (target == AppointmentStatus.COMPLETED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed appointments can be marked as completed.");
        }

        appointment.setStatus(target);
        Appointment saved = appointmentRepository.save(appointment);

        if (target == AppointmentStatus.CONFIRMED && previous != AppointmentStatus.CONFIRMED) {
            sendConfirmationMessage(saved);
        }

        return toAppointmentDto(saved);
    }

    private void sendConfirmationMessage(Appointment appointment) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a", Locale.ENGLISH);
        String when = appointment.getAppointmentAt() == null
                ? ""
                : appointment.getAppointmentAt().format(formatter);

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(appointment.getDoctor().getId()).orElse(null);
        String location = "";
        if (profile != null) {
            String clinicName = profile.getClinicName() == null ? "" : profile.getClinicName().trim();
            String clinicAddress = profile.getClinicAddress() == null ? "" : profile.getClinicAddress().trim();
            if (!clinicName.isBlank() && !clinicAddress.isBlank()) {
                location = clinicName + " - " + clinicAddress;
            } else if (!clinicName.isBlank()) {
                location = clinicName;
            } else if (!clinicAddress.isBlank()) {
                location = clinicAddress;
            }
        }

        StringBuilder content = new StringBuilder("[APPT_CONFIRMED]")
                .append("|Doctor=").append(appointment.getDoctor().getFullName())
                .append("|Patient=").append(appointment.getPatient().getFullName())
                .append("|When=").append(when)
                .append("|Type=").append(appointment.getAppointmentType());
        if (!location.isBlank()) {
            content.append("|Location=").append(location);
        }

        ChatMessage message = new ChatMessage();
        message.setSender(appointment.getDoctor());
        message.setReceiver(appointment.getPatient());
        message.setAppointment(appointment);
        message.setContent(content.toString());
        chatMessageRepository.save(message);
    }

    @Transactional
    public DoctorProfileDto uploadDoctorDocument(String email, String docType, MultipartFile file) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctor.getId())
                .orElseGet(() -> {
                    // Auto-create a blank profile so documents can be uploaded
                    // before the doctor fills in and saves the profile form.
                    DoctorProfile blank = DoctorProfile.builder()
                            .doctor(doctor)
                            .specialization("")
                            .clinicName("")
                            .clinicAddress("")
                            .build();
                    return doctorProfileRepository.save(blank);
                });

        // Verified doctors cannot replace their approved documents (profile picture is still allowed)
        if (profile.isVerified() && !"profile_picture".equalsIgnoreCase(docType)) {
            throw new BadRequestException("Your profile has been verified. Verification documents can no longer be replaced.");
        }

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File must not be empty.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Invalid file name.");
        }
        String ext = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : "";

        // Profile picture: images only. All other documents: PDF only.
        boolean isProfilePic = "profile_picture".equalsIgnoreCase(docType);
        List<String> allowed = isProfilePic
                ? List.of(".jpg", ".jpeg", ".png")
                : List.of(".pdf");
        if (!allowed.contains(ext.toLowerCase(Locale.ROOT))) {
            String msg = isProfilePic
                    ? "Profile picture must be a JPG or PNG image."
                    : "Documents must be uploaded as PDF files.";
            throw new BadRequestException(msg);
        }

        // Save file to disk using the configured upload directory
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + ext;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = "/api/v1/doctors/me/documents/" + storedName;

            switch (docType.toLowerCase(Locale.ROOT)) {
                case "profile_picture"    -> profile.setProfilePictureUrl(fileUrl);
                case "medical_license"    -> profile.setMedicalLicenseUrl(fileUrl);
                case "prc_id"             -> profile.setPrcIdUrl(fileUrl);
                case "board_certificate"  -> profile.setBoardCertificateUrl(fileUrl);
                case "government_id"      -> profile.setGovernmentIdUrl(fileUrl);
                default -> throw new BadRequestException(
                        "Unknown document type. Valid types: profile_picture, medical_license, prc_id, board_certificate, government_id.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file. Please try again.");
        }

        return toDoctorProfileDto(doctorProfileRepository.save(profile));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
    }

    private void ensureRole(User user, String expectedRole) {
        if (!expectedRole.equalsIgnoreCase(user.getRole())) {
            throw new ForbiddenActionException("You do not have permission to perform this action.");
        }
    }

    private DoctorProfileDto toDoctorProfileDto(DoctorProfile profile) {
        User doctor = profile.getDoctor();
        return DoctorProfileDto.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getFullName())
                .email(doctor.getEmail())
                .specialization(profile.getSpecialization())
                .clinicName(profile.getClinicName())
                .clinicAddress(profile.getClinicAddress())
                .verified(profile.isVerified())
                .rejectionReason(profile.getRejectionReason())
                .profilePictureUrl(profile.getProfilePictureUrl())
                .medicalLicenseUrl(profile.getMedicalLicenseUrl())
                .prcIdUrl(profile.getPrcIdUrl())
                .boardCertificateUrl(profile.getBoardCertificateUrl())
                .governmentIdUrl(profile.getGovernmentIdUrl())
                .build();
    }

    private DoctorSpecializationChangeRequestDto toChangeRequestDto(DoctorSpecializationChangeRequest request) {
        User doctor = request.getDoctor();
        return DoctorSpecializationChangeRequestDto.builder()
                .id(request.getId())
                .doctorId(doctor.getId())
                .doctorName(doctor.getFullName())
                .email(doctor.getEmail())
                .currentSpecialization(request.getCurrentSpecialization())
                .requestedSpecialization(request.getRequestedSpecialization())
                .reason(request.getReason())
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .createdAt(request.getCreatedAt())
                .decidedAt(request.getDecidedAt())
                .build();
    }

    private AppointmentDto toAppointmentDto(Appointment appointment) {
        return AppointmentDto.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getFullName())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getFullName())
                .appointmentAt(appointment.getAppointmentAt())
                .appointmentType(appointment.getAppointmentType())
                .notes(appointment.getNotes())
                .status(appointment.getStatus())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
