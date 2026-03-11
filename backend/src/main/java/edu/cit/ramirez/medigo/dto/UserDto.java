package edu.cit.ramirez.medigo.dto;

import lombok.*;

import java.time.Instant;

/**
 * Safe projection of a User – never contains passwordHash.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private Long id;
    private String email;
    private String fullName;
    private String role;
    private Instant createdAt;
}
