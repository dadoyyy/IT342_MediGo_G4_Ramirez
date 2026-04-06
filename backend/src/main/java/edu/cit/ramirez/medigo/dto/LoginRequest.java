package edu.cit.ramirez.medigo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request payload for POST /api/v1/auth/login.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
