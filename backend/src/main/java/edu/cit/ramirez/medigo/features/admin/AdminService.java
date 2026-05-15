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

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public edu.cit.ramirez.medigo.features.admin.dto.AdminAnalyticsDto getAnalytics() {
        long totalDoctors = userRepository.countByRole("DOCTOR");
        long totalPatients = userRepository.countByRole("PATIENT");
        long pending = doctorProfileRepository.findByVerifiedFalse().size();
        return new edu.cit.ramirez.medigo.features.admin.dto.AdminAnalyticsDto(totalDoctors, totalPatients, pending);
    }

    @Transactional(readOnly = true)
    public List<DoctorProfileDto> getAllDoctors() {
        return userRepository.findByRoleOrderByIdDesc("DOCTOR").stream()
                .map(user -> {
                    DoctorProfile profile = doctorProfileRepository.findByDoctorId(user.getId()).orElse(null);
                    if (profile != null) return toDto(profile);
                    // Fallback for doctors without profiles yet
                    return DoctorProfileDto.builder()
                            .doctorId(user.getId())
                            .doctorName(user.getFullName())
                            .email(user.getEmail())
                            .verified(false)
                            .build();
                })
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
        return toChangeRequestDto(doctorChangeRequestRepository.save(request));
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
        return toChangeRequestDto(doctorChangeRequestRepository.save(request));
    }

    @Transactional
    public DoctorProfileDto approveDoctor(Long doctorId) {
        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setVerified(true);
        profile.setRejectionReason(null);
        return toDto(doctorProfileRepository.save(profile));
    }

    @Transactional
    public DoctorProfileDto rejectDoctor(Long doctorId, String reason) {
        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setVerified(false);
        profile.setRejectionReason(reason != null ? reason.trim() : null);
        // Delete the profile so the doctor can re-submit with corrected documents
        doctorProfileRepository.delete(profile);
        return toDto(profile);
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
