package edu.cit.ramirez.medigo.patterns.strategy;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Singleton strategy resolver for role handling.
 */
@Component
@Scope("singleton")
public class UserRoleStrategyResolver {

    private final List<UserRoleStrategy> strategies;

    public UserRoleStrategyResolver(List<UserRoleStrategy> strategies) {
        this.strategies = strategies;
    }

    public String resolveNormalizedRole(String rawRole) {
        return strategies.stream()
                .filter(strategy -> strategy.supports(rawRole))
                .findFirst()
                .map(UserRoleStrategy::normalizedRole)
                .orElseThrow(() -> new IllegalArgumentException("Role must be PATIENT or DOCTOR."));
    }
}
