package edu.cit.ramirez.medigo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "doctor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false, unique = true)
    private User doctor;

    @Column(name = "specialization", nullable = false, length = 120)
    private String specialization;

    @Column(name = "clinic_name", nullable = false, length = 150)
    private String clinicName;

    @Column(name = "clinic_address", nullable = false, length = 255)
    private String clinicAddress;

    @Column(name = "verified", nullable = false)
    @Builder.Default
    private boolean verified = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
