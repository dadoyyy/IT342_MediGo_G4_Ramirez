package com.example.mobile.model

data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null
)

data class ApiError(
    val status: Int,
    val message: String,
    val details: List<String>? = null
)
