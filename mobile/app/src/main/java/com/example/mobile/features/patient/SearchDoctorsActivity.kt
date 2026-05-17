package com.example.mobile.features.patient

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.databinding.ActivitySearchDoctorsBinding
import com.example.mobile.databinding.ItemDoctorProfileBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.shared.api.ApiClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class SearchDoctorsActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySearchDoctorsBinding
    private lateinit var doctorsAdapter: DoctorsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySearchDoctorsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()

        // Fetch all verified doctors on entry
        fetchDoctors("")
    }

    private fun setupRecyclerView() {
        doctorsAdapter = DoctorsAdapter { doctor ->
            val intent = Intent(this, DoctorDetailActivity::class.java).apply {
                putExtra("doctor_profile", doctor)
            }
            startActivity(intent)
        }

        binding.rvDoctors.apply {
            layoutManager = LinearLayoutManager(this@SearchDoctorsActivity)
            adapter = doctorsAdapter
        }
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnSearch.setOnClickListener {
            triggerSearch()
        }

        binding.etSearchQuery.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                triggerSearch()
                true
            } else {
                false
            }
        }
    }

    private fun triggerSearch() {
        val query = binding.etSearchQuery.text.toString().trim()
        
        // Hide keyboard
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        imm?.hideSoftInputFromWindow(binding.etSearchQuery.windowToken, 0)

        fetchDoctors(query)
    }

    private fun fetchDoctors(query: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutEmptyState.visibility = View.GONE
        binding.rvDoctors.visibility = View.GONE

        ApiClient.appointmentApi.searchDoctors(query).enqueue(object : Callback<ApiEnvelope<List<DoctorProfileDto>>> {
            override fun onResponse(
                call: Call<ApiEnvelope<List<DoctorProfileDto>>>,
                response: Response<ApiEnvelope<List<DoctorProfileDto>>>
            ) {
                binding.progressBar.visibility = View.GONE
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val list = body.data
                    if (list.isEmpty()) {
                        binding.layoutEmptyState.visibility = View.VISIBLE
                    } else {
                        doctorsAdapter.submitList(list)
                        binding.rvDoctors.visibility = View.VISIBLE
                    }
                } else {
                    binding.layoutEmptyState.visibility = View.VISIBLE
                    Toast.makeText(this@SearchDoctorsActivity, "Failed to query doctors list", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<DoctorProfileDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                binding.layoutEmptyState.visibility = View.VISIBLE
                Toast.makeText(this@SearchDoctorsActivity, "Network offline. Check backend connection.", Toast.LENGTH_SHORT).show()
            }
        })
    }
}

class DoctorsAdapter(
    private val onItemClick: (DoctorProfileDto) -> Unit
) : RecyclerView.Adapter<DoctorsAdapter.DoctorViewHolder>() {

    private var items = listOf<DoctorProfileDto>()

    fun submitList(newList: List<DoctorProfileDto>) {
        items = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DoctorViewHolder {
        val binding = ItemDoctorProfileBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return DoctorViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DoctorViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class DoctorViewHolder(
        private val binding: ItemDoctorProfileBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(doctor: DoctorProfileDto) {
            binding.tvDoctorName.text = doctor.doctorName
            binding.tvSpecializationBadge.text = doctor.specialization?.uppercase() ?: "GENERAL MEDICINE"
            
            val clinicText = if (!doctor.clinicName.isNullOrBlank()) {
                "${doctor.clinicName}, ${doctor.clinicAddress.orEmpty()}"
            } else {
                "No Clinic Configured"
            }
            binding.tvClinicDetails.text = clinicText
            binding.tvExperience.text = "Experience: ${doctor.yearsOfExperience ?: 0} years"
            
            val fee = doctor.consultationFee ?: 0.0
            binding.tvConsultationFee.text = String.format("₱%,.2f", fee)

            binding.root.setOnClickListener {
                onItemClick(doctor)
            }
        }
    }
}
