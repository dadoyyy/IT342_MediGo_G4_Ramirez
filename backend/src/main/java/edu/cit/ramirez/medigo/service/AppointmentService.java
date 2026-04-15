package edu.cit.ramirez.medigo.service;

import edu.cit.ramirez.medigo.dto.*;
import edu.cit.ramirez.medigo.entity.*;
import edu.cit.ramirez.medigo.exception.BadRequestException;
import edu.cit.ramirez.medigo.exception.ForbiddenActionException;
import edu.cit.ramirez.medigo.exception.ResourceNotFoundException;
import edu.cit.ramirez.medigo.repository.AppointmentRepository;
import edu.cit.ramirez.medigo.repository.DoctorProfileRepository;
import edu.cit.ramirez.medigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;

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

        profile.setSpecialization(request.getSpecialization().trim());
        profile.setClinicName(request.getClinicName().trim());
        profile.setClinicAddress(request.getClinicAddress().trim());
        profile.setVerified(true);

        DoctorProfile saved = doctorProfileRepository.save(profile);
        return toDoctorProfileDto(saved);
    }

    @Transactional(readOnly = true)
    public DoctorProfileDto getMyDoctorProfile(String email) {
        User doctor = findUserByEmail(email);
        ensureRole(doctor, "DOCTOR");

        DoctorProfile profile = doctorProfileRepository.findByDoctorId(doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found. Please complete your professional profile."));

        return toDoctorProfileDto(profile);
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
        if (target != AppointmentStatus.CONFIRMED
                && target != AppointmentStatus.REJECTED
                && target != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Doctor can only set status to CONFIRMED, REJECTED, or COMPLETED.");
        }

        if (target == AppointmentStatus.COMPLETED && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed appointments can be marked as completed.");
        }

        appointment.setStatus(target);
        return toAppointmentDto(appointmentRepository.save(appointment));
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
