/**
 * FocusGuard Android Native Bridge & Platform Detection
 * 
 * Provides integration between FocusGuard web/PWA interface and 
 * Capacitor / Android Native Plugins for system-wide app blocking.
 *
 * Android Native Architecture Requirements for OS-level App Interception:
 * 1. PACKAGE_USAGE_STATS (android.permission.PACKAGE_USAGE_STATS)
 *    - To query UsageStatsManager for the current foreground running package.
 * 2. SYSTEM_ALERT_WINDOW (android.permission.SYSTEM_ALERT_WINDOW)
 *    - To draw the FocusGuard Shield lock overlay over other Android apps.
 * 3. BIND_ACCESSIBILITY_SERVICE (android.permission.BIND_ACCESSIBILITY_SERVICE)
 *    - AccessibilityService (FocusAccessibilityService) to receive instant TYPE_WINDOW_STATE_CHANGED
 *      events when any Android package is brought to foreground.
 * 4. FOREGROUND_SERVICE (android.permission.FOREGROUND_SERVICE)
 *    - Keeps the timer and blocker background service alive without being killed by Android Doze mode.
 */

export type AndroidPlatformMode = 'android-native' | 'pwa-web';

export interface PlatformCapabilities {
  mode: AndroidPlatformMode;
  isNative: boolean;
  canBlockDeviceApps: boolean;
  canShowSystemOverlay: boolean;
  canMonitorForegroundTabs: boolean;
  description: string;
}

export interface NativeBlockerPlugin {
  checkPermissions: () => Promise<{ usageStats: boolean; overlay: boolean; accessibility: boolean }>;
  requestUsageStats: () => Promise<void>;
  requestOverlayPermission: () => Promise<void>;
  openAccessibilitySettings: () => Promise<void>;
  startBlockingService: (options: { durationMinutes: number; blockedPackages: string[] }) => Promise<{ success: boolean }>;
  stopBlockingService: () => Promise<{ success: boolean }>;
  setBlockedPackages: (options: { packages: string[] }) => Promise<{ success: boolean }>;
  isServiceRunning: () => Promise<{ isRunning: boolean }>;
}

export class AndroidNativeBridgeManager {
  private isCapacitorAvailable: boolean = false;
  private isCustomBridgeAvailable: boolean = false;
  private nativePlugin: NativeBlockerPlugin | null = null;

  constructor() {
    this.detectPlatform();
  }

  public detectPlatform(): PlatformCapabilities {
    if (typeof window === 'undefined') {
      return {
        mode: 'pwa-web',
        isNative: false,
        canBlockDeviceApps: false,
        canShowSystemOverlay: false,
        canMonitorForegroundTabs: true,
        description: 'Server / Non-DOM environment',
      };
    }

    const anyWin = window as any;
    
    // Check for Capacitor native Android runtime
    const hasCapacitor = !!(
      anyWin.Capacitor &&
      typeof anyWin.Capacitor.isNativePlatform === 'function' &&
      anyWin.Capacitor.isNativePlatform() &&
      anyWin.Capacitor.getPlatform() === 'android'
    );

    // Check for custom Android WebView JavascriptInterface
    const hasAndroidBridge = !!anyWin.AndroidBridge;

    this.isCapacitorAvailable = hasCapacitor;
    this.isCustomBridgeAvailable = hasAndroidBridge;

    if (hasCapacitor || hasAndroidBridge) {
      return {
        mode: 'android-native',
        isNative: true,
        canBlockDeviceApps: true,
        canShowSystemOverlay: true,
        canMonitorForegroundTabs: true,
        description: 'Running inside Native Android container with system-level intercept capability.',
      };
    }

    return {
      mode: 'pwa-web',
      isNative: false,
      canBlockDeviceApps: false, // Normal browsers/PWAs cannot terminate external phone apps
      canShowSystemOverlay: false, // Web browsers cannot draw over external native Android apps
      canMonitorForegroundTabs: true, // PWA Focus Shield monitors tab visibility & in-app navigation
      description: 'Running as a Web App / PWA. Focus Shield protects active study tabs and in-app navigation.',
    };
  }

  public getCapabilities(): PlatformCapabilities {
    return this.detectPlatform();
  }

  public isNative(): boolean {
    return this.detectPlatform().isNative;
  }

  /**
   * Sync blocked package list to native service if running natively
   */
  public async syncBlockedPackages(packages: string[]): Promise<boolean> {
    const caps = this.detectPlatform();
    if (!caps.isNative) return false;

    try {
      const anyWin = window as any;
      if (anyWin.AndroidBridge && typeof anyWin.AndroidBridge.setBlockedPackages === 'function') {
        anyWin.AndroidBridge.setBlockedPackages(JSON.stringify(packages));
        return true;
      }
      if (anyWin.Capacitor?.Plugins?.FocusGuardNativeBlocker) {
        await anyWin.Capacitor.Plugins.FocusGuardNativeBlocker.setBlockedPackages({ packages });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Native package sync warning:', e);
      return false;
    }
  }

  /**
   * Start native background blocking service
   */
  public async startNativeBlockingService(durationMinutes: number, blockedPackages: string[]): Promise<boolean> {
    const caps = this.detectPlatform();
    if (!caps.isNative) return false;

    try {
      const anyWin = window as any;
      if (anyWin.AndroidBridge && typeof anyWin.AndroidBridge.startBlocking === 'function') {
        anyWin.AndroidBridge.startBlocking(durationMinutes, JSON.stringify(blockedPackages));
        return true;
      }
      if (anyWin.Capacitor?.Plugins?.FocusGuardNativeBlocker) {
        await anyWin.Capacitor.Plugins.FocusGuardNativeBlocker.startBlockingService({
          durationMinutes,
          blockedPackages,
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to start native blocking service:', e);
      return false;
    }
  }

  /**
   * Stop native background blocking service
   */
  public async stopNativeBlockingService(): Promise<boolean> {
    const caps = this.detectPlatform();
    if (!caps.isNative) return false;

    try {
      const anyWin = window as any;
      if (anyWin.AndroidBridge && typeof anyWin.AndroidBridge.stopBlocking === 'function') {
        anyWin.AndroidBridge.stopBlocking();
        return true;
      }
      if (anyWin.Capacitor?.Plugins?.FocusGuardNativeBlocker) {
        await anyWin.Capacitor.Plugins.FocusGuardNativeBlocker.stopBlockingService();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to stop native blocking service:', e);
      return false;
    }
  }
}

export const AndroidNativeBridge = new AndroidNativeBridgeManager();
