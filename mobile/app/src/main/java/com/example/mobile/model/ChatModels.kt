package com.example.mobile.model

data class ChatMessageDto(
    val id: Long,
    val senderId: Long,
    val senderName: String,
    val receiverId: Long,
    val receiverName: String,
    val appointmentId: Long?,
    val content: String,
    val sentAt: String
)
