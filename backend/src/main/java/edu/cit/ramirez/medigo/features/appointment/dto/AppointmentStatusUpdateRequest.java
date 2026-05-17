package edu.cit.ramirez.medigo.features.appointment.dto;

import edu.cit.ramirez.medigo.features.appointment.entity.AppointmentStatus;
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

    private String medicalNotes;
    private String followUpAt;
    private java.util.List<String> documentUrls;
    private String reason;

    public AppointmentStatusUpdateRequest(AppointmentStatus status) {
        this.status = status;
    }
}
