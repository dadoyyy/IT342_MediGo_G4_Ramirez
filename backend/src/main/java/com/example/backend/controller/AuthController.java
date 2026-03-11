package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.response.ApiResponse;
import com.example.backend.security.TokenBlacklistService;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

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

    /**
     * Revoke the current JWT so it cannot be reused after logout.
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            tokenBlacklistService.revoke(token, jwtUtil.extractExpiry(token));
        }
    }

    /**
     * Completes Google OAuth2 registration for first-time users.
     * Verifies the short-lived pending token and creates the account with the chosen role.
     */
    @PostMapping("/oauth2/complete")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AuthResponse> completeOAuth2Registration(
            @RequestBody CompleteOAuth2Request body) {
        if (!jwtUtil.isPendingToken(body.getPendingToken())) {
            throw new IllegalArgumentException("Invalid or expired registration token. Please sign in with Google again.");
        }
        String email = jwtUtil.extractEmail(body.getPendingToken());
        String name  = jwtUtil.extractNameFromPending(body.getPendingToken());
        String role  = body.getRole();
        if (role == null || (!role.equalsIgnoreCase("PATIENT") && !role.equalsIgnoreCase("DOCTOR"))) {
            throw new IllegalArgumentException("Role must be PATIENT or DOCTOR.");
        }
        AuthResponse authResponse = authService.completeGoogleRegistration(email, name, role);
        return ApiResponse.ok(authResponse);
    }

    /**
     * Returns the currently authenticated user's profile.
     * Requires a valid Bearer JWT.
     */
    @GetMapping("/me")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<UserDto> me(java.security.Principal principal) {
        UserDto userDto = authService.getCurrentUser(principal.getName());
        return ApiResponse.ok(userDto);
    }
}
