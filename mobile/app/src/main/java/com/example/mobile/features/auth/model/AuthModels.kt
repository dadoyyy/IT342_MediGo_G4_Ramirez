package com.example.mobile.features.auth.model

// Re-export from shared model for feature-local access
typealias AuthApiEnvelope<T> = com.example.mobile.model.ApiEnvelope<T>
typealias AuthApiError = com.example.mobile.model.ApiError
typealias AuthRegisterRequest = com.example.mobile.model.RegisterRequest
typealias AuthLoginRequest = com.example.mobile.model.LoginRequest
typealias AuthResponse = com.example.mobile.model.AuthResponse
typealias AuthUserDto = com.example.mobile.model.UserDto
