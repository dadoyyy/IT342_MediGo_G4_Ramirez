package edu.cit.ramirez.medigo.features.doctor.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorProfileDto {

    private Long doctorId;
    private String doctorName;
    private String email;
    private String specialization;
    private String clinicName;
    private String clinicAddress;
    private boolean verified;
    private String rejectionReason;
    private String bio;
    private Integer yearsOfExperience;
    private String education;
    private String profilePictureUrl;
    private String medicalLicenseUrl;
    private String prcIdUrl;
    private String boardCertificateUrl;
    private String governmentIdUrl;
}
