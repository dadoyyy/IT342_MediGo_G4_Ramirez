package edu.cit.ramirez.medigo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorProfileUpsertRequest {

    @NotBlank(message = "Specialization is required")
    @Size(max = 120, message = "Specialization must not exceed 120 characters")
    private String specialization;

    @NotBlank(message = "Clinic name is required")
    @Size(max = 150, message = "Clinic name must not exceed 150 characters")
    private String clinicName;

    @NotBlank(message = "Clinic address is required")
    @Size(max = 255, message = "Clinic address must not exceed 255 characters")
    private String clinicAddress;
}
