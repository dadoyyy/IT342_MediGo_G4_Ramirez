package edu.cit.ramirez.medigo.patterns.strategy;

import org.springframework.stereotype.Component;

@Component
public class PatientRoleStrategy implements UserRoleStrategy {

    @Override
    public boolean supports(String rawRole) {
        return rawRole != null && "PATIENT".equalsIgnoreCase(rawRole.trim());
    }

    @Override
    public String normalizedRole() {
        return "PATIENT";
    }
}
