package edu.cit.ramirez.medigo.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentCreateRequest {

    @NotNull(message = "Doctor is required")
    private Long doctorId;

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment date and time must be in the future")
    private LocalDateTime appointmentAt;

    @NotBlank(message = "Appointment type is required")
    @Size(max = 80, message = "Appointment type must not exceed 80 characters")
    private String appointmentType;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
