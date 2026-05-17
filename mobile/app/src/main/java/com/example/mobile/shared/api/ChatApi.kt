package com.example.mobile.shared.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.ChatContactDto
import com.example.mobile.model.ChatMessageDto
import com.example.mobile.model.ChatSendRequest
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ChatApi {
    @GET("api/v1/chat/contacts")
    fun getContacts(
        @Query("q") query: String?
    ): Call<ApiEnvelope<List<ChatContactDto>>>

    @GET("api/v1/chat/conversations/{otherUserId}")
    fun getConversation(
        @Path("otherUserId") otherUserId: Long
    ): Call<ApiEnvelope<List<ChatMessageDto>>>

    @POST("api/v1/chat/messages")
    fun sendMessage(
        @Body request: ChatSendRequest
    ): Call<ApiEnvelope<ChatMessageDto>>
}
