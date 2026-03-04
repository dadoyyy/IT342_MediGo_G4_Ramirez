package com.example.backend.response;

import lombok.*;

import java.time.Instant;

/**
 * Generic API envelope.
 * Shape: { "success": bool, "data": T, "error": ErrorDetail|null, "timestamp": string }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetail error;
    private String timestamp;

    // ── Factory helpers ──────────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .error(null)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return fail(code, message, null);
    }

    public static <T> ApiResponse<T> fail(String code, String message, Object details) {
        return ApiResponse.<T>builder()
                .success(false)
                .data(null)
                .error(ErrorDetail.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .timestamp(Instant.now().toString())
                .build();
    }
}
