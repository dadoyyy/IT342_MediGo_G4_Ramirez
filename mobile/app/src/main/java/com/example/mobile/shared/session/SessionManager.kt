package com.example.mobile.shared.session

import android.content.Context

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun saveSession(userId: Long, token: String, email: String, fullName: String, role: String) {
        prefs.edit()
            .putLong(KEY_USER_ID, userId)
            .putString(KEY_TOKEN, token)
            .putString(KEY_EMAIL, email)
            .putString(KEY_FULL_NAME, fullName)
            .putString(KEY_ROLE, role)
            .apply()
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean = !prefs.getString(KEY_TOKEN, null).isNullOrBlank()

    fun userId(): Long = prefs.getLong(KEY_USER_ID, 0L)
    fun token(): String? = prefs.getString(KEY_TOKEN, null)
    fun email(): String? = prefs.getString(KEY_EMAIL, null)
    fun fullName(): String? = prefs.getString(KEY_FULL_NAME, null)
    fun role(): String? = prefs.getString(KEY_ROLE, null)

    companion object {
        private const val PREF_NAME = "medigo_session"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_TOKEN = "token"
        private const val KEY_EMAIL = "email"
        private const val KEY_FULL_NAME = "full_name"
        private const val KEY_ROLE = "role"
    }
}
