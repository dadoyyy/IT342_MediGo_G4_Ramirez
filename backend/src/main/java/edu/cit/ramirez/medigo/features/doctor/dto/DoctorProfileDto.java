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
    private String medicalLicenseUrl;
    private String prcIdUrl;
    private String boardCertificateUrl;
    private String governmentIdUrl;
}
