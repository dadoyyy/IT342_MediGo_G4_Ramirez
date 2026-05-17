package com.example.mobile.features.patient

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.databinding.ActivityDoctorDetailBinding
import com.example.mobile.model.DoctorProfileDto

class DoctorDetailActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDoctorDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDoctorDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val profile = intent.getSerializableExtra("doctor_profile") as? DoctorProfileDto
        if (profile == null) {
            Toast.makeText(this, "Failed to load doctor profile details", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        bindProfileDetails(profile)
        setupListeners()
    }

    private fun bindProfileDetails(profile: DoctorProfileDto) {
        binding.tvDoctorName.text = profile.doctorName
        binding.tvSpecialization.text = profile.specialization?.uppercase() ?: "GENERAL MEDICINE"
        binding.tvExperience.text = "Practice Experience: ${profile.yearsOfExperience ?: 0} Years"
        
        binding.tvClinicName.text = if (!profile.clinicName.isNullOrBlank()) {
            profile.clinicName
        } else {
            "No Clinic Configured"
        }

        binding.tvClinicAddress.text = if (!profile.clinicAddress.isNullOrBlank()) {
            profile.clinicAddress
        } else {
            "No Address Configured"
        }

        val fee = profile.consultationFee ?: 0.0
        binding.tvConsultationFee.text = String.format("₱%,.2f", fee)

        binding.tvBio.text = if (!profile.bio.isNullOrBlank()) {
            profile.bio
        } else {
            "No biography provided."
        }

        binding.tvEducation.text = if (!profile.education.isNullOrBlank()) {
            profile.education
        } else {
            "No educational background provided."
        }
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnBookAppointment.setOnClickListener {
            Toast.makeText(
                this,
                "Consultation Scheduling: Practice availability slots loading...",
                Toast.LENGTH_LONG
            ).show()
        }
    }
}
