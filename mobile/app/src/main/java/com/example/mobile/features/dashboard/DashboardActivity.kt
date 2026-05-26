package com.example.mobile.features.dashboard

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mobile.BuildConfig
import com.example.mobile.R
import com.example.mobile.databinding.ActivityDashboardBinding
import com.example.mobile.databinding.DialogNotificationsModalBinding
import com.example.mobile.databinding.DialogProfileModalBinding
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.features.patient.AppointmentsListActivity
import com.example.mobile.features.patient.ChatListActivity
import com.example.mobile.features.patient.DoctorsAdapter
import com.example.mobile.features.patient.DoctorDetailActivity
import com.example.mobile.features.patient.PatientProfileActivity
import com.example.mobile.features.patient.SearchDoctorsActivity
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.ChatContactDto
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.constants.MedicalSpecializations
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.bumptech.glide.Glide
import com.example.mobile.databinding.DialogDoctorDetailBinding
import com.example.mobile.features.patient.BookAppointmentActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDashboardBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var doctorsAdapter: DoctorsAdapter

    private var allDoctors: List<DoctorProfileDto> = emptyList()
    private var selectedSpecialty: String = "All"
    private var searchQuery: String = ""
    private var consultationType: String = "ALL" // "ALL", "ONLINE", "IN_PERSON"

    // Notifications state
    private var unreadMessageCount: Long = 0
    private var activeAppointmentCount: Long = 0

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

        setupDoctorList()
        setupSpecializationChips()
        setupSearchFilters()

        loadDashboardData()
        setupClickListeners()
        updateSegmentedFilterUI()
        attachPatientBottomNav(PatientBottomTab.HOME)
        loadDoctors()
        loadNotificationCounts()
    }

    override fun onResume() {
        super.onResume()
        if (sessionManager.isLoggedIn()) {
            loadDashboardData()
            loadNotificationCounts()
        }
    }

    private fun loadDashboardData() {
        val fullName = sessionManager.fullName().orEmpty()
        val initials = fullName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "ME" }

        binding.tvWelcomeGreeting.text = "Welcome back,"
        binding.tvUserDisplayName.text = fullName
        binding.btnOpenProfile.text = initials
    }

    private fun loadNotificationCounts() {
        ApiClient.chatApi.getContacts(null).enqueue(object : Callback<ApiEnvelope<List<ChatContactDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<ChatContactDto>>>,
                response: Response<ApiEnvelope<List<ChatContactDto>>>
            ) {
                val contacts = response.body()?.data ?: emptyList()
                unreadMessageCount = contacts.sumOf { it.unread }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<ChatContactDto>>>, t: Throwable) {
                unreadMessageCount = 0
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
            }

            override fun onFailure(call: Call<ApiEnvelope<List<AppointmentDto>>>, t: Throwable) {
                activeAppointmentCount = 0
            }
        })
    }

    private fun setupClickListeners() {
        binding.btnOpenProfile.setOnClickListener {
            showProfileModal()
        }

        binding.btnNotifications.setOnClickListener {
            showNotificationsModal()
        }

        binding.btnFilterAll.setOnClickListener {
            consultationType = "ALL"
            updateSegmentedFilterUI()
            renderDoctors()
        }

        binding.btnFilterOnline.setOnClickListener {
            consultationType = "ONLINE"
            updateSegmentedFilterUI()
            renderDoctors()
        }

        binding.btnFilterInPerson.setOnClickListener {
            consultationType = "IN_PERSON"
            updateSegmentedFilterUI()
            renderDoctors()
        }
    }

    private fun showNotificationsModal() {
        val dialog = BottomSheetDialog(this)
        val dialogBinding = DialogNotificationsModalBinding.inflate(LayoutInflater.from(this))
        dialog.setContentView(dialogBinding.root)

        // Bind data
        val hasMessages = unreadMessageCount > 0
        val hasAppointments = activeAppointmentCount > 0

        if (!hasMessages && !hasAppointments) {
            dialogBinding.cardMessageNotification.visibility = View.GONE
            dialogBinding.cardAppointmentNotification.visibility = View.GONE
            dialogBinding.layoutNotificationsEmpty.visibility = View.VISIBLE
        } else {
            dialogBinding.layoutNotificationsEmpty.visibility = View.GONE

            if (hasMessages) {
                dialogBinding.cardMessageNotification.visibility = View.VISIBLE
                dialogBinding.tvMessageNotificationText.text = "You have $unreadMessageCount unread messages waiting in your inbox."
                dialogBinding.cardMessageNotification.setOnClickListener {
                    dialog.dismiss()
                    startActivity(Intent(this, ChatListActivity::class.java))
                }
            } else {
                dialogBinding.cardMessageNotification.visibility = View.GONE
            }

            if (hasAppointments) {
                dialogBinding.cardAppointmentNotification.visibility = View.VISIBLE
                dialogBinding.tvAppointmentNotificationText.text = "You have $activeAppointmentCount active appointments coming up."
                dialogBinding.cardAppointmentNotification.setOnClickListener {
                    dialog.dismiss()
                    startActivity(Intent(this, AppointmentsListActivity::class.java))
                }
            } else {
                dialogBinding.cardAppointmentNotification.visibility = View.GONE
            }
        }

        dialogBinding.btnDismissAll.setOnClickListener {
            unreadMessageCount = 0
            activeAppointmentCount = 0
            dialogBinding.cardMessageNotification.visibility = View.GONE
            dialogBinding.cardAppointmentNotification.visibility = View.GONE
            dialogBinding.layoutNotificationsEmpty.visibility = View.VISIBLE
            Toast.makeText(this, "All notifications dismissed", Toast.LENGTH_SHORT).show()
        }

        dialogBinding.btnCloseNotifications.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun showProfileModal() {
        val dialog = BottomSheetDialog(this)
        val dialogBinding = DialogProfileModalBinding.inflate(LayoutInflater.from(this))
        dialog.setContentView(dialogBinding.root)

        val fullName = sessionManager.fullName().orEmpty()
        val email = sessionManager.email().orEmpty()
        val initials = fullName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "ME" }

        dialogBinding.tvModalFullName.text = fullName
        dialogBinding.tvModalEmail.text = email
        dialogBinding.tvModalAvatar.text = initials

        dialogBinding.btnModalSignOut.setOnClickListener {
            dialog.dismiss()
            showSignOutConfirmation()
        }

        dialog.show()
    }

    private fun showSignOutConfirmation() {
        val dialog = AlertDialog.Builder(this)
            .setView(layoutInflater.inflate(R.layout.dialog_signout_confirmation, null))
            .create()

        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
        dialog.show()

        val btnCancel = dialog.findViewById<TextView>(R.id.btnConfirmCancel)
        val btnSignOut = dialog.findViewById<TextView>(R.id.btnConfirmSignOut)

        btnCancel?.setOnClickListener {
            dialog.dismiss()
        }

        btnSignOut?.setOnClickListener {
            dialog.dismiss()
            performSignOut()
        }
    }

    private fun performSignOut() {
        sessionManager.clearSession()
        TokenHolder.clearToken()
        Toast.makeText(this, "You have been signed out successfully.", Toast.LENGTH_SHORT).show()
        redirectToLogin()
    }

    private fun updateSegmentedFilterUI() {
        val activeBgTint = ColorStateList.valueOf(Color.WHITE)
        val activeTextColor = ContextCompat.getColor(this, R.color.crimson)
        val inactiveTextColor = ContextCompat.getColor(this, R.color.navy)

        // ALL button style
        if (consultationType == "ALL") {
            binding.btnFilterAll.setBackgroundResource(R.drawable.bg_patient_pill_active)
            binding.btnFilterAll.backgroundTintList = activeBgTint
            binding.btnFilterAll.setTextColor(activeTextColor)
        } else {
            binding.btnFilterAll.setBackgroundResource(android.R.color.transparent)
            binding.btnFilterAll.setTextColor(inactiveTextColor)
        }

        // ONLINE button style
        if (consultationType == "ONLINE") {
            binding.btnFilterOnline.setBackgroundResource(R.drawable.bg_patient_pill_active)
            binding.btnFilterOnline.backgroundTintList = activeBgTint
            binding.btnFilterOnline.setTextColor(activeTextColor)
        } else {
            binding.btnFilterOnline.setBackgroundResource(android.R.color.transparent)
            binding.btnFilterOnline.setTextColor(inactiveTextColor)
        }

        // IN-PERSON button style
        if (consultationType == "IN_PERSON") {
            binding.btnFilterInPerson.setBackgroundResource(R.drawable.bg_patient_pill_active)
            binding.btnFilterInPerson.backgroundTintList = activeBgTint
            binding.btnFilterInPerson.setTextColor(activeTextColor)
        } else {
            binding.btnFilterInPerson.setBackgroundResource(android.R.color.transparent)
            binding.btnFilterInPerson.setTextColor(inactiveTextColor)
        }
    }

    private fun setupDoctorList() {
        doctorsAdapter = DoctorsAdapter { doctor ->
            showDoctorDetailModal(doctor)
        }

        binding.rvDoctors.apply {
            layoutManager = LinearLayoutManager(this@DashboardActivity)
            adapter = doctorsAdapter
        }
    }

    private fun showDoctorDetailModal(doctor: DoctorProfileDto) {
        val dialog = BottomSheetDialog(this)
        val dialogBinding = DialogDoctorDetailBinding.inflate(LayoutInflater.from(this))
        dialog.setContentView(dialogBinding.root)

        dialogBinding.tvDoctorName.text = doctor.doctorName
        dialogBinding.tvSpecialization.text = doctor.specialization?.uppercase() ?: "GENERAL MEDICINE"
        dialogBinding.tvExperience.text = "Practice Experience: ${doctor.yearsOfExperience ?: 0} Years"

        val picUrl = doctor.profilePictureUrl
        if (!picUrl.isNullOrBlank()) {
            val fullUrl = if (picUrl.startsWith("http")) {
                picUrl
            } else {
                "${BuildConfig.BASE_URL.removeSuffix("/")}/${picUrl.removePrefix("/")}"
            }
            dialogBinding.ivDoctorAvatar.scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
            dialogBinding.ivDoctorAvatar.imageTintList = null
            Glide.with(dialogBinding.ivDoctorAvatar.context)
                .load(fullUrl)
                .placeholder(R.drawable.bg_premium_header_gradient)
                .error(R.drawable.bg_premium_header_gradient)
                .into(dialogBinding.ivDoctorAvatar)
        } else {
            dialogBinding.ivDoctorAvatar.scaleType = android.widget.ImageView.ScaleType.CENTER_INSIDE
            dialogBinding.ivDoctorAvatar.setImageResource(R.drawable.ic_stethoscope)
            dialogBinding.ivDoctorAvatar.imageTintList = android.content.res.ColorStateList.valueOf(
                ContextCompat.getColor(dialogBinding.ivDoctorAvatar.context, R.color.crimson)
            )
        }

        dialogBinding.tvClinicName.text = if (!doctor.clinicName.isNullOrBlank()) {
            doctor.clinicName
        } else {
            "No Clinic Configured"
        }

        dialogBinding.tvClinicAddress.text = if (!doctor.clinicAddress.isNullOrBlank()) {
            doctor.clinicAddress
        } else {
            "No Address Configured"
        }

        val fee = doctor.consultationFee ?: 0.0
        dialogBinding.tvConsultationFee.text = String.format("₱%,.2f", fee)

        dialogBinding.tvBio.text = if (!doctor.bio.isNullOrBlank()) {
            doctor.bio
        } else {
            "No biography provided."
        }

        dialogBinding.tvEducation.text = if (!doctor.education.isNullOrBlank()) {
            doctor.education
        } else {
            "No educational background provided."
        }

        dialogBinding.btnDismissModal.setOnClickListener {
            dialog.dismiss()
        }

        dialogBinding.btnBookAppointment.setOnClickListener {
            dialog.dismiss()
            val intent = Intent(this, BookAppointmentActivity::class.java).apply {
                putExtra("doctor_profile", doctor)
            }
            startActivity(intent)
        }

        dialog.show()
    }

    private fun setupSpecializationChips() {
        val specialties = listOf("All") + MedicalSpecializations.ALL
        binding.layoutSpecialties.removeAllViews()

        specialties.forEach { specialty ->
            val chip = TextView(this).apply {
                text = specialty
                val isSelected = specialty == selectedSpecialty
                
                // Set Poppins font
                val font = androidx.core.content.res.ResourcesCompat.getFont(this@DashboardActivity, R.font.poppins)
                typeface = font
                
                textSize = 12f
                setPadding(dp(16), dp(8), dp(16), dp(8))
                
                setTextColor(ContextCompat.getColor(this@DashboardActivity, if (isSelected) android.R.color.white else R.color.navy))
                setBackgroundResource(if (isSelected) R.drawable.bg_patient_pill_active else R.drawable.bg_patient_pill_inactive)
                if (isSelected) {
                    backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(this@DashboardActivity, R.color.navy))
                } else {
                    backgroundTintList = null
                }
                
                setOnClickListener {
                    selectedSpecialty = specialty
                    setupSpecializationChips()
                    renderDoctors()
                }
            }

            val params = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply {
                marginEnd = dp(8)
            }

            binding.layoutSpecialties.addView(chip, params)
        }
    }

    private fun setupSearchFilters() {
        binding.etDoctorSearch.doAfterTextChanged {
            searchQuery = it?.toString().orEmpty().trim()
            renderDoctors()
        }
    }

    private fun loadDoctors() {
        binding.progressDoctors.visibility = View.VISIBLE
        binding.layoutDoctorsEmpty.visibility = View.GONE

        ApiClient.appointmentApi.searchDoctors("").enqueue(object : Callback<ApiEnvelope<List<DoctorProfileDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<DoctorProfileDto>>>,
                response: Response<ApiEnvelope<List<DoctorProfileDto>>>
            ) {
                binding.progressDoctors.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    allDoctors = body.data
                    renderDoctors()
                } else {
                    allDoctors = emptyList()
                    renderDoctors()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<DoctorProfileDto>>>, t: Throwable) {
                binding.progressDoctors.visibility = View.GONE
                allDoctors = emptyList()
                renderDoctors()
            }
        })
    }

    private fun renderDoctors() {
        val filtered = allDoctors.filter { doctor ->
            val specialtyMatch = selectedSpecialty == "All" || (doctor.specialization.orEmpty().contains(selectedSpecialty, ignoreCase = true))
            
            val queryMatch = if (searchQuery.isBlank()) {
                true
            } else {
                val q = searchQuery.lowercase()
                doctor.doctorName.lowercase().contains(q) ||
                    doctor.clinicName.orEmpty().lowercase().contains(q) ||
                    doctor.clinicAddress.orEmpty().lowercase().contains(q) ||
                    doctor.specialization.orEmpty().lowercase().contains(q)
            }

            val typeMatch = when (consultationType) {
                "ONLINE" -> (doctor.doctorId % 2L == 0L)
                "IN_PERSON" -> (doctor.doctorId % 2L != 0L)
                else -> true
            }

            specialtyMatch && queryMatch && typeMatch
        }

        doctorsAdapter.submitList(filtered)
        binding.rvDoctors.visibility = if (filtered.isEmpty()) View.GONE else View.VISIBLE
        binding.layoutDoctorsEmpty.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
