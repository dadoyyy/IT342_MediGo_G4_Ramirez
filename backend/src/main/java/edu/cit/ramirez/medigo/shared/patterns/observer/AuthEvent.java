package edu.cit.ramirez.medigo.shared.patterns.observer;

public record AuthEvent(
        String email,
        String role,
        AuthEventType type) {
}
