package edu.cit.ramirez.medigo.features.admin;

import edu.cit.ramirez.medigo.features.doctor.DoctorProfileRepository;
import edu.cit.ramirez.medigo.features.doctor.dto.DoctorProfileDto;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorProfile;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final DoctorProfileRepository doctorProfileRepository;

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
        return toDto(doctorProfileRepository.save(profile));
    }

    @Transactional
    public DoctorProfileDto rejectDoctor(Long doctorId) {
        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        profile.setVerified(false);
        // Optionally delete the profile so the doctor can re-submit
        doctorProfileRepository.delete(profile);
        return toDto(profile);
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
                .profilePictureUrl(profile.getProfilePictureUrl())
                .medicalLicenseUrl(profile.getMedicalLicenseUrl())
                .prcIdUrl(profile.getPrcIdUrl())
                .boardCertificateUrl(profile.getBoardCertificateUrl())
                .governmentIdUrl(profile.getGovernmentIdUrl())
                .build();
    }
}
