package edu.cit.ramirez.medigo.features.doctor;

import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeRequest;
import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorSpecializationChangeRequestRepository extends JpaRepository<DoctorSpecializationChangeRequest, Long> {

    List<DoctorSpecializationChangeRequest> findAllByOrderByCreatedAtDesc();

    List<DoctorSpecializationChangeRequest> findByStatusOrderByCreatedAtDesc(DoctorSpecializationChangeStatus status);

    List<DoctorSpecializationChangeRequest> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    Optional<DoctorSpecializationChangeRequest> findTopByDoctorIdAndStatusOrderByCreatedAtDesc(
            Long doctorId,
            DoctorSpecializationChangeStatus status
    );
}
