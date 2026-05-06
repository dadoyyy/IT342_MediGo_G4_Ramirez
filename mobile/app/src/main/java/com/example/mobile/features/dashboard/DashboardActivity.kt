package com.example.mobile.features.dashboard

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.databinding.ActivityDashboardBinding
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.shared.session.SessionManager

class DashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDashboardBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        if (!sessionManager.isLoggedIn()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding.tvUserName.text = sessionManager.fullName().orEmpty()
        binding.tvUserEmail.text = sessionManager.email().orEmpty()
        binding.tvUserRole.text = "Role: ${sessionManager.role().orEmpty()}"

        binding.btnLogout.setOnClickListener {
            sessionManager.clearSession()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }
}
