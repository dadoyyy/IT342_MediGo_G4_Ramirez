package com.example.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.api.ApiClient
import com.example.mobile.api.ApiErrorParser
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

        binding.tvGoToLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun submitRegistration() {
        val fullName = binding.etName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()

        if (!isValidForm(fullName, email, password)) {
            return
        }

        val nameParts = fullName.split(" ").filter { it.isNotBlank() }
        val firstname = nameParts.first()
        val lastname = nameParts.drop(1).joinToString(" ")

        setLoading(true)
        val request = RegisterRequest(
            firstname = firstname,
            lastname = lastname,
            email = email,
            password = password,
            role = "PATIENT"
        )

        ApiClient.authApi.register(request).enqueue(object : Callback<ApiEnvelope<AuthResponse>> {
            override fun onResponse(
                call: Call<ApiEnvelope<AuthResponse>>,
                response: Response<ApiEnvelope<AuthResponse>>
            ) {
                setLoading(false)
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(
                        this@RegisterActivity,
                        "Registration successful. Please login.",
                        Toast.LENGTH_LONG
                    ).show()
                    val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                    intent.putExtra("prefill_email", email)
                    startActivity(intent)
                    finish()
                } else {
                    val apiMessage = response.body()?.error?.message
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

    private fun isValidForm(fullName: String, email: String, password: String): Boolean {
        binding.etName.error = null
        binding.etEmail.error = null
        binding.etPassword.error = null

        if (fullName.isBlank()) {
            binding.etName.error = "Name is required"
            binding.etName.requestFocus()
            return false
        }

        val nameParts = fullName.split(" ").filter { it.isNotBlank() }
        if (nameParts.size < 2) {
            binding.etName.error = "Enter first and last name"
            binding.etName.requestFocus()
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

        return true
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnRegister.isEnabled = !isLoading
        binding.btnRegister.text = if (isLoading) "Registering..." else "Register"
    }
}
