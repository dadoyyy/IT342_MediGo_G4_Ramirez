package com.example.mobile.features.patient

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.databinding.ActivityPatientProfileBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.ChatContactDto
import com.example.mobile.model.UserDto
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class PatientProfileActivity : AppCompatActivity() {
    private lateinit var binding: ActivityPatientProfileBinding
    private lateinit var sessionManager: SessionManager

    private var unreadMessageCount: Long = 0
    private var activeAppointmentCount: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPatientProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        binding.root.startAnimation(android.view.animation.AnimationUtils.loadAnimation(this, com.example.mobile.R.anim.fade_in_up))

        setupActions()
        loadProfile()
        loadNotificationCounts()

        if (intent.getBooleanExtra(EXTRA_OPEN_NOTIFICATIONS, false)) {
            binding.tvNotificationSummary.post {
                binding.tvNotificationSummary.requestFocus()
                Toast.makeText(this, "Notification center opened.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        loadNotificationCounts()
    }

    private fun setupActions() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnRefreshNotifications.setOnClickListener {
            loadNotificationCounts()
            Toast.makeText(this, "Refreshing your notifications...", Toast.LENGTH_SHORT).show()
        }

        binding.btnNotificationAppointments.setOnClickListener {
            startActivity(Intent(this, AppointmentsListActivity::class.java))
        }

        binding.btnNotificationMessages.setOnClickListener {
            startActivity(Intent(this, ChatListActivity::class.java))
        }

        binding.btnOpenAppointments.setOnClickListener {
            startActivity(Intent(this, AppointmentsListActivity::class.java))
        }

        binding.btnOpenMessages.setOnClickListener {
            startActivity(Intent(this, ChatListActivity::class.java))
        }

        binding.btnSignOut.setOnClickListener {
            showSignOutDialog()
        }
    }

    private fun loadProfile() {
        val fullName = sessionManager.fullName().orEmpty()
        val email = sessionManager.email().orEmpty()
        val initials = fullName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "PT" }

        binding.tvFullName.text = fullName.ifBlank { "Patient" }
        binding.tvEmail.text = email.ifBlank { "patient@medigo.app" }
        binding.tvAvatar.text = initials
    }

    private fun loadNotificationCounts() {
        binding.tvNotificationSummary.text = "Loading your latest updates..."

        ApiClient.chatApi.getContacts(null).enqueue(object : Callback<ApiEnvelope<List<ChatContactDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<ChatContactDto>>>,
                response: Response<ApiEnvelope<List<ChatContactDto>>>
            ) {
                val contacts = response.body()?.data ?: emptyList()
                unreadMessageCount = contacts.sumOf { it.unread }
                updateNotificationSummary()
            }

            override fun onFailure(call: Call<ApiEnvelope<List<ChatContactDto>>>, t: Throwable) {
                unreadMessageCount = 0
                updateNotificationSummary()
            }
        })

        ApiClient.appointmentApi.getMyAppointments().enqueue(object : Callback<ApiEnvelope<List<AppointmentDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<AppointmentDto>>>,
                response: Response<ApiEnvelope<List<AppointmentDto>>>
            ) {
                val appointments = response.body()?.data ?: emptyList()
                activeAppointmentCount = appointments.count {
                    val status = it.status.uppercase()
                    status != "CANCELLED" && status != "REJECTED" && status != "COMPLETED"
                }.toLong()
                updateNotificationSummary()
            }

            override fun onFailure(call: Call<ApiEnvelope<List<AppointmentDto>>>, t: Throwable) {
                activeAppointmentCount = 0
                updateNotificationSummary()
            }
        })
    }

    private fun updateNotificationSummary() {
        binding.tvUnreadMessageCount.text = unreadMessageCount.toString()
        binding.tvAppointmentCount.text = activeAppointmentCount.toString()
        binding.tvNotificationSummary.text = when {
            unreadMessageCount > 0 && activeAppointmentCount > 0 -> "You have $unreadMessageCount unread messages and $activeAppointmentCount active appointments."
            unreadMessageCount > 0 -> "You have $unreadMessageCount unread messages waiting in your inbox."
            activeAppointmentCount > 0 -> "You have $activeAppointmentCount active appointments coming up."
            else -> "No urgent notifications right now. Your profile is up to date."
        }
    }

    private fun showSignOutDialog() {
        AlertDialog.Builder(this)
            .setTitle("End your session?")
            .setMessage("You will return to the login screen and can sign in again anytime to continue your care journey.")
            .setNegativeButton("Stay") { dialog, _ -> dialog.dismiss() }
            .setPositiveButton("Sign Out") { _, _ -> performSignOut() }
            .show()
    }

    private fun performSignOut() {
        sessionManager.clearSession()
        TokenHolder.clearToken()
        Toast.makeText(this, "You have been signed out successfully.", Toast.LENGTH_SHORT).show()
        redirectToLogin()
    }

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    companion object {
        const val EXTRA_OPEN_NOTIFICATIONS = "open_notifications"
    }
}