package com.example.mobile.features.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.R
import com.example.mobile.features.dashboard.DashboardActivity
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.ApiErrorParser
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.databinding.ActivityRegisterBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.RegisterRequest
import com.example.mobile.shared.session.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    private var selectedRole: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, com.example.mobile.R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        binding.btnRegister.setOnClickListener {
            submitRegistration()
        }

        binding.llPatientCard.setOnClickListener {
            selectRole("PATIENT")
        }

        binding.llDoctorCard.setOnClickListener {
            selectRole("DOCTOR")
        }

        binding.btnBackToRole.setOnClickListener {
            binding.llRoleContainer.visibility = View.VISIBLE
            binding.llFormContainer.visibility = View.GONE
            selectedRole = ""
        }

        binding.btnGoogleSignUp.setOnClickListener {
            val intent = Intent(this, OAuthActivity::class.java)
            startActivityForResult(intent, 1002)
        }

        binding.tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun selectRole(role: String) {
        selectedRole = role
        binding.tvFormHeaderTitle.text = if (role == "DOCTOR") "Doctor Portal Setup" else "Patient Portal Setup"
        binding.licenseContainer.visibility = if (role == "DOCTOR") View.VISIBLE else View.GONE
        if (role != "DOCTOR") {
            binding.etLicenseNumber.text?.clear()
            binding.etLicenseNumber.error = null
        }
        binding.llRoleContainer.visibility = View.GONE
        binding.llFormContainer.visibility = View.VISIBLE
    }

    private fun submitRegistration() {
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()
        val role = selectedRole
        val licenseNumber = binding.etLicenseNumber.text.toString().trim()

        if (!isValidForm(firstName, lastName, email, password, role, licenseNumber)) {
            return
        }

        binding.tvErrorCard.visibility = View.GONE
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
                    
                    if (auth.token.isNullOrBlank()) {
                        // User needs to verify email first (Normal register flow)
                        Toast.makeText(this@RegisterActivity, "Verification email sent!", Toast.LENGTH_LONG).show()
                        val intent = Intent(this@RegisterActivity, EmailVerificationActivity::class.java).apply {
                            putExtra("email", email)
                        }
                        startActivity(intent)
                        finish()
                    } else {
                        // Auto-verified user (e.g. corporate medigo email)
                        val sessionManager = SessionManager(this@RegisterActivity)
                        sessionManager.saveSession(
                            userId = auth.user.id,
                            token = auth.token.orEmpty(),
                            email = auth.user.email,
                            fullName = auth.user.fullName,
                            role = auth.user.role
                        )
                        TokenHolder.setToken(auth.token.orEmpty())

                        Toast.makeText(this@RegisterActivity, "Registration successful", Toast.LENGTH_LONG).show()
                        startActivity(Intent(this@RegisterActivity, DashboardActivity::class.java))
                        finish()
                    }
                } else {
                    val apiMessage = body?.error?.message
                    val message = apiMessage ?: ApiErrorParser.parseMessage(
                        response.errorBody(),
                        "Registration failed. Please try again."
                    )
                    binding.tvErrorCard.text = message
                    binding.tvErrorCard.visibility = View.VISIBLE
                }
            }

            override fun onFailure(call: Call<ApiEnvelope<AuthResponse>>, t: Throwable) {
                setLoading(false)
                binding.tvErrorCard.text = "Cannot connect to backend. Check your network or server."
                binding.tvErrorCard.visibility = View.VISIBLE
            }
        })
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 1002) {
            if (resultCode == RESULT_OK && data != null) {
                val token = data.getStringExtra("token")
                val pending = data.getStringExtra("pending")

                if (!token.isNullOrEmpty()) {
                    setLoading(true)
                    TokenHolder.setToken(token)
                    ApiClient.authApi.getProfile().enqueue(object : Callback<ApiEnvelope<com.example.mobile.model.UserDto>> {
                        override fun onResponse(
                            call: Call<ApiEnvelope<com.example.mobile.model.UserDto>>,
                            response: Response<ApiEnvelope<com.example.mobile.model.UserDto>>
                        ) {
                            setLoading(false)
                            val body = response.body()
                            if (response.isSuccessful && body?.success == true && body.data != null) {
                                val user = body.data
                                val sessionManager = com.example.mobile.shared.session.SessionManager(this@RegisterActivity)
                                sessionManager.saveSession(
                                    userId = user.id,
                                    token = token,
                                    email = user.email,
                                    fullName = user.fullName,
                                    role = user.role
                                )
                                Toast.makeText(this@RegisterActivity, "Login successful", Toast.LENGTH_SHORT).show()
                                startActivity(Intent(this@RegisterActivity, DashboardActivity::class.java))
                                finish()
                            } else {
                                TokenHolder.clearToken()
                                showError("Unable to fetch user profile details.")
                            }
                        }

                        override fun onFailure(call: Call<ApiEnvelope<com.example.mobile.model.UserDto>>, t: Throwable) {
                            setLoading(false)
                            TokenHolder.clearToken()
                            showError("Cannot connect to server to fetch profile.")
                        }
                    })
                } else if (!pending.isNullOrEmpty()) {
                    if (selectedRole.isNotEmpty()) {
                        submitCompleteOAuth2(pending, selectedRole)
                    } else {
                        showRoleSelectionDialog(pending)
                    }
                }
            } else if (resultCode == RESULT_CANCELED && data != null) {
                val error = data.getStringExtra("error")
                showError(error ?: "Google Sign-Up cancelled.")
            }
        }
    }

    private fun showRoleSelectionDialog(pendingToken: String) {
        val options = arrayOf("Patient Portal", "Doctor Portal")
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Select Account Type")
            .setItems(options) { _, which ->
                val role = if (which == 0) "PATIENT" else "DOCTOR"
                submitCompleteOAuth2(pendingToken, role)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun submitCompleteOAuth2(pendingToken: String, role: String) {
        setLoading(true)
        ApiClient.authApi.completeOAuth2(com.example.mobile.model.CompleteOAuth2Request(pendingToken, role))
            .enqueue(object : Callback<ApiEnvelope<AuthResponse>> {
                override fun onResponse(
                    call: Call<ApiEnvelope<AuthResponse>>,
                    response: Response<ApiEnvelope<AuthResponse>>
                ) {
                    setLoading(false)
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true && body.data != null) {
                        val auth = body.data
                        val sessionManager = com.example.mobile.shared.session.SessionManager(this@RegisterActivity)
                        sessionManager.saveSession(
                            userId = auth.user.id,
                            token = auth.token.orEmpty(),
                            email = auth.user.email,
                            fullName = auth.user.fullName,
                            role = auth.user.role
                        )
                        TokenHolder.setToken(auth.token.orEmpty())
                        Toast.makeText(this@RegisterActivity, "Registration completed successfully!", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@RegisterActivity, DashboardActivity::class.java))
                        finish()
                    } else {
                        val message = ApiErrorParser.parseMessage(response.errorBody(), "Registration completion failed.")
                        showError(message)
                    }
                }

                override fun onFailure(call: Call<ApiEnvelope<AuthResponse>>, t: Throwable) {
                    setLoading(false)
                    showError("Cannot connect to server to complete Google registration.")
                }
            })
    }

    private fun showError(message: String) {
        binding.tvErrorCard.text = message
        binding.tvErrorCard.visibility = View.VISIBLE
    }

    private fun isValidForm(
        firstName: String, lastName: String, email: String,
        password: String, role: String, licenseNumber: String
    ): Boolean {
        binding.etFirstName.error = null
        binding.etLastName.error = null
        binding.etEmail.error = null
        binding.etPassword.error = null
        binding.etLicenseNumber.error = null
        binding.tvErrorCard.visibility = View.GONE

        if (firstName.isBlank()) { binding.etFirstName.error = "First name is required"; binding.etFirstName.requestFocus(); return false }
        if (lastName.isBlank()) { binding.etLastName.error = "Last name is required"; binding.etLastName.requestFocus(); return false }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) { binding.etEmail.error = "Enter a valid email"; binding.etEmail.requestFocus(); return false }

        val passwordRegex = Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")
        if (!passwordRegex.matches(password)) { binding.etPassword.error = "Min 8 chars, upper/lower/number/special"; binding.etPassword.requestFocus(); return false }
        if (role.isBlank()) { 
            binding.tvErrorCard.text = "Please select your Account Type (Patient or Doctor)"
            binding.tvErrorCard.visibility = View.VISIBLE
            return false 
        }
        if (role == "DOCTOR" && licenseNumber.isBlank()) { binding.etLicenseNumber.error = "License number is required for doctors"; binding.etLicenseNumber.requestFocus(); return false }

        return true
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnRegister.isEnabled = !isLoading
        binding.btnGoogleSignUp.isEnabled = !isLoading
        binding.btnRegister.text = if (isLoading) "Registering..." else "Create Account"
        if (isLoading) {
            binding.tvErrorCard.visibility = View.GONE
        }
    }
}
