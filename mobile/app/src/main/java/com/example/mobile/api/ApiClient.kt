package com.example.mobile.api

import com.example.mobile.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.Interceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Authorization interceptor - adds JWT to all requests
    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        
        // Skip auth header for public endpoints (register/login)
        val isPublicAuth = originalRequest.url.encodedPath?.contains("/auth/register") == true ||
                         originalRequest.url.encodedPath?.contains("/auth/login") == true
        
        if (isPublicAuth) {
            return@Interceptor chain.proceed(originalRequest)
        }
        
        // Get token from session
        val token = TokenHolder.getToken()
        
        val newRequest = if (!token.isNullOrBlank()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        chain.proceed(newRequest)
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor(authInterceptor)
        .build()

    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
}

// Token holder to access JWT from anywhere
object TokenHolder {
    private var token: String? = null
    
    fun setToken(newToken: String) {
        this.token = newToken
    }
    
    fun getToken(): String? = token
    
    fun clearToken() {
        this.token = null
    }
}
