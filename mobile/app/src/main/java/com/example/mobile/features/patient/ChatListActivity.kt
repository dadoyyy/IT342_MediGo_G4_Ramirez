package com.example.mobile.features.patient

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.R
import com.example.mobile.databinding.ActivityChatListBinding
import com.example.mobile.databinding.ItemChatContactBinding
import com.example.mobile.databinding.DialogNotificationsModalBinding
import com.example.mobile.databinding.DialogProfileModalBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.ChatContactDto
import com.example.mobile.model.AppointmentDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.shared.session.SessionManager
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import com.example.mobile.features.auth.LoginActivity
import com.google.android.material.bottomsheet.BottomSheetDialog
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ChatListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityChatListBinding
    private lateinit var contactsAdapter: ChatContactsAdapter
    private lateinit var sessionManager: SessionManager
    private var unreadMessageCount = 0L
    private var activeAppointmentCount = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)
        attachPatientBottomNav(PatientBottomTab.MESSAGES)

        sessionManager = SessionManager(this)

        setupToolbar()
        setupRecyclerView()
        setupSearch()
    }

    override fun onResume() {
        super.onResume()
        fetchContacts(binding.etSearchContacts.text.toString().trim())
        loadNotificationCounts()
    }

    private fun setupToolbar() {
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
        contactsAdapter = ChatContactsAdapter { contact ->
            val intent = Intent(this, ChatActivity::class.java).apply {
                putExtra("partner_id", contact.userId)
                putExtra("partner_name", contact.fullName)
                putExtra("partner_role", contact.role)
            }
            startActivity(intent)
        }

        binding.rvContacts.apply {
            layoutManager = LinearLayoutManager(this@ChatListActivity)
            adapter = contactsAdapter
        }
    }

    private fun setupSearch() {
        binding.etSearchContacts.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                fetchContacts(s?.toString().orEmpty().trim())
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun fetchContacts(query: String?) {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutEmptyState.visibility = View.GONE

        val searchQuery = if (query.isNullOrBlank()) null else query

        ApiClient.chatApi.getContacts(searchQuery).enqueue(object : Callback<ApiEnvelope<List<ChatContactDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<ChatContactDto>>>,
                response: Response<ApiEnvelope<List<ChatContactDto>>>
            ) {
                binding.progressBar.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val list = body.data
                    if (list.isEmpty()) {
                        binding.layoutEmptyState.visibility = View.VISIBLE
                        contactsAdapter.submitList(emptyList())
                    } else {
                        contactsAdapter.submitList(list)
                    }
                } else {
                    binding.layoutEmptyState.visibility = View.VISIBLE
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<ChatContactDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                binding.layoutEmptyState.visibility = View.VISIBLE
                Toast.makeText(this@ChatListActivity, "Connection offline", Toast.LENGTH_SHORT).show()
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
                    // Already on ChatListActivity
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

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}

class ChatContactsAdapter(
    private val onContactClick: (ChatContactDto) -> Unit
) : RecyclerView.Adapter<ChatContactsAdapter.ContactViewHolder>() {

    private var items = listOf<ChatContactDto>()

    fun submitList(newList: List<ChatContactDto>) {
        items = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ContactViewHolder {
        val binding = ItemChatContactBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ContactViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ContactViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ContactViewHolder(
        private val binding: ItemChatContactBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(contact: ChatContactDto) {
            binding.tvContactName.text = contact.fullName
            binding.tvContactRole.text = contact.role.uppercase()

            val initials = if (contact.role.uppercase() == "DOCTOR") {
                "Dr"
            } else {
                contact.fullName.take(2).uppercase()
            }
            binding.tvAvatarInitials.text = initials

            val lastMsgText = if (!contact.lastMsg.isNullOrBlank()) {
                val rawMsg = contact.lastMsg
                when {
                    rawMsg.startsWith("[APPT_COMPLETED]") -> "Consultation completed & signed."
                    rawMsg.startsWith("[APPT_CONFIRMED]") -> "Consultation slot confirmed."
                    rawMsg.startsWith("[APPT_CANCELLED]") -> {
                        val isDeclined = rawMsg.contains("Status=Declined")
                        if (isDeclined) "Consultation declined by doctor." else "Consultation cancelled."
                    }
                    else -> rawMsg
                }
            } else {
                "No messages yet."
            }
            binding.tvLastMessage.text = lastMsgText

            binding.tvTimeLabel.text = if (!contact.lastMsgAt.isNullOrBlank()) {
                contact.lastMsgAt.split("T").firstOrNull() ?: ""
            } else {
                ""
            }

            if (contact.unread > 0) {
                binding.tvUnreadCount.text = contact.unread.toString()
                binding.tvUnreadCount.visibility = View.VISIBLE
            } else {
                binding.tvUnreadCount.visibility = View.GONE
            }

            binding.root.setOnClickListener { onContactClick(contact) }
        }
    }
}
