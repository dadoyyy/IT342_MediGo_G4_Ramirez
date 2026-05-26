package com.example.mobile.features.patient

import android.content.Intent
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.R
import com.example.mobile.databinding.ActivityAppointmentsListBinding
import com.example.mobile.databinding.ItemAppointmentBinding
import com.example.mobile.databinding.DialogNotificationsModalBinding
import com.example.mobile.databinding.DialogProfileModalBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.ChatContactDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import com.example.mobile.features.auth.LoginActivity
import com.google.android.material.bottomsheet.BottomSheetDialog
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Locale

class AppointmentsListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAppointmentsListBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var appointmentsAdapter: AppointmentsAdapter
    private var allAppointments = listOf<AppointmentDto>()
    private var currentFilter = "ALL"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAppointmentsListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)
        attachPatientBottomNav(PatientBottomTab.APPOINTMENTS)

        sessionManager = SessionManager(this)

        setupHeader()
        setupRecyclerView()
        setupFilterPills()
    }

    private var unreadMessageCount = 0L
    private var activeAppointmentCount = 0L

    override fun onResume() {
        super.onResume()
        fetchAppointments()
        loadNotificationCounts()
    }

    private fun setupHeader() {
        binding.tvEmptyTitle.text = "No Appointments Scheduled"
        binding.tvEmptyDetails.text = "You haven't scheduled any consultations yet."

        // Render profile initials
        val fullName = sessionManager.fullName().orEmpty()
        val initials = fullName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "ME" }
        binding.btnOpenProfile.text = initials

        binding.btnNotifications.setOnClickListener {
            showNotificationsModal()
        }

        binding.btnOpenProfile.setOnClickListener {
            showProfileModal()
        }
    }

    private fun setupRecyclerView() {
        appointmentsAdapter = AppointmentsAdapter(
            onCancelClick = { appointment -> cancelAppointment(appointment.id) },
            onCompletedClick = { appointment ->
                val intent = Intent(this, ConsultationSummaryActivity::class.java).apply {
                    putExtra("appointment_extra", appointment)
                }
                startActivity(intent)
            }
        )

        binding.rvAppointments.apply {
            layoutManager = LinearLayoutManager(this@AppointmentsListActivity)
            adapter = appointmentsAdapter
        }
    }

    private fun setupFilterPills() {
        val pills = listOf(
            binding.filterAll to "ALL",
            binding.filterPending to "PENDING",
            binding.filterConfirmed to "CONFIRMED",
            binding.filterCompleted to "COMPLETED",
            binding.filterCancelled to "CANCELLED"
        )

        for ((pill, filter) in pills) {
            pill.setOnClickListener {
                currentFilter = filter
                applyFilter()
                updatePillStyles(pills)
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun updatePillStyles(pills: List<Pair<android.widget.TextView, String>>) {
        for ((pill, filter) in pills) {
            if (filter == currentFilter) {
                pill.setBackgroundResource(R.drawable.bg_patient_pill_active)
                pill.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                pill.setBackgroundResource(R.drawable.bg_patient_pill_inactive)
                pill.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
            }
        }
    }

    private fun applyFilter() {
        val filtered = if (currentFilter == "ALL") {
            allAppointments
        } else {
            allAppointments.filter { appt ->
                val status = appt.status.uppercase()
                when (currentFilter) {
                    "PENDING" -> status == "PENDING" || status == "PENDING_DOCTOR_APPROVAL"
                    "CANCELLED" -> status == "CANCELLED" || status == "REJECTED"
                    else -> status == currentFilter
                }
            }
        }

        if (filtered.isEmpty()) {
            binding.layoutEmptyState.visibility = View.VISIBLE
            binding.rvAppointments.visibility = View.GONE
        } else {
            binding.layoutEmptyState.visibility = View.GONE
            binding.rvAppointments.visibility = View.VISIBLE
            appointmentsAdapter.submitList(filtered)
        }
    }

    private fun fetchAppointments() {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutEmptyState.visibility = View.GONE
        binding.rvAppointments.visibility = View.GONE

        ApiClient.appointmentApi.getMyAppointments().enqueue(object : Callback<ApiEnvelope<List<AppointmentDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<AppointmentDto>>>,
                response: Response<ApiEnvelope<List<AppointmentDto>>>
            ) {
                binding.progressBar.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    allAppointments = body.data
                    if (allAppointments.isEmpty()) {
                        binding.layoutEmptyState.visibility = View.VISIBLE
                        binding.tvStatUpcomingCount.text = "0"
                        binding.tvStatCompletedCount.text = "0"
                    } else {
                        val upcomingCount = allAppointments.count {
                            val status = it.status.uppercase()
                            status == "CONFIRMED" || status == "PENDING" || status == "PENDING_DOCTOR_APPROVAL"
                        }
                        val completedCount = allAppointments.count { it.status.uppercase() == "COMPLETED" }
                        binding.tvStatUpcomingCount.text = upcomingCount.toString()
                        binding.tvStatCompletedCount.text = completedCount.toString()

                        applyFilter()
                    }
                } else {
                    binding.layoutEmptyState.visibility = View.VISIBLE
                    Toast.makeText(this@AppointmentsListActivity, "Failed to load appointments", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<AppointmentDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                binding.layoutEmptyState.visibility = View.VISIBLE
                Toast.makeText(this@AppointmentsListActivity, "Network connection offline.", Toast.LENGTH_SHORT).show()
            }
        })
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
                val completedCount = appointments.count { it.status.uppercase() == "COMPLETED" }
                binding.tvStatUpcomingCount.text = activeAppointmentCount.toString()
                binding.tvStatCompletedCount.text = completedCount.toString()
            }

            override fun onFailure(call: Call<ApiEnvelope<List<AppointmentDto>>>, t: Throwable) {
                activeAppointmentCount = 0
            }
        })
    }

    private fun showNotificationsModal() {
        val dialog = BottomSheetDialog(this)
        val dialogBinding = DialogNotificationsModalBinding.inflate(LayoutInflater.from(this))
        dialog.setContentView(dialogBinding.root)

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
                    // Already on AppointmentsListActivity
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

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun cancelAppointment(id: Long) {
        binding.progressBar.visibility = View.VISIBLE

        ApiClient.appointmentApi.cancelAppointment(id).enqueue(object : Callback<ApiEnvelope<AppointmentDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AppointmentDto>>,
                response: Response<ApiEnvelope<AppointmentDto>>
            ) {
                binding.progressBar.visibility = View.GONE
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@AppointmentsListActivity, "Appointment cancelled", Toast.LENGTH_SHORT).show()
                    fetchAppointments()
                } else {
                    Toast.makeText(this@AppointmentsListActivity, "Unable to cancel appointment", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AppointmentDto>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@AppointmentsListActivity, "Network error", Toast.LENGTH_SHORT).show()
            }
        })
    }
}

