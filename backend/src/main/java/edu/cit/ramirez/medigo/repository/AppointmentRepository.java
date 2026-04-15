package edu.cit.ramirez.medigo.repository;

import edu.cit.ramirez.medigo.entity.Appointment;
import edu.cit.ramirez.medigo.entity.AppointmentStatus;
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
}
