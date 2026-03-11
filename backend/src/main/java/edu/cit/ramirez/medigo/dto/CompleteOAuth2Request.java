package edu.cit.ramirez.medigo.dto;

import lombok.*;

/**
 * Request body for completing Google OAuth2 registration.
 * The client submits the short-lived pending token plus the chosen role.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompleteOAuth2Request {
    private String pendingToken;
    private String role;          // "PATIENT" or "DOCTOR"
}
