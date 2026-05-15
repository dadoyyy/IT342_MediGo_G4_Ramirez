package edu.cit.ramirez.medigo.features.doctor.entity;

import edu.cit.ramirez.medigo.features.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "doctor_specialization_change_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorSpecializationChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(name = "current_specialization", nullable = false, length = 500)
    private String currentSpecialization;

    @Column(name = "requested_specialization", nullable = false, length = 500)
    private String requestedSpecialization;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DoctorSpecializationChangeStatus status = DoctorSpecializationChangeStatus.PENDING;

    @Column(name = "admin_note", length = 1000)
    private String adminNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "decided_at")
    private Instant decidedAt;
}
