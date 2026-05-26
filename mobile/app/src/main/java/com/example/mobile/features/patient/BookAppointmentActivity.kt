package com.example.mobile.features.patient

import android.app.DatePickerDialog
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.mobile.R
import com.example.mobile.databinding.ActivityBookAppointmentBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AppointmentCreateRequest
import com.example.mobile.model.AppointmentDto
import com.example.mobile.model.DoctorProfileDto
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.ApiErrorParser
import com.example.mobile.shared.ui.PatientBottomTab
import com.example.mobile.shared.ui.attachPatientBottomNav
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class BookAppointmentActivity : AppCompatActivity() {
    private lateinit var binding: ActivityBookAppointmentBinding
    private var doctorProfile: DoctorProfileDto? = null

    private var selectedCalendar = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, 1)
    }

    private var selectedTimeSlot: String? = null
    private var selectedType: String? = null

    private val dateFormatter = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.US)
    private val isoDateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    private lateinit var slotViews: List<TextView>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBookAppointmentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)
        attachPatientBottomNav(PatientBottomTab.APPOINTMENTS)

        doctorProfile = intent.getSerializableExtra("doctor_profile") as? DoctorProfileDto
        if (doctorProfile == null) {
            Toast.makeText(this, "Failed to load doctor profile", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupDoctorSummary()
        setupViews()
        setupListeners()
        updateDateDisplay()
    }

    private fun setupDoctorSummary() {
        val doctor = doctorProfile ?: return
        binding.tvSummaryDoctorName.text = doctor.doctorName

        val fee = doctor.consultationFee ?: 0.0
        val specialization = doctor.specialization ?: "General Practice"
        binding.tvSummaryDetails.text = String.format("%s • Fee: ₱%,.2f", specialization, fee)
    }

    private fun setupViews() {
        slotViews = listOf(
            binding.slot09, binding.slot10, binding.slot11,
            binding.slot13, binding.slot14, binding.slot15,
            binding.slot16, binding.slot17
        )

        selectConsultationType("In-Clinic Consultation")
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnSelectDate.setOnClickListener {
            showDatePicker()
        }

        binding.slot09.setOnClickListener { selectTimeSlot(binding.slot09, "09:00:00") }
        binding.slot10.setOnClickListener { selectTimeSlot(binding.slot10, "10:00:00") }
        binding.slot11.setOnClickListener { selectTimeSlot(binding.slot11, "11:00:00") }
        binding.slot13.setOnClickListener { selectTimeSlot(binding.slot13, "13:00:00") }
        binding.slot14.setOnClickListener { selectTimeSlot(binding.slot14, "14:00:00") }
        binding.slot15.setOnClickListener { selectTimeSlot(binding.slot15, "15:00:00") }
        binding.slot16.setOnClickListener { selectTimeSlot(binding.slot16, "16:00:00") }
        binding.slot17.setOnClickListener { selectTimeSlot(binding.slot17, "17:00:00") }

        binding.btnTypeInClinic.setOnClickListener {
            selectConsultationType("In-Clinic Consultation")
        }
        binding.btnTypeVirtual.setOnClickListener {
            selectConsultationType("Virtual Chat")
        }

        binding.btnConfirmBooking.setOnClickListener {
            confirmBooking()
        }
    }

    private fun showDatePicker() {
        val tomorrow = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }

        val datePickerDialog = DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                selectedCalendar.set(Calendar.YEAR, year)
                selectedCalendar.set(Calendar.MONTH, month)
                selectedCalendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
                updateDateDisplay()
            },
            selectedCalendar.get(Calendar.YEAR),
            selectedCalendar.get(Calendar.MONTH),
            selectedCalendar.get(Calendar.DAY_OF_MONTH)
        )

        datePickerDialog.datePicker.minDate = tomorrow.timeInMillis
        datePickerDialog.show()
    }

    private fun updateDateDisplay() {
        binding.tvSelectedDate.text = dateFormatter.format(selectedCalendar.time)
    }

    private fun selectTimeSlot(selectedView: TextView, timeString: String) {
        selectedTimeSlot = timeString

        for (view in slotViews) {
            view.background = ContextCompat.getDrawable(this, R.drawable.bg_selectable_card)
            view.backgroundTintList = null
            view.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
        }

        selectedView.background = ContextCompat.getDrawable(this, R.drawable.bg_button_primary)
        selectedView.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(this, R.color.primary))
        selectedView.setTextColor(ContextCompat.getColor(this, R.color.white))
    }

    private fun selectConsultationType(type: String) {
        selectedType = type

        val activeBg = ContextCompat.getDrawable(this, R.drawable.bg_button_primary)
        val activeTint = ColorStateList.valueOf(ContextCompat.getColor(this, R.color.primary_accent))
        val inactiveBg = ContextCompat.getDrawable(this, R.drawable.bg_selectable_card)

        if (type == "In-Clinic Consultation") {
            binding.btnTypeInClinic.background = activeBg
            binding.btnTypeInClinic.backgroundTintList = activeTint
            binding.btnTypeInClinic.setTextColor(ContextCompat.getColor(this, R.color.white))

            binding.btnTypeVirtual.background = inactiveBg
            binding.btnTypeVirtual.backgroundTintList = null
            binding.btnTypeVirtual.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
        } else {
            binding.btnTypeVirtual.background = activeBg
            binding.btnTypeVirtual.backgroundTintList = activeTint
            binding.btnTypeVirtual.setTextColor(ContextCompat.getColor(this, R.color.white))

            binding.btnTypeInClinic.background = inactiveBg
            binding.btnTypeInClinic.backgroundTintList = null
            binding.btnTypeInClinic.setTextColor(ContextCompat.getColor(this, R.color.text_primary))
        }
    }

    private fun confirmBooking() {
        binding.tvErrorCard.visibility = View.GONE
        val doctor = doctorProfile ?: return

        if (selectedTimeSlot == null) {
            showError("Please select a time slot")
            return
        }

        val type = selectedType
        if (type == null) {
            showError("Please select consultation type")
            return
        }

        val notes = binding.etNotes.text.toString().trim()

        val dateString = isoDateFormatter.format(selectedCalendar.time)
        val appointmentAtIso = "${dateString}T${selectedTimeSlot}"

        setLoading(true)

        val request = AppointmentCreateRequest(
            doctorId = doctor.doctorId,
            appointmentAt = appointmentAtIso,
            appointmentType = type,
            notes = if (notes.isBlank()) null else notes
        )

        ApiClient.appointmentApi.createAppointment(request).enqueue(object : Callback<ApiEnvelope<AppointmentDto>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AppointmentDto>>,
                response: Response<ApiEnvelope<AppointmentDto>>
            ) {
                setLoading(false)
                val body = response.body()
                if (response.isSuccessful && body?.success == true) {
                    Toast.makeText(
                        this@BookAppointmentActivity,
                        "Appointment booked successfully!",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                } else {
                    val message = ApiErrorParser.parseMessage(response.errorBody(), "Time slot already taken. Please choose another.")
                    showError(message)
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AppointmentDto>>, t: Throwable) {
                setLoading(false)
                showError("Network offline. Please try again.")
            }
        })
    }

    private fun showError(message: String) {
        binding.tvErrorCard.text = message
        binding.tvErrorCard.visibility = View.VISIBLE
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnConfirmBooking.isEnabled = !isLoading
        binding.btnConfirmBooking.text = if (isLoading) "Booking..." else "Confirm Booking"
    }
}
