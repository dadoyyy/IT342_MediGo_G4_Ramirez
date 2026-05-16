package edu.cit.ramirez.medigo.features.admin;

import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.DoctorSpecializationChangeRequestRepository;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorSpecializationChangeRequestDto;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeRequest;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeStatus;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.BadRequestException;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import edu.cit.ramirez.medigo.features.appointment.AppointmentRepository;
import edu.cit.ramirez.medigo.shared.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorSpecializationChangeRequestRepository doctorChangeRequestRepository;
    private final edu.cit.ramirez.medigo.features.user.UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public edu.cit.ramirez.medigo.features.admin.dto.AdminAnalyticsDto getAnalytics() {
        long verifiedDoctors = doctorProfileRepository.countByVerifiedTrue();
        long totalPatients = userRepository.countByRole("PATIENT");
        long pending = doctorProfileRepository.findByVerifiedFalse().size();
        return new edu.cit.ramirez.medigo.features.admin.dto.AdminAnalyticsDto(verifiedDoctors, totalPatients, pending);
    }

    @Transactional(readOnly = true)
    public List<DoctorProfileDto> getAllDoctors() {
        // Only return doctors with verified profiles for the main management list
        return doctorProfileRepository.searchVerifiedDoctors(null).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<edu.cit.ramirez.medigo.features.user.dto.UserDto> getAllPatients() {
        return userRepository.findByRoleOrderByIdDesc("PATIENT").stream()
                .map(this::toUserDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorProfileDto> getPendingDoctors() {
        return doctorProfileRepository.findByVerifiedFalse().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorSpecializationChangeRequestDto> getSpecializationChangeRequests(String status) {
        if (status == null || status.isBlank()) {
            return doctorChangeRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::toChangeRequestDto)
                    .toList();
        }
        DoctorSpecializationChangeStatus parsed;
        try {
            parsed = DoctorSpecializationChangeStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status. Use PENDING, APPROVED, or REJECTED.");
        }
        return doctorChangeRequestRepository.findByStatusOrderByCreatedAtDesc(parsed).stream()
                .map(this::toChangeRequestDto)
                .toList();
    }

    @Transactional
    public DoctorSpecializationChangeRequestDto approveSpecializationChange(Long requestId, String note) {
        DoctorSpecializationChangeRequest request = doctorChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Change request not found."));
        if (request.getStatus() != DoctorSpecializationChangeStatus.PENDING) {
            throw new BadRequestException("Change request is no longer pending.");
        }

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(request.getDoctor().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setSpecialization(request.getRequestedSpecialization());
        doctorProfileRepository.save(profile);

        request.setStatus(DoctorSpecializationChangeStatus.APPROVED);
        request.setAdminNote(note != null ? note.trim() : null);
        request.setDecidedAt(java.time.Instant.now());
        DoctorSpecializationChangeRequest saved = doctorChangeRequestRepository.save(request);
        emailService.sendSpecializationApprovalEmail(saved.getDoctor().getEmail(), saved.getDoctor().getFullName(), saved.getRequestedSpecialization());
        return toChangeRequestDto(saved);
    }

    @Transactional
    public DoctorSpecializationChangeRequestDto rejectSpecializationChange(Long requestId, String note) {
        DoctorSpecializationChangeRequest request = doctorChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Change request not found."));
        if (request.getStatus() != DoctorSpecializationChangeStatus.PENDING) {
            throw new BadRequestException("Change request is no longer pending.");
        }
        request.setStatus(DoctorSpecializationChangeStatus.REJECTED);
        request.setAdminNote(note != null ? note.trim() : null);
        request.setDecidedAt(java.time.Instant.now());
        DoctorSpecializationChangeRequest saved = doctorChangeRequestRepository.save(request);
        emailService.sendSpecializationRejectionEmail(saved.getDoctor().getEmail(), saved.getDoctor().getFullName(), saved.getAdminNote());
        return toChangeRequestDto(saved);
    }

    @Transactional
    public DoctorProfileDto approveDoctor(Long doctorId) {
        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setVerified(true);
        profile.setRejectionReason(null);
        DoctorProfile saved = doctorProfileRepository.save(profile);
        
        // Notify the doctor via email
        emailService.sendDoctorApprovalEmail(saved.getDoctor().getEmail(), saved.getDoctor().getFullName());
        
        return toDto(saved);
    }

    @Transactional
    public DoctorProfileDto rejectDoctor(Long doctorId, String reason) {
        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setVerified(false);
        profile.setRejectionReason(reason != null ? reason.trim() : null);
        
        // Notify the doctor via email
        emailService.sendDoctorRejectionEmail(profile.getDoctor().getEmail(), profile.getDoctor().getFullName(), profile.getRejectionReason());
        
        // Delete the profile so the doctor can re-submit with corrected documents
        doctorProfileRepository.delete(profile);
        return toDto(profile);
    }

    @Transactional
    public void deleteDoctorAccount(Long doctorId, String reason) {
        User user = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found."));
        
        if (!"DOCTOR".equals(user.getRole())) {
            throw new BadRequestException("User is not a doctor.");
        }

        // 1. Notify the doctor BEFORE deletion while we still have their info
        emailService.sendDoctorDeletionEmail(user.getEmail(), user.getFullName(), reason);

        // 2. Clean up associated data
        // Delete appointments where this user is the doctor
        appointmentRepository.findByDoctorId(doctorId).forEach(appointmentRepository::delete);
        
        // Delete profile
        doctorProfileRepository.findByDoctorId(doctorId).ifPresent(doctorProfileRepository::delete);
        
        // Delete specialization change requests
        doctorChangeRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> r.getDoctor().getId().equals(doctorId))
                .forEach(doctorChangeRequestRepository::delete);

        // 3. Delete the user account itself
        userRepository.delete(user);
    }

    @Transactional
    public void deletePatientAccount(Long patientId, String reason) {
        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found."));
        
        if (!"PATIENT".equals(user.getRole())) {
            throw new BadRequestException("User is not a patient.");
        }

        // 1. Notify the patient
        emailService.sendPatientDeletionEmail(user.getEmail(), user.getFullName(), reason);

        // 2. Clean up data
        // Delete appointments where this user is the patient
        appointmentRepository.findByPatientId(patientId).forEach(appointmentRepository::delete);

        // 3. Delete the user
        userRepository.delete(user);
    }

    /** Serve a document file for admin review — bypasses the DOCTOR-only endpoint. */
    public Resource serveDocument(String filename) throws MalformedURLException {
        // Resolve the upload directory — use the configured path directly
        Path dir = Paths.get(uploadDir);
        Path filePath = dir.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("File not found: " + filename);
        }
        return resource;
    }

    private edu.cit.ramirez.medigo.features.user.dto.UserDto toUserDto(User user) {
        return edu.cit.ramirez.medigo.features.user.dto.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private DoctorProfileDto toDto(DoctorProfile profile) {
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
                .bio(profile.getBio())
                .yearsOfExperience(profile.getYearsOfExperience())
                .education(profile.getEducation())
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
}
