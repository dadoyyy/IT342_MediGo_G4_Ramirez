package edu.cit.ramirez.medigo.features.doctor.entity;

import edu.cit.ramirez.medigo.features.user.entity.User;
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
    private boolean verified = false;

    // ── Document uploads ──────────────────────────────────────────────────────
    @Column(name = "profile_picture_url", length = 512)
    private String profilePictureUrl;

    @Column(name = "medical_license_url", length = 512)
    private String medicalLicenseUrl;

    @Column(name = "prc_id_url", length = 512)
    private String prcIdUrl;

    @Column(name = "board_certificate_url", length = 512)
    private String boardCertificateUrl;

    @Column(name = "government_id_url", length = 512)
    private String governmentIdUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
