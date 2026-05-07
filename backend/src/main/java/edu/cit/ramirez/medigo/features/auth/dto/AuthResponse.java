package edu.cit.ramirez.medigo.features.auth.dto;

import edu.cit.ramirez.medigo.features.user.dto.UserDto;
import lombok.*;

/**
 * Data returned by both /register and /login endpoints.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType;
    private UserDto user;
}
