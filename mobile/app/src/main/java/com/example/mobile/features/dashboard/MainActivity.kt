package com.example.mobile.features.dashboard

import android.content.Intent
import android.os.Bundle
import android.animation.ObjectAnimator
import android.view.View
import android.animation.ValueAnimator
import androidx.appcompat.app.AppCompatActivity
import com.example.mobile.R
import com.example.mobile.features.auth.LoginActivity
import com.example.mobile.features.auth.RegisterActivity
import com.example.mobile.shared.session.SessionManager

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionManager = SessionManager(this)
        if (sessionManager.isLoggedIn()) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        findViewById<View>(R.id.btnGetStarted).setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            overridePendingTransition(R.anim.slide_up_fade_in, R.anim.fade_out)
        }

        findViewById<View>(R.id.tvSignInLink).setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            overridePendingTransition(R.anim.slide_up_fade_in, R.anim.fade_out)
        }

        applyLandingMotion()
    }

    private fun applyLandingMotion() {
        val orbCrimson = findViewById<View>(R.id.bgOrbCrimson)
        val orbSlate = findViewById<View>(R.id.bgOrbSlate)
        val orbRuby = findViewById<View>(R.id.bgOrbRuby)
        val brandBlock = findViewById<View>(R.id.heroBrandBlock)
        val statsRow = findViewById<View>(R.id.heroStatsRow)
        val previewUpcoming = findViewById<View>(R.id.heroPreviewUpcoming)
        val previewPrescription = findViewById<View>(R.id.heroPreviewPrescription)
        val previewResults = findViewById<View>(R.id.heroPreviewResults)

        listOf(orbCrimson, orbSlate, orbRuby).forEachIndexed { index, view ->
            ObjectAnimator.ofFloat(view, View.TRANSLATION_Y, 0f, if (index == 1) 12f else -12f, 0f).apply {
                duration = 5200L + index * 900L
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.REVERSE
                start()
            }
        }

        listOf(brandBlock, statsRow, previewUpcoming, previewPrescription, previewResults).forEachIndexed { index, view ->
            ObjectAnimator.ofFloat(view, View.TRANSLATION_Y, 0f, if (index % 2 == 0) -4f else 4f, 0f).apply {
                duration = 5800L + index * 500L
                repeatCount = ValueAnimator.INFINITE
                repeatMode = ValueAnimator.REVERSE
                start()
            }
        }
    }
}
