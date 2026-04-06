package edu.cit.ramirez.medigo.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Stateless JWT utility — generates and validates Bearer tokens.
 * Algorithm: HS256 | Secret: 256-bit hex string from application.properties.
 */
@Component
@Slf4j
public class JwtUtil {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(secret.getBytes())));
        this.expirationMs = expirationMs;
    }

    // ── Token Generation ─────────────────────────────────────────────────────

    public String generateToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Short-lived (10 min) token issued to first-time Google users
     * who must still choose their role before a real account is created.
     */
    public String generatePendingToken(String email, String name) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 10 * 60 * 1000L);
        return Jwts.builder()
                .subject(email)
                .claim("name", name)
                .claim("type", "PENDING_OAUTH2")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public boolean isPendingToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return "PENDING_OAUTH2".equals(claims.get("type", String.class))
                    && !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractNameFromPending(String token) {
        return parseClaims(token).get("name", String.class);
    }

    // ── Token Parsing ────────────────────────────────────────────────────────

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equals(userDetails.getUsername()) && !isExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public Date extractExpiry(String token) {
        return parseClaims(token).getExpiration();
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private boolean isExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
