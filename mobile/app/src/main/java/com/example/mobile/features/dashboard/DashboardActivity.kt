package com.example.mobile.features.dashboard

import android.content.Intent
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.mobile.R
import com.example.mobile.databinding.ActivityDashboardBinding
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.features.doctor.DoctorProfileActivity
import com.example.mobile.features.patient.AppointmentsListActivity
import com.example.mobile.features.patient.ChatListActivity
import com.example.mobile.features.patient.SearchDoctorsActivity
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

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

        // Set up active token in global holder just in case
        TokenHolder.setToken(sessionManager.token().orEmpty())

        setupToolbar()
        setupClickListeners()
    }

    override fun onResume() {
        super.onResume()
        if (sessionManager.isLoggedIn()) {
            loadDashboardData()
        }
    }

    private fun setupToolbar() {
        binding.btnHeaderLogout.setOnClickListener {
            sessionManager.clearSession()
            TokenHolder.clearToken()
            Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show()
            redirectToLogin()
        }
    }

    private fun loadDashboardData() {
        val fullName = sessionManager.fullName().orEmpty()
        val email = sessionManager.email().orEmpty()
        val role = sessionManager.role().orEmpty().uppercase()

        binding.tvUserDisplayName.text = fullName
        binding.tvUserEmailFooter.text = email
        binding.tvRoleBadge.text = role

        if (role == "DOCTOR") {
            // Configure Doctor specific visual layout
            binding.tvWelcomeGreeting.text = "Good day, Practitioner"
            binding.tvRoleBadge.setTextColor(ContextCompat.getColor(this, R.color.primary_accent))
            binding.tvRoleBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_status_box_error)
            binding.tvRoleBadge.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(this, R.color.primary_light))
            
            binding.layoutDoctorDashboard.visibility = View.VISIBLE
            binding.layoutPatientDashboard.visibility = View.GONE
            
            // Query specialization and credentials status from DB
            fetchDoctorPracticeStatus()
        } else {
            // Configure Patient specific visual layout
            binding.tvWelcomeGreeting.text = "Welcome back,"
            binding.tvRoleBadge.setTextColor(ContextCompat.getColor(this, R.color.success))
            binding.tvRoleBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_status_box_success)
            binding.tvRoleBadge.backgroundTintList = null // Use default success light green
            
            binding.layoutPatientDashboard.visibility = View.VISIBLE
            binding.layoutDoctorDashboard.visibility = View.GONE
            binding.cardSpecializationStatus.visibility = View.GONE
        }
    }

    private fun fetchDoctorPracticeStatus() {
        binding.cardSpecializationStatus.visibility = View.VISIBLE
        binding.tvStatusTitle.text = "Practice Verification"
        binding.tvStatusDetails.text = "Checking credentials on server..."
        binding.cardSpecializationStatus.background = ContextCompat.getDrawable(this, R.drawable.bg_selectable_card)
        binding.btnStatusAction.visibility = View.GONE

        ApiClient.appointmentApi.getMyDoctorProfile().enqueue(object : Callback<ApiEnvelope<DoctorProfileDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<DoctorProfileDto>>,
                response: Response<ApiEnvelope<DoctorProfileDto>>
            ) {
                if (isFinishing) return

                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val profile = body.data
                    if (profile.specialization.isNullOrBlank()) {
                        showProfileRequiredState()
                    } else if (!profile.verified) {
                        showProfilePendingState(profile.specialization)
                    } else {
                        showProfileVerifiedState(profile.specialization)
                    }
                } else if (response.code() == 404) {
                    showProfileRequiredState()
                } else {
                    binding.tvStatusDetails.text = "Unable to load credentials. Pull down to retry."
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<DoctorProfileDto>>, t: Throwable) {
                if (isFinishing) return
                binding.tvStatusDetails.text = "Network offline. Check server connection."
            }
        })
    }

    private fun showProfileRequiredState() {
        binding.cardSpecializationStatus.background = ContextCompat.getDrawable(this, R.drawable.bg_status_box_error)
        binding.tvStatusTitle.text = "Specialization Profile Required"
        binding.tvStatusTitle.setTextColor(ContextCompat.getColor(this, R.color.error))
        binding.tvStatusDetails.text = "You must specify your specialization and upload documents before consulting patients."
        binding.btnStatusAction.text = "Configure Practice Details"
        binding.btnStatusAction.visibility = View.VISIBLE
    }

    private fun showProfilePendingState(specialization: String) {
        binding.cardSpecializationStatus.background = ContextCompat.getDrawable(this, R.drawable.bg_status_box_error)
        binding.cardSpecializationStatus.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(this, R.color.warning_bg))
        binding.tvStatusTitle.text = "Specialization Pending Review"
        binding.tvStatusTitle.setTextColor(ContextCompat.getColor(this, R.color.warning))
        binding.tvStatusDetails.text = "Your request for [$specialization] is currently under review by the administrative team."
        binding.btnStatusAction.visibility = View.GONE
    }

    private fun showProfileVerifiedState(specialization: String) {
        binding.cardSpecializationStatus.background = ContextCompat.getDrawable(this, R.drawable.bg_status_box_success)
        binding.tvStatusTitle.text = "Verified Specialist"
        binding.tvStatusTitle.setTextColor(ContextCompat.getColor(this, R.color.success))
        binding.tvStatusDetails.text = "You are active and fully authorized to consult patients in [$specialization]."
        binding.btnStatusAction.visibility = View.GONE
    }

    private fun setupClickListeners() {
        // Patient Actions
        binding.cardBookConsultation.setOnClickListener {
            startActivity(Intent(this, SearchDoctorsActivity::class.java))
        }
        binding.cardMySchedule.setOnClickListener {
            startActivity(Intent(this, AppointmentsListActivity::class.java))
        }
        binding.cardPatientChats.setOnClickListener {
            startActivity(Intent(this, ChatListActivity::class.java))
        }

        // Doctor Actions
        binding.cardDoctorProfile.setOnClickListener {
            startActivity(Intent(this, DoctorProfileActivity::class.java))
        }
        binding.cardConsultationQueue.setOnClickListener {
            startActivity(Intent(this, AppointmentsListActivity::class.java))
        }
        binding.cardDoctorChats.setOnClickListener {
            startActivity(Intent(this, ChatListActivity::class.java))
        }

        binding.btnStatusAction.setOnClickListener {
            startActivity(Intent(this, DoctorProfileActivity::class.java))
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
