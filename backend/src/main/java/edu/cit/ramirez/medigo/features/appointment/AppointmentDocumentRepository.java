package edu.cit.ramirez.medigo.features.appointment;

import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentDocumentRepository extends JpaRepository<AppointmentDocument, Long> {
    List<AppointmentDocument> findByAppointmentId(Long appointmentId);
}
