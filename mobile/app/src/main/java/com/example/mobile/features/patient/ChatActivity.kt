package com.example.mobile.features.patient

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.R
import com.example.mobile.databinding.ActivityChatBinding
import com.example.mobile.databinding.ItemChatMessageReceivedBinding
import com.example.mobile.databinding.ItemChatMessageSentBinding
import com.example.mobile.databinding.ItemChatMessageSystemBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.ChatMessageDto
import com.example.mobile.model.ChatSendRequest
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.session.SessionManager
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat

class ChatActivity : AppCompatActivity() {
    private lateinit var binding: ActivityChatBinding
    private lateinit var sessionManager: SessionManager
    private lateinit var chatAdapter: ChatMessagesAdapter
    private var partnerId: Long = 0
    private var partnerName: String = ""
    private var partnerRole: String = ""

    private val handler = Handler(Looper.getMainLooper())
    private val pollRunnable = object : Runnable {
        override fun run() {
            fetchMessages(silent = true)
            handler.postDelayed(this, 3000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        sessionManager = SessionManager(this)
        partnerId = intent.getLongExtra("partner_id", 0)
        partnerName = intent.getStringExtra("partner_name").orEmpty()
        partnerRole = intent.getStringExtra("partner_role").orEmpty()

        if (partnerId == 0L) {
            Toast.makeText(this, "Unable to load conversation.", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupToolbar()
        setupRecyclerView()
        setupListeners()
        fetchMessages(silent = false)
    }

    override fun onStart() {
        super.onStart()
        handler.postDelayed(pollRunnable, 3000)
    }

    override fun onStop() {
        super.onStop()
        handler.removeCallbacks(pollRunnable)
    }

    private fun setupToolbar() {
        binding.btnBack.setOnClickListener {
            finish()
        }
        binding.tvHeaderPartnerName.text = partnerName
        binding.tvHeaderPartnerRole.text = "ONLINE • ${partnerRole.uppercase()}"
        val initials = partnerName.split(' ')
            .filter { it.isNotBlank() }
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .take(2)
            .joinToString("")
            .ifBlank { "DR" }
        binding.tvAvatarInitials.text = initials
    }

    private fun setupRecyclerView() {
        val currentUserId = sessionManager.userId()
        chatAdapter = ChatMessagesAdapter(
            currentUserId = currentUserId,
            partnerId = partnerId,
            partnerName = partnerName,
            sessionManager = sessionManager,
            onSystemSummaryClick = { apptDto, rawContent ->
                val intent = Intent(this, ConsultationSummaryActivity::class.java).apply {
                    putExtra("appointment_extra", apptDto)
                    putExtra("completed_content_extra", rawContent)
                }
                startActivity(intent)
            }
        )

        binding.rvChatMessages.apply {
            layoutManager = LinearLayoutManager(this@ChatActivity).apply {
                stackFromEnd = true
            }
            adapter = chatAdapter
        }
    }

    private fun setupListeners() {
        binding.btnSendMessage.setOnClickListener {
            sendMessageText()
        }
    }

    private fun fetchMessages(silent: Boolean) {
        if (!silent) {
            binding.progressBar.visibility = View.VISIBLE
        }

        ApiClient.chatApi.getConversation(partnerId).enqueue(object : Callback<ApiEnvelope<List<ChatMessageDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<ChatMessageDto>>>,
                response: Response<ApiEnvelope<List<ChatMessageDto>>>
            ) {
                binding.progressBar.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val messages = body.data
                    chatAdapter.submitList(messages)
                    if (!silent && messages.isNotEmpty()) {
                        binding.rvChatMessages.scrollToPosition(messages.size - 1)
                    }
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<ChatMessageDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
            }
        })
    }

    private fun sendMessageText() {
        val text = binding.etMessageInput.text.toString().trim()
        if (text.isEmpty()) return

        binding.etMessageInput.setText("")
        binding.btnSendMessage.isEnabled = false

        val request = ChatSendRequest(
            receiverId = partnerId,
            content = text
        )

        ApiClient.chatApi.sendMessage(request).enqueue(object : Callback<ApiEnvelope<ChatMessageDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<ChatMessageDto>>,
                response: Response<ApiEnvelope<ChatMessageDto>>
            ) {
                binding.btnSendMessage.isEnabled = true
                if (response.isSuccessful && response.body()?.success == true) {
                    fetchMessages(silent = true)
                } else {
                    Toast.makeText(this@ChatActivity, "Message failed to send.", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<ChatMessageDto>>, t: Throwable) {
                binding.btnSendMessage.isEnabled = true
                Toast.makeText(this@ChatActivity, "Network offline.", Toast.LENGTH_SHORT).show()
            }
        })
    }
}

class ChatMessagesAdapter(
    private val currentUserId: Long,
    private val partnerId: Long,
    private val partnerName: String,
    private val sessionManager: SessionManager,
    private val onSystemSummaryClick: (AppointmentDto, String) -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private var items = listOf<ChatMessageDto>()

    companion object {
        private const val TYPE_SENT = 1
        private const val TYPE_RECEIVED = 2
        private const val TYPE_SYSTEM = 3
    }

    fun submitList(newList: List<ChatMessageDto>) {
        if (items.size != newList.size) {
            items = newList.sortedBy { it.sentAt }
            notifyDataSetChanged()
        }
    }

    override fun getItemViewType(position: Int): Int {
        val msg = items[position]
        return when {
            msg.content.startsWith("[APPT_") -> TYPE_SYSTEM
            msg.senderId == currentUserId -> TYPE_SENT
            else -> TYPE_RECEIVED
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return when (viewType) {
            TYPE_SENT -> {
                val binding = ItemChatMessageSentBinding.inflate(inflater, parent, false)
                SentViewHolder(binding)
            }
            TYPE_SYSTEM -> {
                val binding = ItemChatMessageSystemBinding.inflate(inflater, parent, false)
                SystemViewHolder(binding)
            }
            else -> {
                val binding = ItemChatMessageReceivedBinding.inflate(inflater, parent, false)
                ReceivedViewHolder(binding)
            }
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = items[position]
        when (holder) {
            is SentViewHolder -> holder.bind(msg)
            is ReceivedViewHolder -> holder.bind(msg)
            is SystemViewHolder -> holder.bind(msg)
        }
    }

    override fun getItemCount(): Int = items.size

    inner class SentViewHolder(private val sentBinding: ItemChatMessageSentBinding) : RecyclerView.ViewHolder(sentBinding.root) {
        fun bind(message: ChatMessageDto) {
            sentBinding.tvMessageContent.text = message.content
            sentBinding.tvMessageTime.text = formatTime(message.sentAt)
        }
    }

    inner class ReceivedViewHolder(private val receivedBinding: ItemChatMessageReceivedBinding) : RecyclerView.ViewHolder(receivedBinding.root) {
        fun bind(message: ChatMessageDto) {
            receivedBinding.tvMessageContent.text = message.content
            receivedBinding.tvMessageTime.text = formatTime(message.sentAt)
        }
    }

    inner class SystemViewHolder(private val systemBinding: ItemChatMessageSystemBinding) : RecyclerView.ViewHolder(systemBinding.root) {
        fun bind(message: ChatMessageDto) {
            val context = systemBinding.root.context
            val parsed = parseSummaryContent(message.content)
            val doctor = parsed["Doctor"] ?: "Practitioner"
            systemBinding.tvMessageTime.text = formatTime(message.sentAt)

            when {
                message.content.startsWith("[APPT_COMPLETED]") -> {
                    // Green Completed Card
                    systemBinding.cardSystemMessage.setCardBackgroundColor(Color.parseColor("#F0FDF4"))
                    systemBinding.tvSystemStatusTitle.text = "Consultation Completed"
                    systemBinding.tvSystemStatusTitle.setTextColor(Color.parseColor("#15803D"))
                    systemBinding.tvSystemStatusPill.text = "SIGNED REPORT"
                    systemBinding.tvSystemStatusPill.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#15803D"))
                    systemBinding.tvSystemMessageHeader.text = "Doctor: Dr. $doctor"
                    systemBinding.tvSystemMessageDetails.text = parsed["Medical Notes"] ?: "Prescription report and laboratory requests are signed and available."
                    systemBinding.btnViewSystemSummary.visibility = View.VISIBLE

                    systemBinding.btnViewSystemSummary.setOnClickListener {
                        val apptDto = AppointmentDto(
                            id = message.appointmentId ?: 0L,
                            patientId = currentUserId,
                            patientName = sessionManager.fullName().orEmpty(),
                            patientAge = null,
                            patientGender = null,
                            doctorId = partnerId,
                            doctorName = partnerName,
                            appointmentAt = message.sentAt,
                            appointmentType = "Consultation",
                            notes = "",
                            status = "COMPLETED",
                            createdAt = message.sentAt
                        )
                        onSystemSummaryClick(apptDto, message.content)
                    }
                }
                message.content.startsWith("[APPT_CONFIRMED]") -> {
                    // Blue/Slate Confirmed Card
                    systemBinding.cardSystemMessage.setCardBackgroundColor(Color.parseColor("#F0F9FF"))
                    systemBinding.tvSystemStatusTitle.text = "Consultation Confirmed"
                    systemBinding.tvSystemStatusTitle.setTextColor(Color.parseColor("#0369A1"))
                    systemBinding.tvSystemStatusPill.text = "CONFIRMED"
                    systemBinding.tvSystemStatusPill.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#0369A1"))
                    systemBinding.tvSystemMessageHeader.text = "Doctor: Dr. $doctor"
                    
                    val whenVal = parsed["When"] ?: ""
                    val locVal = parsed["Location"] ?: ""
                    val typeVal = parsed["Type"] ?: "Consultation"
                    val instVal = parsed["Instructions"] ?: ""
                    systemBinding.tvSystemMessageDetails.text = "Scheduled: $whenVal\nType: $typeVal\nLocation: $locVal\nInstructions: $instVal"
                    systemBinding.btnViewSystemSummary.visibility = View.GONE
                }
                message.content.startsWith("[APPT_CANCELLED]") -> {
                    // Red/Pink Cancelled/Declined Card
                    systemBinding.cardSystemMessage.setCardBackgroundColor(Color.parseColor("#FEF2F2"))
                    
                    val statusLabel = parsed["Status"] ?: "Cancelled"
                    systemBinding.tvSystemStatusTitle.text = "Consultation $statusLabel"
                    systemBinding.tvSystemStatusTitle.setTextColor(Color.parseColor("#B91C1C"))
                    systemBinding.tvSystemStatusPill.text = statusLabel.uppercase()
                    systemBinding.tvSystemStatusPill.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#B91C1C"))
                    systemBinding.tvSystemMessageHeader.text = "Doctor: Dr. $doctor"
                    
                    val whenVal = parsed["When"] ?: ""
                    val reasonVal = parsed["Reason"] ?: "No reason provided by the doctor."
                    systemBinding.tvSystemMessageDetails.text = "Scheduled: $whenVal\nReason: $reasonVal"
                    systemBinding.btnViewSystemSummary.visibility = View.GONE
                }
                else -> {
                    // Fallback
                    systemBinding.cardSystemMessage.setCardBackgroundColor(Color.parseColor("#F8FAFC"))
                    systemBinding.tvSystemStatusTitle.text = "System Message"
                    systemBinding.tvSystemStatusTitle.setTextColor(Color.parseColor("#475569"))
                    systemBinding.tvSystemStatusPill.text = "SYSTEM"
                    systemBinding.tvSystemStatusPill.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#475569"))
                    systemBinding.tvSystemMessageHeader.text = "Info"
                    systemBinding.tvSystemMessageDetails.text = message.content
                    systemBinding.btnViewSystemSummary.visibility = View.GONE
                }
            }
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

    private fun formatTime(isoString: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
            val formatter = SimpleDateFormat("hh:mm a", java.util.Locale.US)
            val date = parser.parse(isoString)
            if (date != null) formatter.format(date) else isoString.split("T").lastOrNull()?.take(5) ?: ""
        } catch (e: Exception) {
            ""
        }
    }
}
