package edu.cit.ramirez.medigo.features.appointment;

import edu.cit.ramirez.medigo.features.appointment.dto.*;
import edu.cit.ramirez.medigo.features.appointment.entity.*;
import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.DoctorSpecializationChangeRequestRepository;
import edu.cit.ramirez.medigo.features.appointment.AppointmentDocumentRepository;
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
    private final AppointmentDocumentRepository appointmentDocumentRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

    @Value("${app.consultation.upload.dir:uploads/consultation-docs}")
    private String consultationUploadDir;

    @PostConstruct
    public void logUploadDir() {
        log.info("📁 Upload directory: {}", Paths.get(uploadDir).toAbsolutePath());
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @Transactional
    public void cleanupJunkDoctors() {
        try {
            log.info("🧹 Starting database cleanup for junk 'J R' doctors...");
            java.util.List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                String name = user.getFullName() != null ? user.getFullName().trim() : "";
                String email = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";
                if (name.equalsIgnoreCase("J R") || name.equalsIgnoreCase("JR") || name.equalsIgnoreCase("J.R.") || email.startsWith("jr@") || name.contains("J R")) {
                    log.info("🧹 Removing junk doctor/user: {} (email: {})", name, email);
                    
                    // 1. Delete doctor change requests referencing the user
                    doctorChangeRequestRepository.findAll().stream()
                        .filter(req -> req.getDoctor().getId().equals(user.getId()))
                        .forEach(req -> {
                            doctorChangeRequestRepository.delete(req);
                            log.info("Deleted doctor specialization change request referencing junk user");
                        });

                    // 2. Delete DoctorProfile if present
                    doctorProfileRepository.findByDoctorId(user.getId()).ifPresent(profile -> {
                        doctorProfileRepository.delete(profile);
                        log.info("Deleted profile for junk doctor");
                    });
                    
                    // 3. Delete chat messages
                    chatMessageRepository.findAll().stream()
                        .filter(msg -> msg.getSender().getId().equals(user.getId()) || msg.getReceiver().getId().equals(user.getId()))
                        .forEach(msg -> {
                            chatMessageRepository.delete(msg);
                            log.info("Deleted chat message referencing junk user");
                        });

                    // 4. Delete appointments referencing the user
                    appointmentRepository.findAll().stream()
                        .filter(app -> app.getDoctor().getId().equals(user.getId()) || app.getPatient().getId().equals(user.getId()))
                        .forEach(app -> {
                            // Delete appointment documents if any
                            appointmentDocumentRepository.findAll().stream()
                                .filter(doc -> doc.getAppointment().getId().equals(app.getId()))
                                .forEach(doc -> {
                                    appointmentDocumentRepository.delete(doc);
                                    log.info("Deleted appointment document referencing appointment {}", app.getId());
                                });
                            appointmentRepository.delete(app);
                            log.info("Deleted appointment referencing junk user");
                        });
                    
                    // 5. Finally delete the user
                    userRepository.delete(user);
                    log.info("Successfully deleted junk user: {}", name);
                }
            }
        } catch (Exception e) {
            log.error("Error cleaning up junk doctors: ", e);
        }
    }

    @Transactional
    public List<DoctorProfileDto> searchDoctors(String query) {
        // Self-heal: ensure all DOCTOR users have a DoctorProfile in the database
        List<User> doctors = userRepository.findByRoleOrderByIdDesc("DOCTOR");
        for (User doc : doctors) {
            if (doctorProfileRepository.findByDoctorId(doc.getId()).isEmpty()) {
                DoctorProfile defaultProfile = DoctorProfile.builder()
                        .doctor(doc)
                        .specialization("General Medicine")
                        .clinicName("MediGo Clinic")
                        .clinicAddress("General Hospital, Manila")
                        .bio("Professional healthcare provider at MediGo.")
                        .yearsOfExperience(5)
                        .education("Doctor of Medicine")
                        .consultationFee(500.0)
                        .verified(true)
                        .build();
                doctorProfileRepository.save(defaultProfile);
            }
        }

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
        profile.setBio(request.getBio() == null ? null : request.getBio().trim());
        profile.setYearsOfExperience(request.getYearsOfExperience());
        profile.setEducation(request.getEducation() == null ? null : request.getEducation().trim());
        profile.setConsultationFee(request.getConsultationFee());
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

        // if (!doctorProfile.isVerified()) {
        //     throw new BadRequestException("Selected doctor is not verified yet.");
        // }

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
                && target != AppointmentStatus.CANCELLED
                && target != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Doctor can only set status to CONFIRMED, REJECTED, CANCELLED, or COMPLETED.");
        }

        if (target == AppointmentStatus.COMPLETED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed appointments can be marked as completed.");
        }

        appointment.setStatus(target);
        Appointment saved = appointmentRepository.save(appointment);

        if (target == AppointmentStatus.CONFIRMED && previous != AppointmentStatus.CONFIRMED) {
            sendConfirmationMessage(saved);
        } else if ((target == AppointmentStatus.REJECTED && previous != AppointmentStatus.REJECTED)
                || (target == AppointmentStatus.CANCELLED && previous != AppointmentStatus.CANCELLED)) {
            sendCancellationMessage(saved, request.getReason());
        } else if (target == AppointmentStatus.COMPLETED && previous != AppointmentStatus.COMPLETED) {
            if (request.getDocumentUrls() != null) {
                for (String url : request.getDocumentUrls()) {
                    String fileName = url.substring(url.lastIndexOf("/") + 1);
                    AppointmentDocument doc = AppointmentDocument.builder()
                            .appointment(saved)
                            .fileName(fileName)
                            .fileUrl(url)
                            .documentType("CONSULTATION_RESULT")
                            .build();
                    appointmentDocumentRepository.save(doc);
                }
            }
            sendCompletionMessage(saved, request.getMedicalNotes(), request.getFollowUpAt());
        }

        return toAppointmentDto(saved);
    }

    public String uploadConsultationDocument(MultipartFile file) throws IOException {
        Path root = Paths.get(consultationUploadDir);
        if (!Files.exists(root)) Files.createDirectories(root);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;
        Files.copy(file.getInputStream(), root.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

        return "/api/v1/appointments/docs/view/" + fileName;
    }

    private void sendCompletionMessage(Appointment appointment, String notes, String followUp) {
        StringBuilder content = new StringBuilder("[APPT_COMPLETED]")
                .append("|Doctor=").append(appointment.getDoctor().getFullName())
                .append("|Patient=").append(appointment.getPatient().getFullName())
                .append("|Consultation=").append(appointment.getAppointmentType());

        if (notes != null && !notes.isBlank()) {
            content.append("|Medical Notes=").append(notes.trim());
        }
        if (followUp != null && !followUp.isBlank()) {
            content.append("|Follow-up=").append(followUp.trim());
        }

        // Add Document Links
        List<AppointmentDocument> docs = appointmentDocumentRepository.findByAppointmentId(appointment.getId());
        if (!docs.isEmpty()) {
            StringBuilder docLinks = new StringBuilder();
            for (int i = 0; i < docs.size(); i++) {
                if (i > 0) docLinks.append(";");
                docLinks.append("Result ").append(i + 1).append(":").append(docs.get(i).getFileUrl());
            }
            content.append("|Digital Records=").append(docLinks.toString());
        }

        // Standard post-consultation instructions
        content.append("|Instructions=").append("Your prescription and digital medical records are processed and available for download in this summary.");

        ChatMessage message = new ChatMessage();
        message.setSender(appointment.getDoctor());
        message.setReceiver(appointment.getPatient());
        message.setAppointment(appointment);
        message.setContent(content.toString());
        chatMessageRepository.save(message);
    }

    private void sendConfirmationMessage(Appointment appointment) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a", Locale.ENGLISH);
        String when = appointment.getAppointmentAt() == null ? "" : appointment.getAppointmentAt().format(formatter);

        User patient = appointment.getPatient();
        String patientDetails = patient.getFullName();
        if (patient.getBirthDate() != null) {
            int age = java.time.Period.between(patient.getBirthDate(), java.time.LocalDate.now()).getYears();
            patientDetails += " (" + age + "y";
            if (patient.getGender() != null) {
                patientDetails += ", " + patient.getGender();
            }
            patientDetails += ")";
        } else if (patient.getGender() != null) {
            patientDetails += " (" + patient.getGender() + ")";
        }

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(appointment.getDoctor().getId()).orElse(null);
        String location = "TBA";
        String instructions = "Please arrive 15 minutes before your scheduled appointment.";

        if (profile != null) {
            boolean isOnline = "Online".equalsIgnoreCase(appointment.getAppointmentType());
            if (isOnline) {
                location = "Online Meeting (Link will be sent via chat)";
                instructions = "Ensure you have a stable internet connection. The telehealth meeting link will be shared here 5 minutes before your session.";
            } else {
                String clinicName = profile.getClinicName() == null ? "" : profile.getClinicName().trim();
                String clinicAddress = profile.getClinicAddress() == null ? "" : profile.getClinicAddress().trim();
                if (!clinicName.isBlank() && !clinicAddress.isBlank()) {
                    location = clinicName + " - " + clinicAddress;
                } else if (!clinicName.isBlank()) {
                    location = clinicName;
                } else if (!clinicAddress.isBlank()) {
                    location = clinicAddress;
                }
                instructions = "Please bring a valid ID and arrive 15 minutes early at the clinic for documentation.";
            }
        }

        StringBuilder content = new StringBuilder("[APPT_CONFIRMED]")
                .append("|Doctor=").append(appointment.getDoctor().getFullName())
                .append("|Patient=").append(patientDetails)
                .append("|When=").append(when)
                .append("|Type=").append(appointment.getAppointmentType())
                .append("|Location=").append(location)
                .append("|Instructions=").append(instructions);

        ChatMessage message = new ChatMessage();
        message.setSender(appointment.getDoctor());
        message.setReceiver(appointment.getPatient());
        message.setAppointment(appointment);
        message.setContent(content.toString());
        chatMessageRepository.save(message);
    }

    private void sendCancellationMessage(Appointment appointment, String reason) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a", Locale.ENGLISH);
        String when = appointment.getAppointmentAt() == null ? "" : appointment.getAppointmentAt().format(formatter);

        StringBuilder content = new StringBuilder("[APPT_CANCELLED]")
                .append("|Doctor=").append(appointment.getDoctor().getFullName())
                .append("|Patient=").append(appointment.getPatient().getFullName())
                .append("|When=").append(when)
                .append("|Type=").append(appointment.getAppointmentType())
                .append("|Status=").append(appointment.getStatus() == AppointmentStatus.REJECTED ? "Declined" : "Cancelled");

        if (reason != null && !reason.isBlank()) {
            content.append("|Reason=").append(reason.trim());
        } else {
            content.append("|Reason=").append("No reason provided by the doctor.");
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
        long completedCount = appointmentRepository.countByDoctorIdAndStatus(doctor.getId(), AppointmentStatus.COMPLETED);

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
                .bio(profile.getBio())
                .yearsOfExperience(profile.getYearsOfExperience())
                .education(profile.getEducation())
                .patientCount(completedCount)
                .consultationFee(profile.getConsultationFee())
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
        User patient = appointment.getPatient();
        Integer age = null;
        if (patient.getBirthDate() != null) {
            age = java.time.Period.between(patient.getBirthDate(), java.time.LocalDate.now()).getYears();
        }

        return AppointmentDto.builder()
                .id(appointment.getId())
                .patientId(patient.getId())
                .patientName(patient.getFullName())
                .patientAge(age)
                .patientGender(patient.getGender())
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
