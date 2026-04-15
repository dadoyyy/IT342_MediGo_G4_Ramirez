package edu.cit.ramirez.medigo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatContactDto {
    private Long id;
    private String fullName;
    private String email;
    private String role;
}
