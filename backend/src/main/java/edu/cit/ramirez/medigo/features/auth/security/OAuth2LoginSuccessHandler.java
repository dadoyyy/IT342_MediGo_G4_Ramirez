package edu.cit.ramirez.medigo.features.auth.security;

import edu.cit.ramirez.medigo.features.auth.dto.AuthResponse;
import edu.cit.ramirez.medigo.features.auth.AuthService;
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

    @Value("${app.oauth.mobile-callback-uri:medigo-app://auth/callback}")
    private String mobileCallbackUri;

    public OAuth2LoginSuccessHandler(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OAuth2User oAuth2User)) {
            String errorRedirect = buildCallbackUrl(request, "error", "oauth2_principal_invalid");
            response.sendRedirect(errorRedirect);
            return;
        }

        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        try {
            Optional<AuthResponse> existing = authService.loginWithGoogle(email, name);

            if (existing.isPresent()) {
                // Existing user — issue real JWT and go straight to dashboard
                String encodedToken = URLEncoder.encode(existing.get().getToken(), StandardCharsets.UTF_8);
                String callbackUrl = buildCallbackUrl(request, "token", encodedToken);
                response.sendRedirect(callbackUrl);
            } else {
                // New user — issue pending token so frontend can ask for role
                String pendingToken = jwtUtil.generatePendingToken(
                        email, name != null ? name : email);
                String encodedPending = URLEncoder.encode(pendingToken, StandardCharsets.UTF_8);
                String callbackUrl = buildCallbackUrl(request, "pending", encodedPending);
                response.sendRedirect(callbackUrl);
            }
        } catch (IllegalArgumentException ex) {
            String encodedMessage = URLEncoder.encode(ex.getMessage(), StandardCharsets.UTF_8);
            String errorRedirect = buildCallbackUrl(request, "error", encodedMessage);
            response.sendRedirect(errorRedirect);
        }
    }

    private String buildCallbackUrl(HttpServletRequest request, String paramName, String paramValue) {
        String callbackBase = resolveCallbackBase(request);
        String separator = callbackBase.contains("?") ? "&" : "?";
        return callbackBase + separator + paramName + "=" + paramValue;
    }

    private String resolveCallbackBase(HttpServletRequest request) {
        String requestedRedirectUri = request.getParameter("redirect_uri");
        String webCallbackUri = frontendUrl + "/auth/callback";

        if (requestedRedirectUri == null || requestedRedirectUri.isBlank()) {
            return webCallbackUri;
        }

        if (requestedRedirectUri.equals(webCallbackUri) || requestedRedirectUri.equals(mobileCallbackUri)) {
            return requestedRedirectUri;
        }

        return webCallbackUri;
    }
}
