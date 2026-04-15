package edu.cit.ramirez.medigo.dto;

import edu.cit.ramirez.medigo.entity.AppointmentStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDto {

    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private LocalDateTime appointmentAt;
    private String appointmentType;
    private String notes;
    private AppointmentStatus status;
    private Instant createdAt;
}
