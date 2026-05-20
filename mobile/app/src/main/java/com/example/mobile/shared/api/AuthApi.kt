package com.example.mobile.shared.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.LoginRequest
import com.example.mobile.model.RegisterRequest
import com.example.mobile.model.UserDto
import com.example.mobile.model.CompleteOAuth2Request
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("api/v1/auth/register")
    fun register(@Body request: RegisterRequest): Call<ApiEnvelope<AuthResponse>>

    @POST("api/v1/auth/login")
    fun login(@Body request: LoginRequest): Call<ApiEnvelope<AuthResponse>>

    @retrofit2.http.GET("api/v1/auth/me")
    fun getProfile(): Call<ApiEnvelope<UserDto>>

    @POST("api/v1/auth/oauth2/complete")
    fun completeOAuth2(@Body request: CompleteOAuth2Request): Call<ApiEnvelope<AuthResponse>>
}
