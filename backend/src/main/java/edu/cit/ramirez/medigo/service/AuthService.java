package edu.cit.ramirez.medigo.service;

import edu.cit.ramirez.medigo.dto.*;
import edu.cit.ramirez.medigo.entity.User;
import edu.cit.ramirez.medigo.exception.*;
import edu.cit.ramirez.medigo.patterns.adapter.UserAuthAdapter;
import edu.cit.ramirez.medigo.patterns.factory.UserFactory;
import edu.cit.ramirez.medigo.patterns.observer.AuthEvent;
import edu.cit.ramirez.medigo.patterns.observer.AuthEventType;
import edu.cit.ramirez.medigo.repository.UserRepository;
import edu.cit.ramirez.medigo.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
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
    private final UserFactory userFactory;
    private final UserAuthAdapter userAuthAdapter;
    private final ApplicationEventPublisher eventPublisher;

    // ── Registration ──────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = userFactory.createLocalUser(request, passwordEncoder.encode(request.getPassword()));

        User saved = Objects.requireNonNull(userRepository.save(user));
        String token = jwtUtil.generateToken(saved.getEmail());
        eventPublisher.publishEvent(new AuthEvent(saved.getEmail(), saved.getRole(), AuthEventType.REGISTER));

        return userAuthAdapter.toAuthResponse(saved, token);
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
        eventPublisher.publishEvent(new AuthEvent(user.getEmail(), user.getRole(), AuthEventType.LOGIN));

        return userAuthAdapter.toAuthResponse(user, token);
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
                    eventPublisher.publishEvent(new AuthEvent(user.getEmail(), user.getRole(), AuthEventType.LOGIN));
                    return userAuthAdapter.toAuthResponse(user, token);
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
            eventPublisher.publishEvent(new AuthEvent(existing.getEmail(), existing.getRole(), AuthEventType.LOGIN));
            return userAuthAdapter.toAuthResponse(existing, token);
        }

        User user = userFactory.createGoogleUser(email, name, role);

        User saved = Objects.requireNonNull(userRepository.save(user));
        String token = jwtUtil.generateToken(saved.getEmail());
        eventPublisher.publishEvent(new AuthEvent(saved.getEmail(), saved.getRole(), AuthEventType.GOOGLE_REGISTER));
        return userAuthAdapter.toAuthResponse(saved, token);
    }

    // ── Current user ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(InvalidCredentialsException::new);
        return userAuthAdapter.toUserDto(user);
    }
}
