package com.example.mobile.model

data class DoctorProfileDto(
    val doctorId: Long,
    val doctorName: String,
    val email: String,
    val specialization: String?,
    val clinicName: String?,
    val clinicAddress: String?,
    val verified: Boolean,
    val rejectionReason: String?,
    val bio: String?,
    val yearsOfExperience: Int?,
    val education: String?,
    val profilePictureUrl: String?,
    val medicalLicenseUrl: String?,
    val prcIdUrl: String?,
    val boardCertificateUrl: String?,
    val governmentIdUrl: String?,
    val patientCount: Long?,
    val consultationFee: Double?
) : java.io.Serializable

data class AppointmentDto(
    val id: Long,
    val patientId: Long,
    val patientName: String,
    val patientAge: Int?,
    val patientGender: String?,
    val doctorId: Long,
    val doctorName: String,
    val appointmentAt: String,
    val appointmentType: String,
    val notes: String?,
    val status: String,
    val createdAt: String
) : java.io.Serializable

data class DoctorProfileUpsertRequest(
    val specialization: String,
    val clinicName: String,
    val clinicAddress: String,
    val bio: String?,
    val yearsOfExperience: Int?,
    val education: String?,
    val consultationFee: Double?
)

data class AppointmentCreateRequest(
    val doctorId: Long,
    val appointmentAt: String,
    val appointmentType: String,
    val notes: String?
)

data class AppointmentStatusUpdateRequest(
    val status: String,
    val medicalNotes: String? = null,
    val followUpAt: String? = null,
    val documentUrls: List<String>? = null,
    val reason: String? = null
)
