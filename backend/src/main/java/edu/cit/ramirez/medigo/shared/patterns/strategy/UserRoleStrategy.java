package edu.cit.ramirez.medigo.shared.patterns.strategy;

/**
 * Strategy for validating and normalizing a role value.
 */
public interface UserRoleStrategy {

    boolean supports(String rawRole);

    String normalizedRole();
}
