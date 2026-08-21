package com.focusguard.app

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityManager

/**
 * Native preferences manager for FocusGuard.
 * Persists active focus session state and blocked application package names across 
 * app restarts, system doze mode, and background transitions.
 */
object BlockerPreferences {
    private const val PREFS_NAME = "focusguard_native_blocker_prefs"
    private const val KEY_FOCUS_ENABLED = "key_focus_mode_enabled"
    private const val KEY_FOCUS_END_TIME_MS = "key_focus_end_time_ms"
    private const val KEY_FOCUS_DURATION_MINUTES = "key_focus_duration_minutes"
    private const val KEY_BLOCKED_PACKAGES = "key_blocked_packages"
    private const val KEY_LAST_BLOCKED_PACKAGE = "key_last_blocked_package"
    private const val KEY_LAST_BLOCKED_TIMESTAMP = "key_last_blocked_timestamp"

    // Default popular distractions
    private val DEFAULT_BLOCKED = setOf(
        "com.google.android.youtube",
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.snapchat.android",
        "com.facebook.katana",
        "com.twitter.android",
        "com.reddit.frontpage",
        "com.netflix.mediaclient",
        "com.pubg.imobile",
        "com.dts.freefireth"
    )

    private fun getPrefs(context: Context): SharedPreferences {
        return context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Enables or updates native focus mode session.
     */
    fun enableFocusMode(
        context: Context,
        durationMinutes: Int,
        blockedPackages: List<String>? = null
    ) {
        val prefs = getPrefs(context)
        val now = System.currentTimeMillis()
        val durationMs = (durationMinutes.coerceAtLeast(1) * 60L * 1000L)
        val endTimeMs = now + durationMs

        val editor = prefs.edit()
            .putBoolean(KEY_FOCUS_ENABLED, true)
            .putLong(KEY_FOCUS_END_TIME_MS, endTimeMs)
            .putInt(KEY_FOCUS_DURATION_MINUTES, durationMinutes)

        if (blockedPackages != null && blockedPackages.isNotEmpty()) {
            editor.putStringSet(KEY_BLOCKED_PACKAGES, blockedPackages.toSet())
        }

        editor.apply()
    }

    /**
     * Disables focus mode session.
     */
    fun disableFocusMode(context: Context) {
        getPrefs(context).edit()
            .putBoolean(KEY_FOCUS_ENABLED, false)
            .putLong(KEY_FOCUS_END_TIME_MS, 0L)
            .apply()
    }

    /**
     * Checks if focus mode is currently active and within time limit.
     */
    fun isFocusActive(context: Context): Boolean {
        val prefs = getPrefs(context)
        val isEnabled = prefs.getBoolean(KEY_FOCUS_ENABLED, false)
        if (!isEnabled) return false

        val endTimeMs = prefs.getLong(KEY_FOCUS_END_TIME_MS, 0L)
        val now = System.currentTimeMillis()
        if (now >= endTimeMs) {
            // Auto expire
            disableFocusMode(context)
            return false
        }
        return true
    }

    /**
     * Returns remaining focus session seconds.
     */
    fun getRemainingSeconds(context: Context): Long {
        val prefs = getPrefs(context)
        val isEnabled = prefs.getBoolean(KEY_FOCUS_ENABLED, false)
        if (!isEnabled) return 0L

        val endTimeMs = prefs.getLong(KEY_FOCUS_END_TIME_MS, 0L)
        val diffMs = endTimeMs - System.currentTimeMillis()
        return (diffMs / 1000L).coerceAtLeast(0L)
    }

    /**
     * Returns current blocked package names.
     */
    fun getBlockedPackages(context: Context): Set<String> {
        val prefs = getPrefs(context)
        return prefs.getStringSet(KEY_BLOCKED_PACKAGES, DEFAULT_BLOCKED) ?: DEFAULT_BLOCKED
    }

    /**
     * Updates blocked package list.
     */
    fun setBlockedPackages(context: Context, packages: List<String>) {
        val cleanSet = packages
            .map { it.trim().lowercase() }
            .filter { it.isNotEmpty() && !it.contains("focusguard") }
            .toSet()

        getPrefs(context).edit()
            .putStringSet(KEY_BLOCKED_PACKAGES, cleanSet)
            .apply()
    }

    /**
     * Checks whether a given package is in the blocked list.
     */
    fun isPackageBlocked(context: Context, packageName: String?): Boolean {
        if (packageName.isNullOrBlank()) return false
        val cleanPkg = packageName.trim().lowercase()

        // Never block FocusGuard or critical system packages
        if (cleanPkg.contains("focusguard") ||
            cleanPkg == context.packageName ||
            cleanPkg == "com.focusguard.app" ||
            cleanPkg == "com.android.settings" ||
            cleanPkg == "com.google.android.packageinstaller" ||
            cleanPkg.contains("systemui") ||
            cleanPkg.contains("launcher")
        ) {
            return false
        }

        val blockedSet = getBlockedPackages(context)
        return blockedSet.any { it.equals(cleanPkg, ignoreCase = true) }
    }

    /**
     * Records last blocked package to prevent rapid re-trigger loops.
     */
    fun setLastBlocked(context: Context, packageName: String) {
        getPrefs(context).edit()
            .putString(KEY_LAST_BLOCKED_PACKAGE, packageName)
            .putLong(KEY_LAST_BLOCKED_TIMESTAMP, System.currentTimeMillis())
            .apply()
    }

    fun getLastBlockedPackage(context: Context): String? {
        return getPrefs(context).getString(KEY_LAST_BLOCKED_PACKAGE, null)
    }

    /**
     * Detects if FocusAccessibilityService is currently enabled in Android OS Settings.
     */
    fun isAccessibilityEnabled(context: Context): Boolean {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
            ?: return false
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        val myServiceClass = FocusAccessibilityService::class.java.name
        val myPackage = context.packageName

        return enabledServices.any { service ->
            val info = service.resolveInfo?.serviceInfo
            info != null && info.packageName == myPackage && info.name == myServiceClass
        }
    }
}
