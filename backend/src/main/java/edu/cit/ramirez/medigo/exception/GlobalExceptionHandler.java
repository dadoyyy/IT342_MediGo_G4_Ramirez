package edu.cit.ramirez.medigo.exception;

import edu.cit.ramirez.medigo.response.ApiResponse;
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

    // ── Bad request (400) ────────────────────────────────────────────────────

    @ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(RuntimeException ex) {
        return ApiResponse.fail("BAD_REQUEST", ex.getMessage());
    }

    // ── Forbidden (403) ──────────────────────────────────────────────────────

    @ExceptionHandler(ForbiddenActionException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleForbidden(ForbiddenActionException ex) {
        return ApiResponse.fail("FORBIDDEN", ex.getMessage());
    }

    // ── Not found (404) ──────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(ResourceNotFoundException ex) {
        return ApiResponse.fail("NOT_FOUND", ex.getMessage());
    }

    // ── Anything else (500) ───────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ApiResponse.fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
    }
}
