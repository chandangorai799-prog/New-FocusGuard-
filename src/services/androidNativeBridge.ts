import { registerPlugin, Capacitor } from '@capacitor/core';

/**
 * FocusGuard Capacitor Plugin Interface
 */
export interface InstalledAppInfo {
  name: string;
  packageName: string;
  isSystemApp: boolean;
  category: string;
}

export interface FocusGuardPluginInterface {
  enableFocusMode(options: { durationMinutes: number; blockedPackages?: string[] }): Promise<{
    success: boolean;
    durationMinutes: number;
    remainingSeconds: number;
    isFocusActive: boolean;
  }>;
  disableFocusMode(): Promise<{
    success: boolean;
    isFocusActive: boolean;
  }>;
  isFocusModeEnabled(): Promise<{
    isEnabled: boolean;
    remainingSeconds: number;
    blockedCount: number;
  }>;
  getBlockedApps(): Promise<{
    packages: string[];
    count: number;
  }>;
  setBlockedApps(options: { packages: string[] }): Promise<{
    success: boolean;
    count: number;
  }>;
  isAccessibilityServiceEnabled(): Promise<{
    isEnabled: boolean;
    isRunning: boolean;
  }>;
  openAccessibilitySettings(): Promise<{
    success: boolean;
  }>;
  getInstalledApps(): Promise<{
    apps: InstalledAppInfo[];
    totalCount: number;
  }>;
}

// Register native Capacitor plugin
export const FocusGuardPlugin = registerPlugin<FocusGuardPluginInterface>('FocusGuardPlugin', {
  web: {
    enableFocusMode: async () => ({
      success: true,
      durationMinutes: 25,
      remainingSeconds: 1500,
      isFocusActive: true,
    }),
    disableFocusMode: async () => ({
      success: true,
      isFocusActive: false,
    }),
    isFocusModeEnabled: async () => ({
      isEnabled: false,
      remainingSeconds: 0,
      blockedCount: 0,
    }),
    getBlockedApps: async () => ({
      packages: [],
      count: 0,
    }),
    setBlockedApps: async () => ({
      success: true,
      count: 0,
    }),
    isAccessibilityServiceEnabled: async () => ({
      isEnabled: true,
      isRunning: true,
    }),
    openAccessibilitySettings: async () => ({
      success: true,
    }),
    getInstalledApps: async () => ({
      apps: [],
      totalCount: 0,
    }),
  },
});

export type AndroidPlatformMode = 'android-native' | 'pwa-web';

export interface PlatformCapabilities {
  mode: AndroidPlatformMode;
  isNative: boolean;
  canBlockDeviceApps: boolean;
  canShowSystemOverlay: boolean;
  canMonitorForegroundTabs: boolean;
  accessibilityServiceEnabled: boolean;
  description: string;
}

export class AndroidNativeBridgeManager {
  private isNativeCache: boolean | null = null;

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
        accessibilityServiceEnabled: false,
        description: 'Server / Non-DOM environment',
      };
    }

    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    const anyWin = window as any;
    const hasAndroidBridge = !!anyWin.AndroidBridge;

    const isNative = isNativeAndroid || hasAndroidBridge;
    this.isNativeCache = isNative;

    if (isNative) {
      return {
        mode: 'android-native',
        isNative: true,
        canBlockDeviceApps: true,
        canShowSystemOverlay: true,
        canMonitorForegroundTabs: true,
        accessibilityServiceEnabled: true,
        description: 'Running as Native Android App with AccessibilityService app blocking.',
      };
    }

    return {
      mode: 'pwa-web',
      isNative: false,
      canBlockDeviceApps: false,
      canShowSystemOverlay: false,
      canMonitorForegroundTabs: true,
      accessibilityServiceEnabled: false,
      description: 'Running as Web / PWA. Full features active with client-side focus protection.',
    };
  }

  public getCapabilities(): PlatformCapabilities {
    return this.detectPlatform();
  }

  public isNative(): boolean {
    if (this.isNativeCache !== null) return this.isNativeCache;
    return this.detectPlatform().isNative;
  }

  /**
   * Check if Native Accessibility Service is enabled
   */
  public async checkAccessibilityEnabled(): Promise<{ isEnabled: boolean; isRunning: boolean }> {
    if (!this.isNative()) {
      return { isEnabled: true, isRunning: true }; // PWA fallback
    }

    try {
      return await FocusGuardPlugin.isAccessibilityServiceEnabled();
    } catch (e) {
      console.warn('Native accessibility check fallback:', e);
      return { isEnabled: false, isRunning: false };
    }
  }

  /**
   * Open Android Accessibility Settings Screen
   */
  public async openAccessibilitySettings(): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    try {
      const res = await FocusGuardPlugin.openAccessibilitySettings();
      return res.success;
    } catch (e) {
      console.warn('Failed to open accessibility settings:', e);
      return false;
    }
  }

  /**
   * Query real installed applications from Android OS
   */
  public async getInstalledApps(): Promise<InstalledAppInfo[]> {
    if (!this.isNative()) {
      return [];
    }

    try {
      const res = await FocusGuardPlugin.getInstalledApps();
      return res.apps || [];
    } catch (e) {
      console.warn('Failed to get installed apps:', e);
      return [];
    }
  }

  /**
   * Sync blocked package list to native service
   */
  public async syncBlockedPackages(packages: string[]): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      const res = await FocusGuardPlugin.setBlockedApps({ packages });
      return res.success;
    } catch (e) {
      console.warn('Native package sync error:', e);
      return false;
    }
  }

  /**
   * Start native background blocking service
   */
  public async startNativeBlockingService(durationMinutes: number, blockedPackages: string[]): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      const res = await FocusGuardPlugin.enableFocusMode({
        durationMinutes,
        blockedPackages,
      });
      return res.success;
    } catch (e) {
      console.warn('Failed to start native blocking service:', e);
      return false;
    }
  }

  /**
   * Stop native background blocking service
   */
  public async stopNativeBlockingService(): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      const res = await FocusGuardPlugin.disableFocusMode();
      return res.success;
    } catch (e) {
      console.warn('Failed to stop native blocking service:', e);
      return false;
    }
  }
}

export const AndroidNativeBridge = new AndroidNativeBridgeManager();
