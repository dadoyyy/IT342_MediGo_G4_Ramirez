package edu.cit.ramirez.medigo.features.auth;

import edu.cit.ramirez.medigo.features.auth.dto.*;
import edu.cit.ramirez.medigo.features.auth.security.JwtUtil;
import edu.cit.ramirez.medigo.features.auth.security.TokenBlacklistService;
import edu.cit.ramirez.medigo.features.user.dto.UserDto;
import edu.cit.ramirez.medigo.shared.patterns.strategy.UserRoleStrategyResolver;
import edu.cit.ramirez.medigo.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Public authentication endpoints.
 *
 * POST /api/v1/auth/register – create new account
 * POST /api/v1/auth/login – authenticate and receive JWT
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRoleStrategyResolver userRoleStrategyResolver;

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
     * Verifies the short-lived pending token and creates the account with the
     * chosen role.
     */
    @PostMapping("/oauth2/complete")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AuthResponse> completeOAuth2Registration(
            @RequestBody CompleteOAuth2Request body) {
        if (!jwtUtil.isPendingToken(body.getPendingToken())) {
            throw new IllegalArgumentException(
                    "Invalid or expired registration token. Please sign in with Google again.");
        }
        String email = jwtUtil.extractEmail(body.getPendingToken());
        String name = jwtUtil.extractNameFromPending(body.getPendingToken());
        String role = userRoleStrategyResolver.resolveNormalizedRole(body.getRole());
        AuthResponse authResponse = authService.completeGoogleRegistration(email, name, role);
        return ApiResponse.ok(authResponse);
    }

    /**
     * Returns the currently authenticated user's profile.
     * Requires a valid Bearer JWT.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getCurrentUser(principal.getName())));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully. You can now log in."));
    }
}
