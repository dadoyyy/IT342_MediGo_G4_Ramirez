package com.example.mobile.api

import okhttp3.ResponseBody
import org.json.JSONObject

object ApiErrorParser {
    fun parseMessage(errorBody: ResponseBody?, fallback: String): String {
        return try {
            val raw = errorBody?.string().orEmpty()
            if (raw.isBlank()) {
                fallback
            } else {
                val root = JSONObject(raw)
                val errorMessage = root.optJSONObject("error")?.optString("message")
                if (!errorMessage.isNullOrBlank()) {
                    errorMessage
                } else {
                    root.optString("message", fallback)
                }
            }
        } catch (_: Exception) {
            fallback
        }
    }
}
