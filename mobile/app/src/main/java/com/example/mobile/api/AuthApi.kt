package com.example.mobile.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.LoginRequest
import com.example.mobile.model.RegisterRequest
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("api/v1/auth/register")
    fun register(@Body request: RegisterRequest): Call<ApiEnvelope<AuthResponse>>

    @POST("api/v1/auth/login")
    fun login(@Body request: LoginRequest): Call<ApiEnvelope<AuthResponse>>
}