class AppointmentsAdapter(
    private val onCancelClick: (AppointmentDto) -> Unit,
    private val onCompletedClick: (AppointmentDto) -> Unit
) : RecyclerView.Adapter<AppointmentsAdapter.AppointmentViewHolder>() {

    private var items = listOf<AppointmentDto>()

    fun submitList(newList: List<AppointmentDto>) {
        items = newList.sortedByDescending { it.appointmentAt }
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppointmentViewHolder {
        val binding = ItemAppointmentBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return AppointmentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AppointmentViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class AppointmentViewHolder(
        private val binding: ItemAppointmentBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(appointment: AppointmentDto) {
            binding.tvAppointmentHeader.text = "Dr. ${appointment.doctorName}"
            binding.tvAppointmentTime.text = formatDateTime(appointment.appointmentAt)
            binding.tvAppointmentType.text = "Medium: ${appointment.appointmentType}"

            val noteText = if (!appointment.notes.isNullOrBlank()) {
                "Notes: ${appointment.notes}"
            } else {
                "Notes: No symptoms described"
            }
            binding.tvAppointmentNotes.text = noteText

            configureStatusTag(appointment.status)
            configureActionArea(appointment)

            if (appointment.status.uppercase() == "COMPLETED") {
                binding.root.setOnClickListener { onCompletedClick(appointment) }
                binding.root.isClickable = true
                binding.root.isFocusable = true
            } else {
                binding.root.setOnClickListener(null)
                binding.root.isClickable = false
                binding.root.isFocusable = false
            }
        }

        private fun configureStatusTag(status: String) {
            val badge = binding.tvStatusBadge
            val context = badge.context

            badge.text = status.replace("_", " ").uppercase()

            when (status.uppercase()) {
                "PENDING_DOCTOR_APPROVAL", "PENDING" -> {
                    badge.text = "PENDING APPROVAL"
                    badge.setTextColor(ContextCompat.getColor(context, R.color.warning))
                    badge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_error)
                    badge.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(context, R.color.warning_bg))
                }
                "CONFIRMED" -> {
                    badge.setTextColor(ContextCompat.getColor(context, R.color.success))
                    badge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_success)
                    badge.backgroundTintList = null
                }
                "COMPLETED" -> {
                    badge.setTextColor(ContextCompat.getColor(context, R.color.success))
                    badge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_success)
                    badge.backgroundTintList = null
                }
                "REJECTED", "CANCELLED" -> {
                    badge.setTextColor(ContextCompat.getColor(context, R.color.error))
                    badge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_error)
                    badge.backgroundTintList = null
                }
                else -> {
                    badge.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                    badge.background = ContextCompat.getDrawable(context, R.drawable.bg_selectable_card)
                    badge.backgroundTintList = null
                }
            }
        }

        private fun configureActionArea(appointment: AppointmentDto) {
            val status = appointment.status.uppercase()

            binding.layoutActionArea.visibility = View.GONE
            binding.btnPatientCancel.visibility = View.GONE
            binding.btnDoctorConfirm.visibility = View.GONE
            binding.btnDoctorReject.visibility = View.GONE

            // Patient can cancel pending or confirmed appointments
            if (status == "PENDING_DOCTOR_APPROVAL" || status == "CONFIRMED") {
                binding.layoutActionArea.visibility = View.VISIBLE
                binding.btnPatientCancel.visibility = View.VISIBLE
                binding.btnPatientCancel.setOnClickListener { onCancelClick(appointment) }
            }
        }

        private fun formatDateTime(isoString: String): String {
            return try {
                val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
                val formatter = SimpleDateFormat("EEEE, MMMM dd, yyyy 'at' hh:mm a", Locale.US)
                val date = parser.parse(isoString)
                if (date != null) formatter.format(date) else isoString.replace("T", " ")
            } catch (e: Exception) {
                isoString.replace("T", " ")
            }
        }
    }
}
