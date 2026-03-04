package com.example.backend.exception;

import com.example.backend.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised error handling — all exceptions are mapped to the ApiResponse envelope.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Validation errors (400) ───────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() == null ? "Invalid value" : fe.getDefaultMessage(),
                        (a, b) -> a));

        return ApiResponse.fail("VALIDATION_ERROR", "Request validation failed.", fieldErrors);
    }

    // ── Duplicate email (409) ─────────────────────────────────────────────────

    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDuplicateEmail(EmailAlreadyExistsException ex) {
        return ApiResponse.fail("EMAIL_ALREADY_EXISTS", ex.getMessage());
    }

    // ── Bad credentials (401) ─────────────────────────────────────────────────

    @ExceptionHandler({InvalidCredentialsException.class, BadCredentialsException.class})
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleBadCredentials(RuntimeException ex) {
        return ApiResponse.fail("INVALID_CREDENTIALS", "Invalid email or password.");
    }

    // ── Anything else (500) ───────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ApiResponse.fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
    }
}
