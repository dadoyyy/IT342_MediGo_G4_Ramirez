package edu.cit.ramirez.medigo.features.admin;

import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile;
import edu.cit.ramirez.medigo.features.user.entity.User;
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

    @Value("${app.upload.dir:uploads/doctor-docs}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<DoctorProfileDto> getPendingDoctors() {
        return doctorProfileRepository.findByVerifiedFalse().stream()
                .map(this::toDto)
                .toList();
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
        Path dir = Paths.get(uploadDir).isAbsolute()
                ? Paths.get(uploadDir)
                : Paths.get(System.getProperty("user.home"), ".medigo", "uploads", "doctor-docs");
        Path filePath = dir.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("File not found: " + filename);
        }
        return resource;
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
}
