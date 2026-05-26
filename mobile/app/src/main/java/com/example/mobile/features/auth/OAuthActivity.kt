package com.example.mobile.features.auth

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity

class OAuthActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private companion object {
        const val MOBILE_CALLBACK_URI = "medigo-app://auth/callback"
    }

    @SuppressLint("SetJavaScriptEnabled", "NewApi")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = android.widget.RelativeLayout(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT
            )
        }

        webView = WebView(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.MATCH_PARENT,
                12
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP)
            }
            isIndeterminate = true
            visibility = View.VISIBLE
        }

        root.addView(webView)
        root.addView(progressBar)
        setContentView(root)

        val googleUrl = android.net.Uri.parse(com.example.mobile.BuildConfig.BASE_URL + "oauth2/authorization/google")
            .buildUpon()
            .appendQueryParameter("redirect_uri", MOBILE_CALLBACK_URI)
            .build()
            .toString()

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return handleCallback(url)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleCallback(url)
            }
        }

        webView.loadUrl(googleUrl)
    }

    private fun handleCallback(url: String): Boolean {
        if (url.startsWith(MOBILE_CALLBACK_URI) || url.contains("/auth/callback")) {
            val uri = Uri.parse(url)
            val token = uri.getQueryParameter("token")
            val pendingToken = uri.getQueryParameter("pending")
            val error = uri.getQueryParameter("error")

            if (!error.isNullOrEmpty()) {
                val resultIntent = Intent().apply {
                    putExtra("error", error)
                }
                setResult(RESULT_CANCELED, resultIntent)
                finish()
                return true
            }

            if (!token.isNullOrEmpty()) {
                val resultIntent = Intent().apply {
                    putExtra("token", token)
                }
                setResult(RESULT_OK, resultIntent)
                finish()
                return true
            }

            if (!pendingToken.isNullOrEmpty()) {
                val resultIntent = Intent().apply {
                    putExtra("pending", pendingToken)
                }
                setResult(RESULT_OK, resultIntent)
                finish()
                return true
            }
        }
        return false
    }
}
