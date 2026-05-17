package edu.cit.ramirez.medigo.features.user.dto;

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
    private java.time.LocalDate birthDate;
    private String gender;
    private String contactNumber;
    private String address;
    private Instant createdAt;
}
