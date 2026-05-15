package edu.cit.ramirez.medigo.features.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorSpecializationChangeRequestCreateRequest {

    @NotBlank(message = "Requested specialization is required")
    @Size(max = 500, message = "Requested specialization must not exceed 500 characters")
    private String requestedSpecialization;

    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;
}
