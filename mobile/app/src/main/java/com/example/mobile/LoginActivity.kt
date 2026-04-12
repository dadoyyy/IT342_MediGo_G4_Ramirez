package com.example.mobile

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.api.ApiClient
import com.example.mobile.api.ApiErrorParser
import com.example.mobile.databinding.ActivityLoginBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.LoginRequest
import com.example.mobile.session.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        intent.getStringExtra("prefill_email")?.let { binding.etEmail.setText(it) }

        binding.btnLogin.setOnClickListener {
            submitLogin()
        }

        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }
    }

    private fun submitLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()

        if (!isValidForm(email, password)) {
            return
        }

        setLoading(true)
        ApiClient.authApi.login(LoginRequest(email, password))
            .enqueue(object : Callback<ApiEnvelope<AuthResponse>> {
                override fun onResponse(
                    call: Call<ApiEnvelope<AuthResponse>>,
                    response: Response<ApiEnvelope<AuthResponse>>
                ) {
                    setLoading(false)
                    val body = response.body()
                    if (response.isSuccessful && body?.success == true && body.data != null) {
                        val auth = body.data
                        sessionManager.saveSession(
                            token = auth.token,
                            email = auth.user.email,
                            fullName = auth.user.fullName,
                            role = auth.user.role
                        )

                        Toast.makeText(
                            this@LoginActivity,
                            "Login successful",
                            Toast.LENGTH_SHORT
                        ).show()
                        startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                        finish()
                    } else {
                        val apiMessage = body?.error?.message
                        val message = apiMessage ?: ApiErrorParser.parseMessage(
                            response.errorBody(),
                            "Invalid email or password"
                        )
                        Toast.makeText(this@LoginActivity, message, Toast.LENGTH_LONG).show()
                    }
                }

                override fun onFailure(call: Call<ApiEnvelope<AuthResponse>>, t: Throwable) {
                    setLoading(false)
                    Toast.makeText(
                        this@LoginActivity,
                        "Cannot connect to backend. Check BASE_URL/network.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            })
    }

    private fun isValidForm(email: String, password: String): Boolean {
        binding.etEmail.error = null
        binding.etPassword.error = null

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etEmail.error = "Enter a valid email"
            binding.etEmail.requestFocus()
            return false
        }

        if (password.isBlank()) {
            binding.etPassword.error = "Password is required"
            binding.etPassword.requestFocus()
            return false
        }

        return true
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnLogin.isEnabled = !isLoading
        binding.btnLogin.text = if (isLoading) "Logging in..." else "Login"
    }
}
