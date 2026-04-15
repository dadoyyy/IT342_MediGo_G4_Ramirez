package edu.cit.ramirez.medigo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSendRequest {

    @NotNull(message = "Receiver is required")
    private Long receiverId;

    private Long appointmentId;

    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message content must not exceed 1000 characters")
    private String content;
}
