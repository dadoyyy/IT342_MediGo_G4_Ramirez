package edu.cit.ramirez.medigo.patterns.observer;

public record AuthEvent(
        String email,
        String role,
        AuthEventType type
) {
}
