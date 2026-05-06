package edu.cit.ramirez.medigo.features;

import edu.cit.ramirez.medigo.features.auth.AuthService;
import edu.cit.ramirez.medigo.features.auth.dto.AuthResponse;
import edu.cit.ramirez.medigo.features.auth.dto.LoginRequest;
import edu.cit.ramirez.medigo.features.auth.dto.RegisterRequest;
import edu.cit.ramirez.medigo.features.auth.security.JwtUtil;
import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.dto.UserDto;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.exception.EmailAlreadyExistsException;
import edu.cit.ramirez.medigo.shared.exception.InvalidCredentialsException;
import edu.cit.ramirez.medigo.shared.patterns.adapter.UserAuthAdapter;
import edu.cit.ramirez.medigo.shared.patterns.factory.UserFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService — all dependencies are mocked.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserFactory userFactory;
    @Mock private UserAuthAdapter userAuthAdapter;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private AuthResponse sampleAuthResponse;
    private UserDto sampleUserDto;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .email("patient@example.com")
                .passwordHash("$2a$12$hashedpassword")
                .fullName("Juan Dela Cruz")
                .role("PATIENT")
                .createdAt(Instant.now())
                .build();

        sampleUserDto = UserDto.builder()
                .id(1L)
                .email("patient@example.com")
                .fullName("Juan Dela Cruz")
                .role("PATIENT")
                .createdAt(sampleUser.getCreatedAt())
                .build();

        sampleAuthResponse = AuthResponse.builder()
                .token("mock.jwt.token")
                .tokenType("Bearer")
                .user(sampleUserDto)
                .build();
    }

    // ── register() ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register() — success: new user is saved and JWT returned")
    void register_success() {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Juan")
                .lastname("Dela Cruz")
                .email("patient@example.com")
                .password("Password1!")
                .role("PATIENT")
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashedpassword");
        when(userFactory.createLocalUser(any(), anyString())).thenReturn(sampleUser);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtUtil.generateToken(anyString())).thenReturn("mock.jwt.token");
        when(userAuthAdapter.toAuthResponse(any(User.class), anyString())).thenReturn(sampleAuthResponse);

        AuthResponse result = authService.register(request);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("mock.jwt.token");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        assertThat(result.getUser().getEmail()).isEqualTo("patient@example.com");

        verify(userRepository).save(any(User.class));
        verify(jwtUtil).generateToken("patient@example.com");
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    @DisplayName("register() — throws EmailAlreadyExistsException when email is taken")
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = RegisterRequest.builder()
                .firstname("Juan")
                .lastname("Dela Cruz")
                .email("existing@example.com")
                .password("Password1!")
                .role("PATIENT")
                .build();

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("existing@example.com");

        verify(userRepository, never()).save(any());
    }

    // ── login() ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login() — success: valid credentials return JWT")
    void login_success() {
        LoginRequest request = new LoginRequest("patient@example.com", "Password1!");

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password1!", "$2a$12$hashedpassword")).thenReturn(true);
        when(jwtUtil.generateToken("patient@example.com")).thenReturn("mock.jwt.token");
        when(userAuthAdapter.toAuthResponse(sampleUser, "mock.jwt.token")).thenReturn(sampleAuthResponse);

        AuthResponse result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("mock.jwt.token");
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    @DisplayName("login() — throws InvalidCredentialsException for wrong password")
    void login_wrongPassword_throwsException() {
        LoginRequest request = new LoginRequest("patient@example.com", "WrongPassword!");

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword!", "$2a$12$hashedpassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(jwtUtil, never()).generateToken(anyString());
    }

    @Test
    @DisplayName("login() — throws InvalidCredentialsException for unknown email")
    void login_unknownEmail_throwsException() {
        LoginRequest request = new LoginRequest("unknown@example.com", "Password1!");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    // ── loginWithGoogle() ─────────────────────────────────────────────────────

    @Test
    @DisplayName("loginWithGoogle() — returns AuthResponse for existing user")
    void loginWithGoogle_existingUser_returnsAuthResponse() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(sampleUser));
        when(jwtUtil.generateToken("patient@example.com")).thenReturn("mock.jwt.token");
        when(userAuthAdapter.toAuthResponse(sampleUser, "mock.jwt.token")).thenReturn(sampleAuthResponse);

        Optional<AuthResponse> result = authService.loginWithGoogle("patient@example.com", "Juan Dela Cruz");

        assertThat(result).isPresent();
        assertThat(result.get().getToken()).isEqualTo("mock.jwt.token");
    }

    @Test
    @DisplayName("loginWithGoogle() — returns empty Optional for new user")
    void loginWithGoogle_newUser_returnsEmpty() {
        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.empty());

        Optional<AuthResponse> result = authService.loginWithGoogle("newuser@example.com", "New User");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("loginWithGoogle() — throws IllegalArgumentException for null email")
    void loginWithGoogle_nullEmail_throwsException() {
        assertThatThrownBy(() -> authService.loginWithGoogle(null, "Name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email not provided");
    }

    // ── getCurrentUser() ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getCurrentUser() — returns UserDto for authenticated user")
    void getCurrentUser_success() {
        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(sampleUser));
        when(userAuthAdapter.toUserDto(sampleUser)).thenReturn(sampleUserDto);

        UserDto result = authService.getCurrentUser("patient@example.com");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("patient@example.com");
        assertThat(result.getRole()).isEqualTo("PATIENT");
    }

    @Test
    @DisplayName("getCurrentUser() — throws InvalidCredentialsException for unknown email")
    void getCurrentUser_unknownEmail_throwsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser("unknown@example.com"))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
