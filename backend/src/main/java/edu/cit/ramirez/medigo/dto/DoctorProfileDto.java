package edu.cit.ramirez.medigo.dto;

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
}
