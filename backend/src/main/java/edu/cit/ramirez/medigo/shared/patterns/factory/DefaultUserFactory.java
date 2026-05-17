package edu.cit.ramirez.medigo.shared.patterns.factory;

import edu.cit.ramirez.medigo.features.auth.dto.RegisterRequest;
import edu.cit.ramirez.medigo.features.user.entity.User;
import edu.cit.ramirez.medigo.shared.patterns.strategy.UserRoleStrategyResolver;
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
                .birthDate(request.getBirthDate() != null ? java.time.LocalDate.parse(request.getBirthDate()) : null)
                .gender(request.getGender())
                .contactNumber(request.getContactNumber())
                .address(request.getAddress())
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
