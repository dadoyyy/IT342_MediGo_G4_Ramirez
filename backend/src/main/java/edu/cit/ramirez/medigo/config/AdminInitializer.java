package edu.cit.ramirez.medigo.config;

import edu.cit.ramirez.medigo.features.user.UserRepository;
import edu.cit.ramirez.medigo.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures a permanent admin account exists every time the application starts.
 * If the admin email is already in the database, this is a no-op.
 *
 * Credentials (change before deploying to production):
 *   Email    : admin@medigo.com
 *   Password : Admin@1234
 */
@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL    = "admin@medigo.com";
    private static final String ADMIN_PASSWORD = "Ru09568223767-";
    private static final String ADMIN_NAME     = "MediGo Admin";

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
            existing -> {
                // Always re-hash and save the current ADMIN_PASSWORD so a
                // password change in code takes effect on the next restart.
                existing.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                userRepository.save(existing);
                System.out.println("✅ Admin password synced: " + ADMIN_EMAIL);
            },
            () -> {
                User admin = User.builder()
                        .email(ADMIN_EMAIL)
                        .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                        .fullName(ADMIN_NAME)
                        .role("ADMIN")
                        .build();
                userRepository.save(admin);
                System.out.println("✅ Admin account created: " + ADMIN_EMAIL);
            }
        );
    }
}
