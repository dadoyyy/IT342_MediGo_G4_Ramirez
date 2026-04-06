package edu.cit.ramirez.medigo.patterns.strategy;

/**
 * Strategy for validating and normalizing a role value.
 */
public interface UserRoleStrategy {

    boolean supports(String rawRole);

    String normalizedRole();
}
