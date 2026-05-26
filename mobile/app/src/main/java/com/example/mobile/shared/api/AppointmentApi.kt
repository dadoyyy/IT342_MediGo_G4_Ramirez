package com.example.mobile.shared.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentCreateRequest
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.AppointmentStatusUpdateRequest
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.model.DoctorProfileUpsertRequest
import okhttp3.MultipartBody
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface AppointmentApi {
    @GET("api/v1/doctors/me/profile")
    fun getMyDoctorProfile(): Call<ApiEnvelope<DoctorProfileDto>>

    @PUT("api/v1/doctors/me/profile")
    fun upsertDoctorProfile(@Body request: DoctorProfileUpsertRequest): Call<ApiEnvelope<DoctorProfileDto>>

    @POST("api/v1/appointments")
    fun createAppointment(@Body request: AppointmentCreateRequest): Call<ApiEnvelope<AppointmentDto>>

    @GET("api/v1/appointments")
    fun getMyAppointments(): Call<ApiEnvelope<List<AppointmentDto>>>

    @Multipart
    @POST("api/v1/appointments/docs/upload")
    fun uploadConsultationDoc(
        @Part file: MultipartBody.Part
    ): Call<ApiEnvelope<String>>

    @PUT("api/v1/appointments/{id}/status")
    fun updateAppointmentStatus(
        @Path("id") id: Long,
        @Body request: AppointmentStatusUpdateRequest
    ): Call<ApiEnvelope<AppointmentDto>>

    @PUT("api/v1/appointments/{id}/cancel")
    fun cancelAppointment(@Path("id") id: Long): Call<ApiEnvelope<AppointmentDto>>

    @GET("api/v1/doctors/search")
    fun searchDoctors(@Query("q") query: String?): Call<ApiEnvelope<List<DoctorProfileDto>>>
}
