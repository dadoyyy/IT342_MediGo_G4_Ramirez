package edu.cit.ramirez.medigo.features.auth.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request payload for POST /api/v1/auth/register.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstname;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastname;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@(gmail\\.com|medigo\\.com)$", message = "Only Gmail or Medigo accounts are allowed")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$",
        message = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
    )
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "PATIENT|DOCTOR|ADMIN", message = "Role must be PATIENT, DOCTOR, or ADMIN")
    private String role;

    private String birthDate;

    private String gender;

    private String contactNumber;

    private String address;

    /** Required for DOCTOR registrations. */
    private String licenseNumber;
}
