package com.example.mobile.features.doctor

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mobile.R
import com.example.mobile.databinding.ActivityDoctorScheduleBinding
import com.example.mobile.databinding.DialogAddSlotBinding
import com.example.mobile.databinding.ItemScheduleSlotBinding
import com.example.mobile.shared.session.SessionManager
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class DoctorScheduleActivity : AppCompatActivity() {

    // Availability Slot Data Class
    data class DoctorSlot(
        val id: Long,
        val doctorId: Long,
        val date: String,       // yyyy-MM-dd
        val startTime: String,  // HH:mm
        val endTime: String,    // HH:mm
        val type: String,       // "In-person" or "Online"
        val status: String = "Available"
    )

    private lateinit var binding: ActivityDoctorScheduleBinding
    private lateinit var sessionManager: SessionManager
    private val gson = Gson()

    private var slotsList = mutableListOf<DoctorSlot>()
    private var dayRules = mutableListOf<String>() // 7 rules: index 0 (Sunday) to 6 (Saturday)

    private lateinit var slotsAdapter: SlotsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDoctorScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        loadScheduleData()
        setupSpinners()
        setupRecyclerView()
        setupListeners()
        updateSlotsView()
    }

    private fun loadScheduleData() {
        val sharedPrefs = getSharedPreferences("medigo_doctor_schedule", Context.MODE_PRIVATE)

        // Load Rules
        val rulesJson = sharedPrefs.getString("medigo_doctor_rules", null)
        if (rulesJson != null) {
            try {
                val type = object : TypeToken<MutableList<String>>() {}.type
                dayRules = gson.fromJson(rulesJson, type)
            } catch (e: Exception) {
                dayRules = MutableList(7) { "In-person" }
            }
        } else {
            dayRules = MutableList(7) { "In-person" }
        }

        // Load Slots
        val slotsJson = sharedPrefs.getString("medigo_doctor_slots", null)
        if (slotsJson != null) {
            try {
                val type = object : TypeToken<MutableList<DoctorSlot>>() {}.type
                slotsList = gson.fromJson(slotsJson, type)
                
                // Sort by DateTime
                sortSlots()
            } catch (e: Exception) {
                slotsList = mutableListOf()
            }
        } else {
            slotsList = mutableListOf()
        }
    }

    private fun saveScheduleData() {
        val sharedPrefs = getSharedPreferences("medigo_doctor_schedule", Context.MODE_PRIVATE)
        sharedPrefs.edit()
            .putString("medigo_doctor_rules", gson.toJson(dayRules))
            .putString("medigo_doctor_slots", gson.toJson(slotsList))
            .apply()
        
        Toast.makeText(this, "Schedule synchronized and saved successfully.", Toast.LENGTH_SHORT).show()
    }

    private fun sortSlots() {
        slotsList.sortWith(compareBy({ it.date }, { it.startTime }))
    }

    private fun setupSpinners() {
        val options = arrayOf("In-person", "Online", "Day-off")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, options).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }

        val spinners = arrayOf(
            binding.spinnerSunday,
            binding.spinnerMonday,
            binding.spinnerTuesday,
            binding.spinnerWednesday,
            binding.spinnerThursday,
            binding.spinnerFriday,
            binding.spinnerSaturday
        )

        for (i in spinners.indices) {
            spinners[i].adapter = adapter
            // Set current rule index selection
            val rule = dayRules[i]
            val index = options.indexOf(rule)
            if (index >= 0) {
                spinners[i].setSelection(index)
            }

            // Spinner Selection Listener
            spinners[i].onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                    val selectedType = options[position]
                    if (dayRules[i] != selectedType) {
                        dayRules[i] = selectedType
                        
                        // Smart Rule: Automatically clean up slots on scheduled day-off
                        if (selectedType == "Day-off") {
                            val filtered = slotsList.filter { getLocalDayOfWeek(it.date) != i }
                            if (filtered.size != slotsList.size) {
                                slotsList.clear()
                                slotsList.addAll(filtered)
                                slotsAdapter.notifyDataSetChanged()
                                updateSlotsView()
                            }
                        }
                        
                        val dayName = getDayName(i)
                        Toast.makeText(this@DoctorScheduleActivity, "$dayName set to $selectedType by default.", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
        }
    }

    private fun setupRecyclerView() {
        slotsAdapter = SlotsAdapter(slotsList) { slotToDelete ->
            slotsList.remove(slotToDelete)
            slotsAdapter.notifyDataSetChanged()
            updateSlotsView()
            Toast.makeText(this, "Slot removed.", Toast.LENGTH_SHORT).show()
        }

        binding.rvSlots.apply {
            layoutManager = LinearLayoutManager(this@DoctorScheduleActivity)
            adapter = slotsAdapter
        }
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.btnBulkGenerate.setOnClickListener {
            bulkGenerate()
        }

        binding.btnAddSlot.setOnClickListener {
            showAddSlotDialog()
        }

        binding.btnSaveSchedule.setOnClickListener {
            saveScheduleData()
        }
    }

    private fun updateSlotsView() {
        if (slotsList.isEmpty()) {
            binding.rvSlots.visibility = View.GONE
            binding.layoutEmptyState.visibility = View.VISIBLE
        } else {
            binding.rvSlots.visibility = View.VISIBLE
            binding.layoutEmptyState.visibility = View.GONE
        }
    }

    private fun bulkGenerate() {
        val newSlots = mutableListOf<DoctorSlot>()
        val baseDate = Calendar.getInstance()
        val defaultTimes = arrayOf("09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00")
        val doctorId = sessionManager.userId()

        val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)

        for (i in 1..7) {
            val d = Calendar.getInstance().apply {
                time = baseDate.time
                add(Calendar.DAY_OF_YEAR, i)
            }
            val dateStr = format.format(d.time)
            // Sunday is 1, Monday is 2, ..., Saturday is 7 in Calendar
            // We map to 0 (Sunday) to 6 (Saturday)
            val dayOfWeek = d.get(Calendar.DAY_OF_WEEK) - 1

            val rule = dayRules[dayOfWeek]
            if (rule == "Day-off") continue

            defaultTimes.forEachIndexed { index, startTime ->
                val parts = startTime.split(":")
                val hour = parts[0].toInt()
                val minutes = parts[1]
                val endTime = String.format("%02d:%s", hour + 1, minutes)

                // Check if slot already exists
                val exists = slotsList.any { it.date == dateStr && it.startTime == startTime }
                if (!exists) {
                    newSlots.add(
                        DoctorSlot(
                            id = System.currentTimeMillis() + i * 100 + index,
                            doctorId = doctorId,
                            date = dateStr,
                            startTime = startTime,
                            endTime = endTime,
                            type = rule,
                            status = "Available"
                        )
                    )
                }
            }
        }

        if (newSlots.isEmpty()) {
            Toast.makeText(this, "No new slots to generate for the coming week.", Toast.LENGTH_SHORT).show()
            return
        }

        slotsList.addAll(newSlots)
        sortSlots()
        slotsAdapter.notifyDataSetChanged()
        updateSlotsView()

        Toast.makeText(this, "Generated ${newSlots.size} slots for the coming week.", Toast.LENGTH_SHORT).show()
    }

    private fun showAddSlotDialog() {
        val dialogBinding = DialogAddSlotBinding.inflate(layoutInflater)
        val builder = AlertDialog.Builder(this)
            .setView(dialogBinding.root)
            .setCancelable(false)

        val alertDialog = builder.create()

        val dialogCalendar = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1) // Default to tomorrow
        }

        val dateFormatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        var selectedDateString: String? = null
        var selectedStartTime: String? = null
        var selectedEndTime: String? = null

        // Populate Dialog Spinner Types
        val types = arrayOf("In-person", "Online")
        val spinnerAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, types).apply {
            setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        }
        dialogBinding.spinnerDialogType.adapter = spinnerAdapter

        // Date selection
        dialogBinding.btnDialogDate.setOnClickListener {
            val datePicker = DatePickerDialog(
                this,
                { _, year, month, day ->
                    dialogCalendar.set(Calendar.YEAR, year)
                    dialogCalendar.set(Calendar.MONTH, month)
                    dialogCalendar.set(Calendar.DAY_OF_MONTH, day)
                    
                    selectedDateString = dateFormatter.format(dialogCalendar.time)
                    dialogBinding.btnDialogDate.text = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.US).format(dialogCalendar.time)
                    
                    // Smart Rule: Auto-set type when date changes
                    val dayOfWeek = dialogCalendar.get(Calendar.DAY_OF_WEEK) - 1
                    val rule = dayRules[dayOfWeek]
                    if (rule == "Online" || rule == "In-person") {
                        val index = types.indexOf(rule)
                        if (index >= 0) {
                            dialogBinding.spinnerDialogType.setSelection(index)
                        }
                    }
                },
                dialogCalendar.get(Calendar.YEAR),
                dialogCalendar.get(Calendar.MONTH),
                dialogCalendar.get(Calendar.DAY_OF_MONTH)
            )
            datePicker.datePicker.minDate = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }.timeInMillis
            datePicker.show()
        }

        // Start Time selection
        dialogBinding.btnDialogStartTime.setOnClickListener {
            val timePicker = TimePickerDialog(
                this,
                { _, hour, minute ->
                    selectedStartTime = String.format("%02d:%02d", hour, minute)
                    dialogBinding.btnDialogStartTime.text = formatTimeString(selectedStartTime!!)
                },
                9, 0, false
            )
            timePicker.show()
        }

        // End Time selection
        dialogBinding.btnDialogEndTime.setOnClickListener {
            val timePicker = TimePickerDialog(
                this,
                { _, hour, minute ->
                    selectedEndTime = String.format("%02d:%02d", hour, minute)
                    dialogBinding.btnDialogEndTime.text = formatTimeString(selectedEndTime!!)
                },
                10, 0, false
            )
            timePicker.show()
        }

        dialogBinding.btnDialogCancel.setOnClickListener {
            alertDialog.dismiss()
        }

        dialogBinding.btnDialogSubmit.setOnClickListener {
            val date = selectedDateString
            val start = selectedStartTime
            val end = selectedEndTime

            if (date == null) {
                Toast.makeText(this, "Please select a date.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (start == null || end == null) {
                Toast.makeText(this, "Please select start and end times.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (end <= start) {
                Toast.makeText(this, "End time must be after start time.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Check if day is a Day-off
            val dayOfWeek = dialogCalendar.get(Calendar.DAY_OF_WEEK) - 1
            if (dayRules[dayOfWeek] == "Day-off") {
                Toast.makeText(this, "Cannot add availability slots on your scheduled day-off.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Check duplicate
            val exists = slotsList.any { it.date == date && it.startTime == start }
            if (exists) {
                Toast.makeText(this, "A slot at this date and time already exists.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val type = types[dialogBinding.spinnerDialogType.selectedItemPosition]

            val newSlot = DoctorSlot(
                id = System.currentTimeMillis(),
                doctorId = sessionManager.userId(),
                date = date,
                startTime = start,
                endTime = end,
                type = type,
                status = "Available"
            )

            slotsList.add(newSlot)
            sortSlots()
            slotsAdapter.notifyDataSetChanged()
            updateSlotsView()
            alertDialog.dismiss()
            Toast.makeText(this, "Availability slot added.", Toast.LENGTH_SHORT).show()
        }

        alertDialog.show()
    }

    private fun getLocalDayOfWeek(dateStr: String): Int {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val date = format.parse(dateStr)
            val cal = Calendar.getInstance()
            if (date != null) {
                cal.time = date
            }
            cal.get(Calendar.DAY_OF_WEEK) - 1
        } catch (e: Exception) {
            -1
        }
    }

    private fun getDayName(index: Int): String {
        return arrayOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")[index]
    }

    // Helper functions for time formatting
    private fun formatTimeString(time: String): String {
        return try {
            val parseFormat = SimpleDateFormat("HH:mm", Locale.US)
            val displayFormat = SimpleDateFormat("h:mm a", Locale.US)
            val date = parseFormat.parse(time)
            if (date != null) displayFormat.format(date) else time
        } catch (e: Exception) {
            time
        }
    }

    // Slots RecyclerView Adapter Class
    inner class SlotsAdapter(
        private val slots: List<DoctorSlot>,
        private val onDeleteClick: (DoctorSlot) -> Unit
    ) : RecyclerView.Adapter<SlotsAdapter.SlotViewHolder>() {

        inner class SlotViewHolder(val itemBinding: ItemScheduleSlotBinding) : RecyclerView.ViewHolder(itemBinding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SlotViewHolder {
            val b = ItemScheduleSlotBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return SlotViewHolder(b)
        }

        override fun onBindViewHolder(holder: SlotViewHolder, position: Int) {
            val slot = slots[position]
            val context = holder.itemView.context

            val displayStartTime = formatTimeString(slot.startTime)
            val displayEndTime = formatTimeString(slot.endTime)
            holder.itemBinding.tvSlotTime.text = "$displayStartTime - $displayEndTime"

            // Format date beautifully
            try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val outputFormat = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.US)
                val date = inputFormat.parse(slot.date)
                if (date != null) {
                    holder.itemBinding.tvSlotDate.text = outputFormat.format(date)
                } else {
                    holder.itemBinding.tvSlotDate.text = slot.date
                }
            } catch (e: Exception) {
                holder.itemBinding.tvSlotDate.text = slot.date
            }

            // Set badge based on type
            holder.itemBinding.tvSlotTypeBadge.text = slot.type.uppercase(Locale.US)
            if (slot.type == "Online") {
                holder.itemBinding.tvSlotTypeBadge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_error)
                holder.itemBinding.tvSlotTypeBadge.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(context, R.color.primary_light))
                holder.itemBinding.tvSlotTypeBadge.setTextColor(ContextCompat.getColor(context, R.color.primary))
            } else {
                holder.itemBinding.tvSlotTypeBadge.background = ContextCompat.getDrawable(context, R.drawable.bg_status_box_success)
                holder.itemBinding.tvSlotTypeBadge.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(context, R.color.success_bg))
                holder.itemBinding.tvSlotTypeBadge.setTextColor(ContextCompat.getColor(context, R.color.success))
            }

            holder.itemBinding.btnDeleteSlot.setOnClickListener {
                onDeleteClick(slot)
            }
        }

        override fun getItemCount(): Int = slots.size
    }
}
