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
import com.example.mobile.R
import com.example.mobile.databinding.ActivitySearchDoctorsBinding
import com.example.mobile.databinding.ItemDoctorProfileBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import com.bumptech.glide.Glide
import com.example.mobile.BuildConfig
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.example.mobile.databinding.DialogDoctorDetailBinding
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

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        setupRecyclerView()
        setupListeners()
        attachPatientBottomNav(PatientBottomTab.HOME)
        fetchDoctors("")
    }

    private fun setupRecyclerView() {
        doctorsAdapter = DoctorsAdapter { doctor ->
            showDoctorDetailModal(doctor)
        }

        binding.rvDoctors.apply {
            layoutManager = LinearLayoutManager(this@SearchDoctorsActivity)
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
                androidx.core.content.ContextCompat.getColor(dialogBinding.ivDoctorAvatar.context, R.color.crimson)
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
                    Toast.makeText(this@SearchDoctorsActivity, "Failed to load doctors", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<List<DoctorProfileDto>>>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                binding.layoutEmptyState.visibility = View.VISIBLE
                Toast.makeText(this@SearchDoctorsActivity, "Network offline.", Toast.LENGTH_SHORT).show()
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

            binding.tvVerifiedBadge.visibility = if (doctor.verified) View.VISIBLE else View.GONE

            // Render profile picture
            val picUrl = doctor.profilePictureUrl
            if (!picUrl.isNullOrBlank()) {
                val fullUrl = if (picUrl.startsWith("http")) {
                    picUrl
                } else {
                    "${BuildConfig.BASE_URL.removeSuffix("/")}/${picUrl.removePrefix("/")}"
                }
                binding.ivDoctorAvatar.scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
                binding.ivDoctorAvatar.imageTintList = null
                Glide.with(binding.ivDoctorAvatar.context)
                    .load(fullUrl)
                    .placeholder(R.drawable.bg_premium_header_gradient)
                    .error(R.drawable.bg_premium_header_gradient)
                    .into(binding.ivDoctorAvatar)
            } else {
                binding.ivDoctorAvatar.scaleType = android.widget.ImageView.ScaleType.CENTER_INSIDE
                binding.ivDoctorAvatar.setImageResource(R.drawable.ic_stethoscope)
                binding.ivDoctorAvatar.imageTintList = android.content.res.ColorStateList.valueOf(
                    androidx.core.content.ContextCompat.getColor(binding.ivDoctorAvatar.context, R.color.crimson)
                )
            }

            binding.root.setOnClickListener {
                onItemClick(doctor)
            }
            binding.btnViewProfile.setOnClickListener {
                onItemClick(doctor)
            }
        }
    }
}
