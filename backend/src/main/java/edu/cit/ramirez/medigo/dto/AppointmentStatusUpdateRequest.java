package edu.cit.ramirez.medigo.dto;

import edu.cit.ramirez.medigo.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;
}
