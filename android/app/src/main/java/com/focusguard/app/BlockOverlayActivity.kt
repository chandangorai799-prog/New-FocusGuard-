package com.focusguard.app

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.CountDownTimer
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Full-screen blocking shield activity presented when a user attempts
 * to open a restricted application during an active Focus Mode session.
 */
class BlockOverlayActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_PACKAGE_NAME = "extra_blocked_package_name"
        const val EXTRA_REMAINING_SECONDS = "extra_remaining_seconds"
    }

    private var countdownTimer: CountDownTimer? = null
    private var blockedPackage: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_block_overlay)

        blockedPackage = intent.getStringExtra(EXTRA_PACKAGE_NAME)
            ?: BlockerPreferences.getLastBlockedPackage(this)
            ?: "Restricted Application"

        setupViews()
        startTimer()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        blockedPackage = intent.getStringExtra(EXTRA_PACKAGE_NAME)
            ?: BlockerPreferences.getLastBlockedPackage(this)
            ?: "Restricted Application"
        setupViews()
    }

    private fun setupViews() {
        val tvAppName = findViewById<TextView>(R.id.tv_blocked_app_name)
        val tvPkg = findViewById<TextView>(R.id.tv_blocked_pkg)
        val btnReturn = findViewById<Button>(R.id.btn_return_focusguard)
        val btnHome = findViewById<Button>(R.id.btn_go_home)

        // Resolve friendly application label
        val appLabel = resolveAppLabel(blockedPackage)
        tvAppName.text = appLabel
        tvPkg.text = blockedPackage

        btnReturn.setOnClickListener {
            returnToFocusGuard()
        }

        btnHome.setOnClickListener {
            goToHomeScreen()
        }
    }

    private fun resolveAppLabel(packageName: String?): String {
        if (packageName.isNullOrBlank()) return "Restricted Application"
        return try {
            val pm = packageManager
            val info = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(info).toString()
        } catch (e: Exception) {
            when {
                packageName.contains("youtube", ignoreCase = true) -> "YouTube"
                packageName.contains("instagram", ignoreCase = true) -> "Instagram"
                packageName.contains("musically", ignoreCase = true) -> "TikTok"
                packageName.contains("snapchat", ignoreCase = true) -> "Snapchat"
                packageName.contains("chrome", ignoreCase = true) -> "Google Chrome"
                packageName.contains("facebook", ignoreCase = true) -> "Facebook"
                packageName.contains("twitter", ignoreCase = true) -> "X / Twitter"
                packageName.contains("reddit", ignoreCase = true) -> "Reddit"
                packageName.contains("netflix", ignoreCase = true) -> "Netflix"
                packageName.contains("pubg", ignoreCase = true) -> "PUBG / BGMI"
                packageName.contains("freefire", ignoreCase = true) -> "Free Fire"
                else -> packageName.substringAfterLast('.').replaceFirstChar { it.uppercase() }
            }
        }
    }

    private fun startTimer() {
        countdownTimer?.cancel()

        val remainingSecs = BlockerPreferences.getRemainingSeconds(this)
        if (remainingSecs <= 0L || !BlockerPreferences.isFocusActive(this)) {
            finish()
            return
        }

        val tvTimer = findViewById<TextView>(R.id.tv_remaining_time)
        tvTimer.text = formatSeconds(remainingSecs)

        countdownTimer = object : CountDownTimer(remainingSecs * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                val secs = millisUntilFinished / 1000L
                tvTimer.text = formatSeconds(secs)

                if (!BlockerPreferences.isFocusActive(this@BlockOverlayActivity)) {
                    finish()
                }
            }

            override fun onFinish() {
                tvTimer.text = "00:00"
                finish()
            }
        }.start()
    }

    private fun formatSeconds(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return if (mins >= 60) {
            val hrs = mins / 60
            val remMins = mins % 60
            String.format("%02d:%02d:%02d", hrs, remMins, secs)
        } else {
            String.format("%02d:%02d", mins, secs)
        }
    }

    private fun returnToFocusGuard() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
        finish()
    }

    private fun goToHomeScreen() {
        val startMain = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(startMain)
        finish()
    }

    override fun onBackPressed() {
        // Prevent going back into the blocked app
        goToHomeScreen()
    }

    override fun onDestroy() {
        countdownTimer?.cancel()
        super.onDestroy()
    }
}
