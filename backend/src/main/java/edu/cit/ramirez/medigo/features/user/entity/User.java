package edu.cit.ramirez.medigo.features.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Maps to the `users` table in Supabase PostgreSQL.
 * Schema: id (bigserial), email (varchar 255), password_hash (varchar 255),
 *         full_name (varchar 100), role (varchar 10), created_at (timestamp).
 */
@Entity
@Table(name = "users",
        uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /** Allowed values: PATIENT | DOCTOR */
    @Column(name = "role", nullable = false, length = 10)
    private String role;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "verified", nullable = false)
    private boolean verified = false;

    @Column(name = "verification_token", length = 100)
    private String verificationToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
