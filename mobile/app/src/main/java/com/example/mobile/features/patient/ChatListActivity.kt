package com.example.mobile.features.patient

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.R
import com.example.mobile.databinding.ActivityChatListBinding
import com.example.mobile.databinding.ItemChatContactBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.ChatContactDto
import com.example.mobile.shared.api.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ChatListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityChatListBinding
    private lateinit var contactsAdapter: ChatContactsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        setupToolbar()
        setupRecyclerView()
        setupSearch()
    }

    override fun onResume() {
        super.onResume()
        fetchContacts(binding.etSearchContacts.text.toString().trim())
    }

    private fun setupToolbar() {
        binding.btnBack.setOnClickListener {
            finish()
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
                if (contact.lastMsg.startsWith("[APPT_COMPLETED]")) {
                    "Consultation completed & signed."
                } else {
                    contact.lastMsg
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
