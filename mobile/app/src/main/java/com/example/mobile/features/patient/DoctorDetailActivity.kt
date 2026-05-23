package com.example.mobile.features.patient

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.R
import com.example.mobile.databinding.ActivityDoctorDetailBinding
import com.example.mobile.model.DoctorProfileDto

class DoctorDetailActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDoctorDetailBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDoctorDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        val profile = intent.getSerializableExtra("doctor_profile") as? DoctorProfileDto
        if (profile == null) {
            Toast.makeText(this, "Failed to load doctor profile", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        bindProfileDetails(profile)
        setupListeners(profile)
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

    private fun setupListeners(profile: DoctorProfileDto) {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnBookAppointment.setOnClickListener {
            val intent = Intent(this, BookAppointmentActivity::class.java).apply {
                putExtra("doctor_profile", profile)
            }
            startActivity(intent)
        }
    }
}
