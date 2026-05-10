package edu.cit.ramirez.medigo.features.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatContactDto {
    /** Alias for id — used by the frontend */
    private Long userId;
    private Long id;
    private String fullName;
    /** Convenience split — first word of fullName */
    private String firstName;
    /** Convenience split — remaining words of fullName */
    private String lastName;
    private String email;
    private String role;
}
