package edu.cit.ramirez.medigo.response;

import lombok.*;

/**
 * Nested error object inside ApiResponse.
 * Shape: { "code": string, "message": string, "details": object|null }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorDetail {

    private String code;
    private String message;
    private Object details;
}
