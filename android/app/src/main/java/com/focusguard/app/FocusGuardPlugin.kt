package com.focusguard.app

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.provider.Settings
import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.ByteArrayOutputStream

/**
 * FocusGuard Capacitor Plugin.
 * Provides a secure JavaScript <-> Native Kotlin bridge for app blocking,
 * accessibility detection, focus session control, and installed package queries.
 */
@CapacitorPlugin(name = "FocusGuardPlugin")
class FocusGuardPlugin : Plugin() {

    @PluginMethod
    fun enableFocusMode(call: PluginCall) {
        try {
            val durationMinutes = call.getInt("durationMinutes") ?: 25
            val packagesArray = call.getArray("blockedPackages")
            val packagesList = mutableListOf<String>()

            if (packagesArray != null) {
                for (i in 0 until packagesArray.length()) {
                    val pkg = packagesArray.getString(i)
                    if (!pkg.isNullOrBlank()) {
                        packagesList.add(pkg.trim())
                    }
                }
            }

            BlockerPreferences.enableFocusMode(context, durationMinutes, packagesList)

            val ret = JSObject().apply {
                put("success", true)
                put("durationMinutes", durationMinutes)
                put("remainingSeconds", BlockerPreferences.getRemainingSeconds(context))
                put("isFocusActive", true)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to enable focus mode: ${e.message}", e)
        }
    }

    @PluginMethod
    fun disableFocusMode(call: PluginCall) {
        try {
            BlockerPreferences.disableFocusMode(context)
            val ret = JSObject().apply {
                put("success", true)
                put("isFocusActive", false)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to disable focus mode: ${e.message}", e)
        }
    }

    @PluginMethod
    fun isFocusModeEnabled(call: PluginCall) {
        try {
            val isActive = BlockerPreferences.isFocusActive(context)
            val remainingSecs = BlockerPreferences.getRemainingSeconds(context)
            val blocked = BlockerPreferences.getBlockedPackages(context)

            val ret = JSObject().apply {
                put("isEnabled", isActive)
                put("remainingSeconds", remainingSecs)
                put("blockedCount", blocked.size)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to check focus mode status: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getBlockedApps(call: PluginCall) {
        try {
            val blockedSet = BlockerPreferences.getBlockedPackages(context)
            val jsArray = JSArray()
            blockedSet.forEach { jsArray.put(it) }

            val ret = JSObject().apply {
                put("packages", jsArray)
                put("count", blockedSet.size)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get blocked apps: ${e.message}", e)
        }
    }

    @PluginMethod
    fun setBlockedApps(call: PluginCall) {
        try {
            val packagesArray = call.getArray("packages")
            val packagesList = mutableListOf<String>()

            if (packagesArray != null) {
                for (i in 0 until packagesArray.length()) {
                    val pkg = packagesArray.getString(i)
                    if (!pkg.isNullOrBlank()) {
                        packagesList.add(pkg.trim())
                    }
                }
            }

            BlockerPreferences.setBlockedPackages(context, packagesList)

            val ret = JSObject().apply {
                put("success", true)
                put("count", packagesList.size)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to set blocked apps: ${e.message}", e)
        }
    }

    @PluginMethod
    fun isAccessibilityServiceEnabled(call: PluginCall) {
        try {
            val isEnabled = BlockerPreferences.isAccessibilityEnabled(context)
            val isRunning = FocusAccessibilityService.isServiceRunning

            val ret = JSObject().apply {
                put("isEnabled", isEnabled)
                put("isRunning", isRunning)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to check accessibility status: ${e.message}", e)
        }
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(intent)

            val ret = JSObject().apply {
                put("success", true)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to open accessibility settings: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getInstalledApps(call: PluginCall) {
        try {
            val pm = context.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }

            val launchableApps = pm.queryIntentActivities(mainIntent, 0)
            val appsArray = JSArray()

            val seenPackages = mutableSetOf<String>()

            for (resolveInfo in launchableApps) {
                val pkgName = resolveInfo.activityInfo.packageName
                if (pkgName == context.packageName || pkgName.contains("focusguard", ignoreCase = true)) {
                    continue
                }
                if (seenPackages.contains(pkgName)) {
                    continue
                }
                seenPackages.add(pkgName)

                val appName = resolveInfo.loadLabel(pm)?.toString() ?: pkgName
                val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                val appObj = JSObject().apply {
                    put("name", appName)
                    put("packageName", pkgName)
                    put("isSystemApp", isSystem)
                    put("category", categorizeApp(pkgName, appName))
                }
                appsArray.put(appObj)
            }

            val ret = JSObject().apply {
                put("apps", appsArray)
                put("totalCount", appsArray.length())
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to retrieve installed apps: ${e.message}", e)
        }
    }

    private fun categorizeApp(pkg: String, name: String): String {
        val lowerPkg = pkg.lowercase()
        val lowerName = name.lowercase()

        return when {
            lowerPkg.contains("youtube") || lowerPkg.contains("netflix") || lowerPkg.contains("video") ||
            lowerPkg.contains("spotify") || lowerPkg.contains("music") || lowerPkg.contains("hotstar") ||
            lowerName.contains("youtube") || lowerName.contains("netflix") || lowerName.contains("prime") -> "Entertainment"

            lowerPkg.contains("instagram") || lowerPkg.contains("facebook") || lowerPkg.contains("twitter") ||
            lowerPkg.contains("reddit") || lowerPkg.contains("snapchat") || lowerPkg.contains("tiktok") ||
            lowerPkg.contains("musically") || lowerName.contains("instagram") || lowerName.contains("snapchat") -> "Social"

            lowerPkg.contains("game") || lowerPkg.contains("pubg") || lowerPkg.contains("freefire") ||
            lowerPkg.contains("roblox") || lowerPkg.contains("clash") || lowerPkg.contains("candy") ||
            lowerName.contains("game") || lowerName.contains("pubg") || lowerName.contains("battle") -> "Gaming"

            lowerPkg.contains("whatsapp") || lowerPkg.contains("telegram") || lowerPkg.contains("messenger") ||
            lowerPkg.contains("discord") || lowerPkg.contains("signal") || lowerName.contains("chat") -> "Messaging"

            lowerPkg.contains("chrome") || lowerPkg.contains("browser") || lowerPkg.contains("firefox") ||
            lowerPkg.contains("opera") || lowerPkg.contains("edge") || lowerName.contains("browser") -> "Browser"

            lowerPkg.contains("amazon") || lowerPkg.contains("flipkart") || lowerPkg.contains("shopping") ||
            lowerPkg.contains("myntra") || lowerPkg.contains("meesho") -> "Shopping"

            else -> "Other"
        }
    }
}
