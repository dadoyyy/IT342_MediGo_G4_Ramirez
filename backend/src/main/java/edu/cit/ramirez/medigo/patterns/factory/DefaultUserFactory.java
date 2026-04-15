package edu.cit.ramirez.medigo.patterns.factory;

import edu.cit.ramirez.medigo.dto.RegisterRequest;
import edu.cit.ramirez.medigo.entity.User;
import edu.cit.ramirez.medigo.patterns.strategy.UserRoleStrategyResolver;
import org.springframework.stereotype.Component;

@Component
public class DefaultUserFactory implements UserFactory {

    private final UserRoleStrategyResolver roleStrategyResolver;

    public DefaultUserFactory(UserRoleStrategyResolver roleStrategyResolver) {
        this.roleStrategyResolver = roleStrategyResolver;
    }

    @Override
    public User createLocalUser(RegisterRequest request, String encodedPassword) {
        String fullName = (request.getFirstname() + " " + request.getLastname()).trim();
        String normalizedRole = roleStrategyResolver.resolveNormalizedRole(request.getRole());

        return User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(encodedPassword)
                .fullName(fullName)
                .role(normalizedRole)
                .build();
    }

    @Override
    public User createGoogleUser(String email, String name, String role) {
        String normalizedRole = roleStrategyResolver.resolveNormalizedRole(role);

        return User.builder()
                .email(email.toLowerCase())
                .passwordHash("")
                .fullName(name != null && !name.isBlank() ? name : email)
                .role(normalizedRole)
                .build();
    }
}
