package com.example.mobile.shared.api

import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.ChatMessageDto
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Path

interface ChatApi {
    @GET("api/v1/chat/conversations/{otherUserId}")
    fun getConversation(
        @Path("otherUserId") otherUserId: Long
    ): Call<ApiEnvelope<List<ChatMessageDto>>>
}
