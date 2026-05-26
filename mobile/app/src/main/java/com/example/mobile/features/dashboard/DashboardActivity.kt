package com.example.mobile.features.dashboard

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.R
import com.example.mobile.databinding.ActivityDashboardBinding
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.features.patient.AppointmentsListActivity
import com.example.mobile.features.patient.ChatListActivity
import com.example.mobile.features.patient.PatientProfileActivity
import com.example.mobile.features.patient.SearchDoctorsActivity
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager

class DashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDashboardBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        // Ensure only patients can access this dashboard
        val role = sessionManager.role().orEmpty().uppercase()
        if (role != "PATIENT") {
            sessionManager.clearSession()
            TokenHolder.clearToken()
            Toast.makeText(this, "This app is for patients only.", Toast.LENGTH_LONG).show()
            redirectToLogin()
            return
        }

        TokenHolder.setToken(sessionManager.token().orEmpty())

        // Animate content
        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        loadDashboardData()
        setupClickListeners()
    }

    override fun onResume() {
        super.onResume()
        if (sessionManager.isLoggedIn()) {
            loadDashboardData()
        }
    }

    private fun loadDashboardData() {
        val fullName = sessionManager.fullName().orEmpty()
        val email = sessionManager.email().orEmpty()
        val initials = fullName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "ME" }

        binding.tvWelcomeGreeting.text = "Welcome back,"
        binding.tvUserDisplayName.text = fullName
        binding.tvUserEmailFooter.text = email
        binding.btnOpenProfile.text = initials
    }

    private fun setupClickListeners() {
        binding.cardBookConsultation.setOnClickListener {
            startActivity(Intent(this, SearchDoctorsActivity::class.java))
        }

        binding.cardMySchedule.setOnClickListener {
            startActivity(Intent(this, AppointmentsListActivity::class.java))
        }

        binding.cardPatientChats.setOnClickListener {
            startActivity(Intent(this, ChatListActivity::class.java))
        }

        binding.btnOpenProfile.setOnClickListener {
            startActivity(Intent(this, PatientProfileActivity::class.java))
        }

        binding.btnNotifications.setOnClickListener {
            startActivity(Intent(this, PatientProfileActivity::class.java).apply {
                putExtra(PatientProfileActivity.EXTRA_OPEN_NOTIFICATIONS, true)
            })
        }

        binding.btnHeaderLogout.setOnClickListener {
            sessionManager.clearSession()
            TokenHolder.clearToken()
            Toast.makeText(this, "Signed out successfully", Toast.LENGTH_SHORT).show()
            redirectToLogin()
        }
    }

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
