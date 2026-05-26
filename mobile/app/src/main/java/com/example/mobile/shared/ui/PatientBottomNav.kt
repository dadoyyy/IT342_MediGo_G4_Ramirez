package com.example.mobile.shared.ui

import android.content.Intent
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.mobile.R
import com.example.mobile.features.dashboard.DashboardActivity
import com.example.mobile.features.patient.AppointmentsListActivity
import com.example.mobile.features.patient.ChatListActivity

enum class PatientBottomTab {
    HOME,
    APPOINTMENTS,
    MESSAGES,
}

fun AppCompatActivity.attachPatientBottomNav(selectedTab: PatientBottomTab? = null) {
    val content = findViewById<ViewGroup>(android.R.id.content)
    
    // Remove existing bottom nav if present
    content.findViewWithTag<View>(BOTTOM_NAV_TAG)?.let {
        content.removeView(it)
    }

    val navView = LayoutInflater.from(this).inflate(R.layout.view_patient_bottom_nav, content, false)
    navView.tag = BOTTOM_NAV_TAG

    val params = android.widget.FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
    ).apply {
        gravity = Gravity.BOTTOM
        bottomMargin = dp(0)
    }

    content.addView(navView, params)

    val homeItem = navView.findViewById<FrameLayout>(R.id.navHome)
    val appointmentsItem = navView.findViewById<FrameLayout>(R.id.navAppointments)
    val messagesItem = navView.findViewById<FrameLayout>(R.id.navMessages)

    val homeIcon = navView.findViewById<ImageView>(R.id.navHomeIcon)
    val appointmentsIcon = navView.findViewById<ImageView>(R.id.navAppointmentsIcon)
    val messagesIcon = navView.findViewById<ImageView>(R.id.navMessagesIcon)

    fun setActive(icon: ImageView, active: Boolean) {
        val colorRes = if (active) R.color.crimson else R.color.slate
        icon.imageTintList = ContextCompat.getColorStateList(this, colorRes)
    }

    setActive(homeIcon, selectedTab == PatientBottomTab.HOME)
    setActive(appointmentsIcon, selectedTab == PatientBottomTab.APPOINTMENTS)
    setActive(messagesIcon, selectedTab == PatientBottomTab.MESSAGES)

    homeItem.setOnClickListener { navigateToTab(DashboardActivity::class.java) }
    appointmentsItem.setOnClickListener { navigateToTab(AppointmentsListActivity::class.java) }
    messagesItem.setOnClickListener { navigateToTab(ChatListActivity::class.java) }
}

private fun AppCompatActivity.navigateToTab(target: Class<out AppCompatActivity>) {
    if (this::class.java == target) return

    startActivity(
        Intent(this, target).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        },
    )
    finish()
    overridePendingTransition(0, 0)
}

private fun AppCompatActivity.dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()

private const val BOTTOM_NAV_TAG = "patient_bottom_nav"
