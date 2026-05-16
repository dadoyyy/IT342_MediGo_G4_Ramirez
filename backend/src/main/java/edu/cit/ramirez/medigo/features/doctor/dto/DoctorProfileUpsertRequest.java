package edu.cit.ramirez.medigo.features.doctor.dto;

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
    @Size(max = 500, message = "Specialization must not exceed 500 characters")
    private String specialization;

    @NotBlank(message = "Clinic name is required")
    @Size(max = 150, message = "Clinic name must not exceed 150 characters")
    private String clinicName;

    @NotBlank(message = "Clinic address is required")
    @Size(max = 255, message = "Clinic address must not exceed 255 characters")
    private String clinicAddress;

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;

    private Integer yearsOfExperience;

    @Size(max = 500, message = "Education must not exceed 500 characters")
    private String education;
}
