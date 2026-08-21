package com.focusguard.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Native Kotlin AccessibilityService for FocusGuard.
 * 
 * Intercepts foreground window state transitions and enforces app blocking
 * during active Focus Mode sessions.
 * 
 * Strict Privacy & Security:
 * - Only reads the foreground package name.
 * - Does not inspect, record, log, or transmit window content, keystrokes, or private data.
 * - Disables active inspection when Focus Mode is inactive.
 */
class FocusAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "FocusAccessibility"
        var isServiceRunning: Boolean = false
            private set
    }

    private var lastCheckedPackage: String? = null
    private var lastCheckedTimestamp: Long = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceRunning = true
        Log.i(TAG, "FocusGuard AccessibilityService connected successfully.")

        try {
            val info = AccessibilityServiceInfo().apply {
                eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                feedbackType = AccessibilityFeedbackType.FEEDBACK_GENERIC
                flags = AccessibilityServiceInfo.FLAG_DEFAULT or
                        AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
                notificationTimeout = 80
            }
            serviceInfo = info
        } catch (e: Exception) {
            Log.e(TAG, "Error configuring serviceInfo", e)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return

        // 1. Quick exit if focus mode is disabled to save CPU & battery
        if (!BlockerPreferences.isFocusActive(applicationContext)) {
            return
        }

        // 2. Debounce rapid identical events (within 300ms)
        val now = System.currentTimeMillis()
        if (packageName == lastCheckedPackage && (now - lastCheckedTimestamp) < 300L) {
            return
        }
        lastCheckedPackage = packageName
        lastCheckedTimestamp = now

        // 3. Ignore FocusGuard itself
        if (packageName == applicationContext.packageName ||
            packageName.contains("focusguard", ignoreCase = true)
        ) {
            return
        }

        // 4. Check if the foreground application is blocked
        if (BlockerPreferences.isPackageBlocked(applicationContext, packageName)) {
            Log.w(TAG, "Blocked app detected in foreground: $packageName. Enforcing FocusGuard Shield.")
            handleBlockedApp(packageName)
        }
    }

    private fun handleBlockedApp(packageName: String) {
        try {
            BlockerPreferences.setLastBlocked(applicationContext, packageName)

            // 1. Immediately launch the full-screen BlockOverlayActivity
            val remainingSecs = BlockerPreferences.getRemainingSeconds(applicationContext)
            val intent = Intent(applicationContext, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra(BlockOverlayActivity.EXTRA_PACKAGE_NAME, packageName)
                putExtra(BlockOverlayActivity.EXTRA_REMAINING_SECONDS, remainingSecs)
            }
            startActivity(intent)

            // 2. Perform BACK or HOME global action to remove focus from the blocked app
            performGlobalAction(GLOBAL_ACTION_HOME)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle blocked app: $packageName", e)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "FocusGuard AccessibilityService interrupted.")
    }

    override fun onUnbind(intent: Intent?): Boolean {
        isServiceRunning = false
        Log.i(TAG, "FocusGuard AccessibilityService unbound.")
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        isServiceRunning = false
        Log.i(TAG, "FocusGuard AccessibilityService destroyed.")
        super.onDestroy()
    }
}
