package edu.cit.ramirez.medigo.patterns.strategy;

import org.springframework.stereotype.Component;

@Component
public class DoctorRoleStrategy implements UserRoleStrategy {

    @Override
    public boolean supports(String rawRole) {
        return rawRole != null && "DOCTOR".equalsIgnoreCase(rawRole.trim());
    }

    @Override
    public String normalizedRole() {
        return "DOCTOR";
    }
}
