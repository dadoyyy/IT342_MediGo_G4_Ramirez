package com.example.mobile.features.patient

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.BuildConfig
import com.example.mobile.R
import com.example.mobile.databinding.ActivityConsultationSummaryBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.ChatMessageDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.session.SessionManager
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ConsultationSummaryActivity : AppCompatActivity() {
    private lateinit var binding: ActivityConsultationSummaryBinding
    private var appointment: AppointmentDto? = null
    private var otherUserId: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityConsultationSummaryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)
        attachPatientBottomNav(PatientBottomTab.APPOINTMENTS)

        appointment = intent.getSerializableExtra("appointment_extra") as? AppointmentDto
        if (appointment == null) {
            Toast.makeText(this, "Failed to load appointment details", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupMetadata()
        setupListeners()

        val directContent = intent.getStringExtra("completed_content_extra")
        if (!directContent.isNullOrBlank()) {
            bindParsedSummary(directContent)
        } else {
            fetchConsultationSummary()
        }
    }

    private fun setupMetadata() {
        val app = appointment ?: return
        // Patient view: always show doctor name
        binding.tvHeaderName.text = "Dr. ${app.doctorName}"
        binding.tvConsultationDetails.text = "Medium: ${app.appointmentType} • Report Summary"
        otherUserId = app.doctorId
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun fetchConsultationSummary() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvDiagnosisNotes.text = "Retrieving report summary..."

        ApiClient.chatApi.getConversation(otherUserId).enqueue(object : Callback<ApiEnvelope<List<ChatMessageDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<ChatMessageDto>>>,
                response: Response<ApiEnvelope<List<ChatMessageDto>>>
            ) {
                binding.progressBar.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val messages = body.data
                    val completedMsg = messages.firstOrNull {
                        val isCompleted = it.content.startsWith("[APPT_COMPLETED]")
                        val matchesAppt = it.appointmentId == appointment?.id || 
                                          appointment?.id == null || 
                                          appointment?.id == 0L || 
                                          it.appointmentId == null || 
                                          it.appointmentId == 0L
                        isCompleted && matchesAppt
                    } ?: messages.firstOrNull { it.content.startsWith("[APPT_COMPLETED]") }

                    if (completedMsg != null) {
                        bindParsedSummary(completedMsg.content)
                    } else {
                        showPlaceholderState()
                    }
                } else {
                    showPlaceholderState()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<ChatMessageDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                showPlaceholderState()
            }
        })
    }

    private fun bindParsedSummary(content: String) {
        val parsed = parseSummaryContent(content)

        val notes = parsed["Medical Notes"]
        binding.tvDiagnosisNotes.text = if (!notes.isNullOrBlank()) {
            notes
        } else {
            "No medical notes provided."
        }

        val followUp = parsed["Follow-up"]
        binding.tvFollowUp.text = if (!followUp.isNullOrBlank()) {
            followUp
        } else {
            "No follow-up configured."
        }

        val digitalRecords = parsed["Digital Records"]
        if (!digitalRecords.isNullOrBlank() && digitalRecords.contains(":")) {
            val path = digitalRecords.substring(digitalRecords.indexOf(":") + 1).trim()
            if (path.isNotBlank()) {
                val baseUrl = BuildConfig.BASE_URL
                val rootUrl = if (baseUrl.contains("/api/v1/")) {
                    baseUrl.substringBefore("/api/v1/")
                } else if (baseUrl.contains("/api/")) {
                    baseUrl.substringBefore("/api/")
                } else {
                    baseUrl.removeSuffix("/")
                }
                val cleanPath = if (path.startsWith("/")) path else "/$path"
                val fullUrl = rootUrl + cleanPath

                binding.layoutAttachmentCard.visibility = View.VISIBLE
                binding.btnDownloadPdf.setOnClickListener {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl))
                        startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(this, "Unable to view PDF.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun showPlaceholderState() {
        binding.tvDiagnosisNotes.text = "Your prescription and diagnosis details are being finalized. Check back shortly."
        binding.tvFollowUp.text = "None configured."
        binding.layoutAttachmentCard.visibility = View.GONE
    }

    private fun parseSummaryContent(content: String): Map<String, String> {
        val map = mutableMapOf<String, String>()
        val segments = content.split("|")
        for (seg in segments) {
            if (seg.contains("=")) {
                val parts = seg.split("=", limit = 2)
                if (parts.size == 2) {
                    map[parts[0].trim()] = parts[1].trim()
                }
            }
        }
        return map
    }
}
