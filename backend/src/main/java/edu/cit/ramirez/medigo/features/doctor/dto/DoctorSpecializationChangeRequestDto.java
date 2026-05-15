package edu.cit.ramirez.medigo.features.doctor.dto;

import edu.cit.ramirez.medigo.features.doctor.entity.DoctorSpecializationChangeStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorSpecializationChangeRequestDto {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private String email;
    private String currentSpecialization;
    private String requestedSpecialization;
    private String reason;
    private DoctorSpecializationChangeStatus status;
    private String adminNote;
    private Instant createdAt;
    private Instant decidedAt;
}
