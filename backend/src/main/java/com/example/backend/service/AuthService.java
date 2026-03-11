package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.User;
import com.example.backend.exception.*;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Business logic for registration and login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ── Registration ──────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        String fullName = (request.getFirstname() + " " + request.getLastname()).trim();

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(fullName)
                .role(request.getRole().toUpperCase())
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());

        return buildAuthResponse(saved, token);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return buildAuthResponse(user, token);
    }

    // ── OAuth2 (Google) ───────────────────────────────────────────────────────

    /**
     * Called after Google authentication.
     * Returns the user's JWT if the account already exists,
     * or empty if this is a brand-new user who must still choose a role.
     */
    @Transactional
    public Optional<AuthResponse> loginWithGoogle(String email, String name) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email not provided by Google OAuth2");
        }
        return userRepository.findByEmail(email.toLowerCase())
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getEmail());
                    return buildAuthResponse(user, token);
                });
    }

    /**
     * Completes registration for a first-time Google user after they have
     * chosen their role on the frontend.
     */
    @Transactional
    public AuthResponse completeGoogleRegistration(String email, String name, String role) {
        if (userRepository.existsByEmail(email.toLowerCase())) {
            // Race condition edge case — user already exists, just log them in
            User existing = userRepository.findByEmail(email.toLowerCase()).orElseThrow();
            String token = jwtUtil.generateToken(existing.getEmail());
            return buildAuthResponse(existing, token);
        }

        User user = User.builder()
                .email(email.toLowerCase())
                .passwordHash("")
                .fullName(name != null && !name.isBlank() ? name : email)
                .role(role.toUpperCase())
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());
        return buildAuthResponse(saved, token);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String token) {
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userDto)
                .build();
    }
}
