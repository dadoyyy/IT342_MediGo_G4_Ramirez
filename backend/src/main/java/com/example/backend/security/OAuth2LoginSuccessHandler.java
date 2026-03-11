package com.example.backend.security;

import com.example.backend.dto.AuthResponse;
import com.example.backend.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Handles successful OAuth2 login by issuing a JWT (existing users)
 * or a short-lived pending token (new users who must choose their role).
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OAuth2User oAuth2User)) {
            response.sendRedirect(frontendUrl + "/auth/callback?error=oauth2_principal_invalid");
            return;
        }

        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        try {
            Optional<AuthResponse> existing = authService.loginWithGoogle(email, name);

            if (existing.isPresent()) {
                // Existing user — issue real JWT and go straight to dashboard
                String encodedToken = URLEncoder.encode(existing.get().getToken(), StandardCharsets.UTF_8);
                response.sendRedirect(frontendUrl + "/auth/callback?token=" + encodedToken);
            } else {
                // New user — issue pending token so frontend can ask for role
                String pendingToken = jwtUtil.generatePendingToken(
                        email, name != null ? name : email);
                String encodedPending = URLEncoder.encode(pendingToken, StandardCharsets.UTF_8);
                response.sendRedirect(frontendUrl + "/auth/callback?pending=" + encodedPending);
            }
        } catch (IllegalArgumentException ex) {
            String encodedMessage = URLEncoder.encode(ex.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/auth/callback?error=" + encodedMessage);
        }
    }
}
