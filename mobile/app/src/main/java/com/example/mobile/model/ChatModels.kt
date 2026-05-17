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

data class ChatContactDto(
    val id: Long,
    val userId: Long,
    val fullName: String,
    val firstName: String?,
    val lastName: String?,
    val email: String,
    val role: String,
    val profilePictureUrl: String?,
    val lastMsg: String?,
    val lastMsgAt: String?,
    val unread: Long
)

data class ChatSendRequest(
    val receiverId: Long,
    val appointmentId: Long? = null,
    val content: String
)
