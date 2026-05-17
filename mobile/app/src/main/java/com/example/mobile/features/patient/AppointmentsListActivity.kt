package com.example.mobile.features.patient

import android.app.Activity
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
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.AppointmentStatusUpdateRequest
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.session.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Locale

class AppointmentsListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAppointmentsListBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var appointmentsAdapter: AppointmentsAdapter
    private var userRole = "PATIENT"

    companion object {
        private const val LAUNCH_COMPLETE = 882
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAppointmentsListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        userRole = sessionManager.role().orEmpty().uppercase()

        setupHeader()
        setupRecyclerView()
        fetchAppointments()
    }

    private fun setupHeader() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        if (userRole == "DOCTOR") {
            binding.tvHeaderTitle.text = "Consultations Queue"
            binding.tvEmptyTitle.text = "Queue Empty"
            binding.tvEmptyDetails.text = "You do not have any patient scheduling requests pending in your queue."
        } else {
            binding.tvHeaderTitle.text = "My Appointments"
            binding.tvEmptyTitle.text = "No Appointments Scheduled"
            binding.tvEmptyDetails.text = "You haven't scheduled any consultations yet."
        }
    }

    private fun setupRecyclerView() {
        appointmentsAdapter = AppointmentsAdapter(
            role = userRole,
            onConfirmClick = { appointment -> updateStatus(appointment.id, "CONFIRMED") },
            onRejectClick = { appointment -> updateStatus(appointment.id, "REJECTED") },
            onCancelClick = { appointment -> cancelAppointment(appointment.id) },
            onCompleteConsultationClick = { appointment ->
                val intent = Intent(this, CompleteAppointmentActivity::class.java).apply {
                    putExtra("appointment_extra", appointment)
                }
                startActivityForResult(intent, LAUNCH_COMPLETE)
            },
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

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == LAUNCH_COMPLETE && resultCode == Activity.RESULT_OK) {
            fetchAppointments()
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
                    val list = body.data
                    if (list.isEmpty()) {
                        binding.layoutEmptyState.visibility = View.VISIBLE
                    } else {
                        appointmentsAdapter.submitList(list)
                        binding.rvAppointments.visibility = View.VISIBLE
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

    private fun updateStatus(id: Long, newStatus: String) {
        binding.progressBar.visibility = View.VISIBLE
        val request = AppointmentStatusUpdateRequest(status = newStatus)

        ApiClient.appointmentApi.updateAppointmentStatus(id, request).enqueue(object : Callback<ApiEnvelope<AppointmentDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AppointmentDto>>,
                response: Response<ApiEnvelope<AppointmentDto>>
            ) {
                binding.progressBar.visibility = View.GONE
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@AppointmentsListActivity, "Slot marked as $newStatus", Toast.LENGTH_SHORT).show()
                    fetchAppointments() // Reload list
                } else {
                    Toast.makeText(this@AppointmentsListActivity, "Failed to update schedule status", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AppointmentDto>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@AppointmentsListActivity, "Network error updating status", Toast.LENGTH_SHORT).show()
            }
        })
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
                    Toast.makeText(this@AppointmentsListActivity, "Consultation successfully cancelled", Toast.LENGTH_SHORT).show()
                    fetchAppointments() // Reload list
                } else {
                    Toast.makeText(this@AppointmentsListActivity, "Unable to cancel consultation", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AppointmentDto>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@AppointmentsListActivity, "Network error cancelling consultation", Toast.LENGTH_SHORT).show()
            }
        })
    }
}

class AppointmentsAdapter(
    private val role: String,
    private val onConfirmClick: (AppointmentDto) -> Unit,
    private val onRejectClick: (AppointmentDto) -> Unit,
    private val onCancelClick: (AppointmentDto) -> Unit,
    private val onCompleteConsultationClick: (AppointmentDto) -> Unit,
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
            // Adapt display name based on role
            binding.tvAppointmentHeader.text = if (role == "DOCTOR") {
                appointment.patientName
            } else {
                "Dr. ${appointment.doctorName}"
            }

            binding.tvAppointmentTime.text = formatDateTime(appointment.appointmentAt)
            binding.tvAppointmentType.text = "Medium: ${appointment.appointmentType}"
            
            val noteText = if (!appointment.notes.isNullOrBlank()) {
                "Notes: ${appointment.notes}"
            } else {
                "Notes: No symptoms described"
            }
            binding.tvAppointmentNotes.text = noteText

            // Configure status tags capsules
            configureStatusTag(appointment.status)

            // Configure action buttons visibility
            configureActionArea(appointment)

            // View consultation summary when completed card is clicked
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

            // Reset action buttons visibility
            binding.layoutActionArea.visibility = View.GONE
            binding.btnPatientCancel.visibility = View.GONE
            binding.btnDoctorConfirm.visibility = View.GONE
            binding.btnDoctorReject.visibility = View.GONE

            if (role == "DOCTOR") {
                if (status == "PENDING_DOCTOR_APPROVAL") {
                    binding.layoutActionArea.visibility = View.VISIBLE
                    binding.btnDoctorConfirm.text = "Confirm Slot"
                    binding.btnDoctorConfirm.visibility = View.VISIBLE
                    binding.btnDoctorReject.visibility = View.VISIBLE

                    binding.btnDoctorConfirm.setOnClickListener { onConfirmClick(appointment) }
                    binding.btnDoctorReject.setOnClickListener { onRejectClick(appointment) }
                } else if (status == "CONFIRMED") {
                    binding.layoutActionArea.visibility = View.VISIBLE
                    binding.btnDoctorConfirm.text = "Complete Consultation"
                    binding.btnDoctorConfirm.visibility = View.VISIBLE

                    binding.btnDoctorConfirm.setOnClickListener { onCompleteConsultationClick(appointment) }
                }
            } else {
                if (status == "PENDING_DOCTOR_APPROVAL" || status == "CONFIRMED") {
                    binding.layoutActionArea.visibility = View.VISIBLE
                    binding.btnPatientCancel.visibility = View.VISIBLE

                    binding.btnPatientCancel.setOnClickListener { onCancelClick(appointment) }
                }
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
