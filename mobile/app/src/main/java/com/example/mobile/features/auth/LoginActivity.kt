package com.example.mobile.features.auth

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.R
import com.example.mobile.features.dashboard.DashboardActivity
import com.example.mobile.shared.api.ApiClient
import com.example.mobile.shared.api.ApiErrorParser
import com.example.mobile.shared.api.TokenHolder
import com.example.mobile.databinding.ActivityLoginBinding
import com.example.mobile.model.ApiEnvelope
import com.example.mobile.model.AuthResponse
import com.example.mobile.model.LoginRequest
import com.example.mobile.model.UserDto
import com.example.mobile.shared.session.SessionManager
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
        setFinishOnTouchOutside(true)

        val fadeInUp = android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in_up)
        binding.root.startAnimation(fadeInUp)

        binding.backdrop.setOnClickListener {
            finish()
            overridePendingTransition(0, R.anim.slide_down_fade_out)
        }

        sessionManager = SessionManager(this)
        intent.getStringExtra("prefill_email")?.let { binding.etEmail.setText(it) }

        binding.btnLogin.setOnClickListener {
            submitLogin()
        }

        binding.btnGoogleSignIn.setOnClickListener {
            val intent = Intent(this, OAuthActivity::class.java)
            startActivityForResult(intent, 1001)
        }

        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            overridePendingTransition(R.anim.slide_up_fade_in, R.anim.fade_out)
            finish()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 1001) {
            if (resultCode == RESULT_OK && data != null) {
                val token = data.getStringExtra("token")
                val pending = data.getStringExtra("pending")

                if (!token.isNullOrEmpty()) {
                    setLoading(true)
                    TokenHolder.setToken(token)
                    ApiClient.authApi.getProfile().enqueue(object : Callback<ApiEnvelope<UserDto>> {
                        override fun onResponse(
                            call: Call<ApiEnvelope<UserDto>>,
                            response: Response<ApiEnvelope<UserDto>>
                        ) {
                            setLoading(false)
                            val body = response.body()
                            if (response.isSuccessful && body?.success == true && body.data != null) {
                                val user = body.data
                                // Only allow PATIENT role on mobile app
                                if (user.role.uppercase() != "PATIENT") {
                                    TokenHolder.clearToken()
                                    binding.tvErrorCard.text = "This app is for patients only. Doctors and admins should use the web portal."
                                    binding.tvErrorCard.visibility = android.view.View.VISIBLE
                                    return
                                }
                                sessionManager.saveSession(
                                    userId = user.id,
                                    token = token,
                                    email = user.email,
                                    fullName = user.fullName,
                                    role = user.role
                                )
                                Toast.makeText(this@LoginActivity, "Welcome back!", Toast.LENGTH_SHORT).show()
                                startActivity(Intent(this@LoginActivity, DashboardActivity::class.java).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                                })
                                finish()
                            } else {
                                TokenHolder.clearToken()
                                binding.tvErrorCard.text = "Google Sign-In failed: Unable to fetch profile."
                                binding.tvErrorCard.visibility = android.view.View.VISIBLE
                            }
                        }

                        override fun onFailure(call: Call<ApiEnvelope<UserDto>>, t: Throwable) {
                            setLoading(false)
                            TokenHolder.clearToken()
                            binding.tvErrorCard.text = "Cannot connect to server."
                            binding.tvErrorCard.visibility = android.view.View.VISIBLE
                        }
                    })
                } else if (!pending.isNullOrEmpty()) {
                    binding.tvErrorCard.text = "This Google account is not registered. Please sign up first."
                    binding.tvErrorCard.visibility = android.view.View.VISIBLE
                }
            } else if (resultCode == RESULT_CANCELED && data != null) {
                val error = data.getStringExtra("error")
                binding.tvErrorCard.text = error ?: "Google Sign-In cancelled."
                binding.tvErrorCard.visibility = android.view.View.VISIBLE
            }
        }
    }

    private fun submitLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString()

        if (!isValidForm(email, password)) {
            return
        }

        binding.tvErrorCard.visibility = android.view.View.GONE
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

                        // Only allow PATIENT role on mobile app
                        if (auth.user.role.uppercase() != "PATIENT") {
                            binding.tvErrorCard.text = "This app is for patients only. Doctors and admins should use the web portal."
                            binding.tvErrorCard.visibility = android.view.View.VISIBLE
                            return
                        }

                        sessionManager.saveSession(
                            userId = auth.user.id,
                            token = auth.token.orEmpty(),
                            email = auth.user.email,
                            fullName = auth.user.fullName,
                            role = auth.user.role
                        )
                        TokenHolder.setToken(auth.token.orEmpty())

                        Toast.makeText(this@LoginActivity, "Welcome back!", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@LoginActivity, DashboardActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        })
                        finish()
                    } else {
                        val apiMessage = body?.error?.message
                        val message = apiMessage ?: ApiErrorParser.parseMessage(
                            response.errorBody(),
                            "Invalid email or password"
                        )
                        binding.tvErrorCard.text = message
                        binding.tvErrorCard.visibility = android.view.View.VISIBLE
                    }
                }

                override fun onFailure(call: Call<ApiEnvelope<AuthResponse>>, t: Throwable) {
                    setLoading(false)
                    binding.tvErrorCard.text = "Cannot connect to server. Check your network."
                    binding.tvErrorCard.visibility = android.view.View.VISIBLE
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
        binding.btnGoogleSignIn.isEnabled = !isLoading
        binding.btnLogin.text = if (isLoading) "Signing in..." else "Access Portal"
        if (isLoading) {
            binding.tvErrorCard.visibility = android.view.View.GONE
        }
    }
}
