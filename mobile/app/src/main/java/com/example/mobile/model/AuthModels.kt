package com.example.mobile.model

data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?,
    val timestamp: String?
)

data class ApiError(
    val code: String?,
    val message: String?,
    val details: Any?
)

data class RegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String,
    val role: String,
    val licenseNumber: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val tokenType: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    val email: String,
    val fullName: String,
    val role: String,
    val createdAt: String?
)
