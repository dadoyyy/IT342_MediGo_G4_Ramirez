package com.example.mobile.features.doctor

import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.databinding.ActivityDoctorProfileBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.model.DoctorProfileUpsertRequest
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.ApiErrorParser
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DoctorProfileActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDoctorProfileBinding

    private val specializations = listOf(
        "Select Specialization",
        "General Medicine",
        "Cardiology",
        "Pediatrics",
        "Dermatology",
        "Internal Medicine",
        "Neurology",
        "Orthopedics",
        "Psychiatry",
        "Ophthalmology",
        "Obstetrics & Gynecology"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDoctorProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupSpinner()
        loadExistingProfile()

        binding.btnSaveProfile.setOnClickListener {
            saveProfile()
        }
    }

    private fun setupSpinner() {
        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            specializations
        ).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }
        binding.spinnerSpecialization.adapter = adapter
    }

    private fun loadExistingProfile() {
        setLoading(true)
        binding.tvErrorCard.visibility = View.GONE

        ApiClient.appointmentApi.getMyDoctorProfile().enqueue(object : Callback<ApiEnvelope<DoctorProfileDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<DoctorProfileDto>>,
                response: Response<ApiEnvelope<DoctorProfileDto>>
            ) {
                setLoading(false)
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    prefillForm(body.data)
                } else if (response.code() == 404) {
                    // Profile not created yet - let user complete a new one
                    Toast.makeText(this@DoctorProfileActivity, "Complete your profile to get started", Toast.LENGTH_SHORT).show()
                } else {
                    val message = ApiErrorParser.parseMessage(response.errorBody(), "Failed to load profile details")
                    showError(message)
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<DoctorProfileDto>>, t: Throwable) {
                setLoading(false)
                showError("Network offline. Unable to load profile details.")
            }
        })
    }

    private fun prefillForm(profile: DoctorProfileDto) {
        val specIndex = specializations.indexOf(profile.specialization.orEmpty())
        if (specIndex >= 0) {
            binding.spinnerSpecialization.setSelection(specIndex)
        }

        binding.etExperience.setText(profile.yearsOfExperience?.toString() ?: "")
        binding.etConsultationFee.setText(profile.consultationFee?.toString() ?: "")
        binding.etClinicName.setText(profile.clinicName ?: "")
        binding.etClinicAddress.setText(profile.clinicAddress ?: "")
        binding.etBio.setText(profile.bio ?: "")
        binding.etEducation.setText(profile.education ?: "")
    }

    private fun saveProfile() {
        val specPosition = binding.spinnerSpecialization.selectedItemPosition
        val specialization = if (specPosition > 0) specializations[specPosition] else ""
        val experienceStr = binding.etExperience.text.toString().trim()
        val feeStr = binding.etConsultationFee.text.toString().trim()
        val clinicName = binding.etClinicName.text.toString().trim()
        val clinicAddress = binding.etClinicAddress.text.toString().trim()
        val bio = binding.etBio.text.toString().trim()
        val education = binding.etEducation.text.toString().trim()

        binding.tvErrorCard.visibility = View.GONE
        
        // Field Validations
        if (specialization.isBlank()) {
            showError("Please select your medical specialization")
            return
        }
        if (experienceStr.isBlank()) {
            binding.etExperience.error = "Years of experience is required"
            binding.etExperience.requestFocus()
            return
        }
        if (feeStr.isBlank()) {
            binding.etConsultationFee.error = "Consultation fee is required"
            binding.etConsultationFee.requestFocus()
            return
        }
        if (clinicName.isBlank()) {
            binding.etClinicName.error = "Clinic Name is required"
            binding.etClinicName.requestFocus()
            return
        }
        if (clinicAddress.isBlank()) {
            binding.etClinicAddress.error = "Clinic Address is required"
            binding.etClinicAddress.requestFocus()
            return
        }

        val yearsOfExperience = experienceStr.toIntOrNull()
        val consultationFee = feeStr.toDoubleOrNull()

        setLoading(true)
        val request = DoctorProfileUpsertRequest(
            specialization = specialization,
            clinicName = clinicName,
            clinicAddress = clinicAddress,
            bio = if (bio.isBlank()) null else bio,
            yearsOfExperience = yearsOfExperience,
            education = if (education.isBlank()) null else education,
            consultationFee = consultationFee
        )

        ApiClient.appointmentApi.upsertDoctorProfile(request).enqueue(object : Callback<ApiEnvelope<DoctorProfileDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<DoctorProfileDto>>,
                response: Response<ApiEnvelope<DoctorProfileDto>>
            ) {
                setLoading(false)
                val body = response.body()
                if (response.isSuccessful && body?.success == true) {
                    Toast.makeText(this@DoctorProfileActivity, "Practice Profile Saved successfully!", Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    val message = ApiErrorParser.parseMessage(response.errorBody(), "Failed to save profile changes")
                    showError(message)
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<DoctorProfileDto>>, t: Throwable) {
                setLoading(false)
                showError("Network connection lost. Please try again.")
            }
        })
    }

    private fun showError(message: String) {
        binding.tvErrorCard.text = message
        binding.tvErrorCard.visibility = View.VISIBLE
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnSaveProfile.isEnabled = !isLoading
        binding.btnSaveProfile.text = if (isLoading) "Saving Details..." else "Save Practice Profile"
    }
}
