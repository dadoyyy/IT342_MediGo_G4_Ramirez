package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.response.ApiResponse;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Public authentication endpoints.
 *
 * POST /api/v1/auth/register  – create new account
 * POST /api/v1/auth/login     – authenticate and receive JWT
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user (PATIENT or DOCTOR).
     * Returns: ApiResponse<AuthResponse>
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ApiResponse.ok(authResponse);
    }

    /**
     * Authenticate an existing user.
     * Returns: ApiResponse<AuthResponse>
     */
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ApiResponse.ok(authResponse);
    }
}
