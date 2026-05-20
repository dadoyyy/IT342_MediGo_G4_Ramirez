package com.example.mobile.model

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String,
    val role: String,
    val licenseNumber: String? = null
)

data class UserDto(
    val id: Long,
    val email: String,
    val fullName: String,
    val role: String,
    val verified: Boolean
)

data class AuthResponse(
    val token: String?,
    val user: UserDto
)

data class CompleteOAuth2Request(
    val pendingToken: String,
    val role: String
)
