package com.example.mobile.shared.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.DoctorProfileDto
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query

interface AppointmentApi {
    @GET("api/v1/doctors/me/profile")
    fun getMyDoctorProfile(): Call<ApiEnvelope<DoctorProfileDto>>

    @GET("api/v1/appointments")
    fun getMyAppointments(): Call<ApiEnvelope<List<AppointmentDto>>>

    @GET("api/v1/doctors/search")
    fun searchDoctors(@Query("q") query: String?): Call<ApiEnvelope<List<DoctorProfileDto>>>
}
