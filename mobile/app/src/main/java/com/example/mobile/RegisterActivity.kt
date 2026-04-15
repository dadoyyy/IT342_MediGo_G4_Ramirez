package com.example.mobile

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.api.ApiClient
import com.example.mobile.api.ApiErrorParser
import com.example.mobile.api.TokenHolder
import com.example.mobile.databinding.ActivityRegisterBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.RegisterRequest
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            submitRegistration()
        }

        binding.rgRole.setOnCheckedChangeListener { _, checkedId ->
            val isDoctor = checkedId == R.id.rbDoctor
            binding.licenseContainer.visibility = if (isDoctor) View.VISIBLE else View.GONE
            if (!isDoctor) {
                binding.etLicenseNumber.text?.clear()
                binding.etLicenseNumber.error = null
            }
        }

        binding.tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun submitRegistration() {
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        val role = when (binding.rgRole.checkedRadioButtonId) {
            R.id.rbPatient -> "PATIENT"
            R.id.rbDoctor -> "DOCTOR"
            else -> ""
        }
        val licenseNumber = binding.etLicenseNumber.text.toString().trim()

        if (!isValidForm(firstName, lastName, email, password, role, licenseNumber)) {
            return
        }

        setLoading(true)
        val request = RegisterRequest(
            firstname = firstName,
            lastname = lastName,
            email = email,
            password = password,
            role = role,
            licenseNumber = if (role == "DOCTOR") licenseNumber else null
        )

        ApiClient.authApi.register(request).enqueue(object : Callback<ApiEnvelope<AuthResponse>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AuthResponse>>,
                response: Response<ApiEnvelope<AuthResponse>>
            ) {
                setLoading(false)
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.data != null) {
                    val auth = body.data
                    val sessionManager = com.example.mobile.session.SessionManager(this@RegisterActivity)
                    sessionManager.saveSession(
                        token = auth.token,
                        email = auth.user.email,
                        fullName = auth.user.fullName,
                        role = auth.user.role
                    )
                    TokenHolder.setToken(auth.token)

                    Toast.makeText(
                        this@RegisterActivity,
                        "Registration successful",
                        Toast.LENGTH_LONG
                    ).show()
                    startActivity(Intent(this@RegisterActivity, DashboardActivity::class.java))
                    finish()
                } else {
                    val apiMessage = body?.error?.message
                    val message = apiMessage ?: ApiErrorParser.parseMessage(
                        response.errorBody(),
                        "Registration failed. Please try again."
                    )
                    Toast.makeText(this@RegisterActivity, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AuthResponse>>, t: Throwable) {
                setLoading(false)
                Toast.makeText(
                    this@RegisterActivity,
                    "Cannot connect to backend. Check BASE_URL/network.",
                    Toast.LENGTH_LONG
                ).show()
            }
        })
    }

    private fun isValidForm(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        role: String,
        licenseNumber: String
    ): Boolean {
        binding.etFirstName.error = null
        binding.etLastName.error = null
        binding.etEmail.error = null
        binding.etPassword.error = null
        binding.etLicenseNumber.error = null

        if (firstName.isBlank()) {
            binding.etFirstName.error = "First name is required"
            binding.etFirstName.requestFocus()
            return false
        }

        if (lastName.isBlank()) {
            binding.etLastName.error = "Last name is required"
            binding.etLastName.requestFocus()
            return false
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etEmail.error = "Enter a valid email"
            binding.etEmail.requestFocus()
            return false
        }

        val passwordRegex = Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")
        if (!passwordRegex.matches(password)) {
            binding.etPassword.error = "Min 8 chars, upper/lower/number/special"
            binding.etPassword.requestFocus()
            return false
        }

        if (role.isBlank()) {
            Toast.makeText(this, "Please select a role", Toast.LENGTH_SHORT).show()
            return false
        }

        if (role == "DOCTOR" && licenseNumber.isBlank()) {
            binding.etLicenseNumber.error = "License number is required for doctors"
            binding.etLicenseNumber.requestFocus()
            return false
        }

        return true
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnRegister.isEnabled = !isLoading
        binding.btnRegister.text = if (isLoading) "Registering..." else "Register"
    }
}
