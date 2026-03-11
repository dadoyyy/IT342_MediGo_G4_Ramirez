package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Application-level beans kept separate from SecurityConfig to avoid
 * circular dependencies (AuthService → PasswordEncoder → SecurityConfig cycle).
 */
@Configuration
@EnableScheduling
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt with cost factor 12 (minimum per design doc)
        return new BCryptPasswordEncoder(12);
    }
}
