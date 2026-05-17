package edu.cit.ramirez.medigo.features.appointment;

import edu.cit.ramirez.medigo.features.appointment.entity.Appointment;
import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.patient p
            JOIN FETCH a.doctor d
            WHERE p.id = :patientId
            ORDER BY a.appointmentAt DESC
            """)
    List<Appointment> findByPatientId(@Param("patientId") Long patientId);

    @Query("""
            SELECT a
            FROM Appointment a
            JOIN FETCH a.patient p
            JOIN FETCH a.doctor d
            WHERE d.id = :doctorId
            ORDER BY a.appointmentAt DESC
            """)
    List<Appointment> findByDoctorId(@Param("doctorId") Long doctorId);

    boolean existsByDoctorIdAndAppointmentAtAndStatusNotIn(
            Long doctorId,
            LocalDateTime appointmentAt,
            List<AppointmentStatus> disallowedStatuses
    );

    /**
     * Returns true if a CONFIRMED or COMPLETED appointment exists
     * between the given patient and doctor (in either direction).
     */
    @Query("""
            SELECT COUNT(a) > 0
            FROM Appointment a
            WHERE a.status IN (
                edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus.CONFIRMED,
                edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus.COMPLETED,
                edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus.PENDING_DOCTOR_APPROVAL,
                edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus.CANCELLED,
                edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus.REJECTED
            )
            AND (
                (a.patient.id = :patientId AND a.doctor.id = :doctorId)
                OR
                (a.patient.id = :doctorId AND a.doctor.id = :patientId)
            )
            """)
    boolean existsSuccessfulAppointmentBetween(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId
    );

    long countByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);
}
