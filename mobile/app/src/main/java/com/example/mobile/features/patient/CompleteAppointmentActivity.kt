package com.example.mobile.features.patient

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.databinding.ActivityCompleteAppointmentBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.AppointmentStatusUpdateRequest
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.ApiErrorParser
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream

class CompleteAppointmentActivity : AppCompatActivity() {
    private lateinit var binding: ActivityCompleteAppointmentBinding
    private var appointment: AppointmentDto? = null
    private var uploadedDocUrl: String? = null

    companion object {
        private const val REQUEST_CODE_PDF = 4221
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCompleteAppointmentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        appointment = intent.getSerializableExtra("appointment_extra") as? AppointmentDto
        if (appointment == null) {
            Toast.makeText(this, "Failed to load appointment details", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupPatientDetails()
        setupListeners()
    }

    private fun setupPatientDetails() {
        val app = appointment ?: return
        binding.tvPatientName.text = app.patientName
        
        val age = app.patientAge ?: 24
        val gender = app.patientGender ?: "MALE"
        val medium = app.appointmentType ?: "General Consultation"
        binding.tvPatientDetails.text = "Age: $age • Gender: $gender • Consultation: $medium"
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnSelectPdf.setOnClickListener {
            selectPdfFile()
        }

        binding.btnSubmitComplete.setOnClickListener {
            finalizeConsultation()
        }
    }

    private fun selectPdfFile() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "application/pdf"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        startActivityForResult(Intent.createChooser(intent, "Select Prescription PDF"), REQUEST_CODE_PDF)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CODE_PDF && resultCode == Activity.RESULT_OK) {
            val uri = data?.data ?: return
            uploadPdfDocument(uri)
        }
    }

    private fun uploadPdfDocument(uri: Uri) {
        val multipart = getMultipartFromFileUri(uri)
        if (multipart == null) {
            showError("Unable to open the selected PDF file.")
            return
        }

        binding.tvSelectedFileName.text = "Preparing file upload..."
        binding.pbUpload.visibility = View.VISIBLE
        binding.tvUploadStatus.visibility = View.GONE
        binding.btnSubmitComplete.isEnabled = false

        ApiClient.appointmentApi.uploadConsultationDoc(multipart).enqueue(object : Callback<ApiEnvelope<String>> {
            override fun onResponse(call: Call<ApiEnvelope<String>>, response: Response<ApiEnvelope<String>>) {
                binding.pbUpload.visibility = View.GONE
                binding.btnSubmitComplete.isEnabled = true

                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    uploadedDocUrl = body.data
                    binding.tvSelectedFileName.text = "prescription_signed.pdf"
                    binding.tvUploadStatus.text = "Ready to complete"
                    binding.tvUploadStatus.visibility = View.VISIBLE
                } else {
                    binding.tvSelectedFileName.text = "Upload failed"
                    Toast.makeText(this@CompleteAppointmentActivity, "Unable to upload PDF prescription", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<String>>, t: Throwable) {
                binding.pbUpload.visibility = View.GONE
                binding.btnSubmitComplete.isEnabled = true
                binding.tvSelectedFileName.text = "Network error"
                Toast.makeText(this@CompleteAppointmentActivity, "Network offline: Upload failed", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun getMultipartFromFileUri(uri: Uri): MultipartBody.Part? {
        return try {
            val inputStream = contentResolver.openInputStream(uri) ?: return null
            val tempFile = File(cacheDir, "prescription_signed.pdf")
            val outputStream = FileOutputStream(tempFile)
            inputStream.use { input ->
                outputStream.use { output ->
                    input.copyTo(output)
                }
            }
            val requestFile = RequestBody.create(
                "application/pdf".toMediaTypeOrNull(),
                tempFile
            )
            MultipartBody.Part.createFormData("file", tempFile.name, requestFile)
        } catch (e: Exception) {
            null
        }
    }

    private fun finalizeConsultation() {
        binding.tvErrorCard.visibility = View.GONE
        val app = appointment ?: return

        val notes = binding.etMedicalNotes.text.toString().trim()
        if (notes.isBlank()) {
            showError("Please enter your diagnosis notes and prescriptions")
            return
        }

        val followUp = binding.etFollowUp.text.toString().trim()

        binding.btnSubmitComplete.isEnabled = false
        binding.btnSubmitComplete.text = "Finalizing..."

        val request = AppointmentStatusUpdateRequest(
            status = "COMPLETED",
            medicalNotes = notes,
            followUpAt = if (followUp.isNotBlank()) followUp else null,
            documentUrls = if (uploadedDocUrl != null) listOf(uploadedDocUrl!!) else null
        )

        ApiClient.appointmentApi.updateAppointmentStatus(app.id, request).enqueue(object : Callback<ApiEnvelope<AppointmentDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AppointmentDto>>,
                response: Response<ApiEnvelope<AppointmentDto>>
            ) {
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(
                        this@CompleteAppointmentActivity,
                        "Consultation summary successfully generated and signed!",
                        Toast.LENGTH_LONG
                    ).show()
                    setResult(Activity.RESULT_OK)
                    finish()
                } else {
                    binding.btnSubmitComplete.isEnabled = true
                    binding.btnSubmitComplete.text = "Finalize Consultation & Sign"
                    val message = ApiErrorParser.parseMessage(response.errorBody(), "Unable to finalize consultation report.")
                    showError(message)
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AppointmentDto>>, t: Throwable) {
                binding.btnSubmitComplete.isEnabled = true
                binding.btnSubmitComplete.text = "Finalize Consultation & Sign"
                showError("Network offline. Unable to complete consultation summary.")
            }
        })
    }

    private fun showError(message: String) {
        binding.tvErrorCard.text = message
        binding.tvErrorCard.visibility = View.VISIBLE
    }
}
