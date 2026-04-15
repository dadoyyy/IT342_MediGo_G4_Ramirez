package com.example.mobile.session

import android.content.Context

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun saveSession(token: String, email: String, fullName: String, role: String) {
        prefs.edit()
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

    fun token(): String? = prefs.getString(KEY_TOKEN, null)
    fun email(): String? = prefs.getString(KEY_EMAIL, null)
    fun fullName(): String? = prefs.getString(KEY_FULL_NAME, null)
    fun role(): String? = prefs.getString(KEY_ROLE, null)

    companion object {
        private const val PREF_NAME = "medigo_session"
        private const val KEY_TOKEN = "token"
        private const val KEY_EMAIL = "email"
        private const val KEY_FULL_NAME = "full_name"
        private const val KEY_ROLE = "role"
    }
}
