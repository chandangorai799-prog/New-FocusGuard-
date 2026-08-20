import {
  BlockedApp,
  ActiveBlockingSession,
  FocusSessionState,
  AndroidPermissionKey,
  AndroidPermissionInfo,
  AndroidSystemStatus,
} from '../types';
import { StorageService, DEFAULT_BLOCKED_APPS } from './storage';
import { AudioService } from './audioService';
import { NotificationService } from './notificationService';

export interface BlockingOverlayPayload {
  app: {
    id?: string;
    name: string;
    packageName: string;
    icon?: string;
    category?: string;
  };
  remainingSeconds: number;
  sessionState: FocusSessionState;
  startTime: string;
  endTime: string;
  mode: 'focus' | 'pomodoro';
  subject?: string;
}

type SessionStateListener = (state: FocusSessionState, session: ActiveBlockingSession | null) => void;
type BlockingOverlayListener = (payload: BlockingOverlayPayload | null) => void;
type PermissionsListener = (permissions: AndroidPermissionInfo[]) => void;

class AndroidBlockerServiceManager {
  private currentSession: ActiveBlockingSession | null = null;
  private sessionListeners: Set<SessionStateListener> = new Set();
  private overlayListeners: Set<BlockingOverlayListener> = new Set();
  private permissionsListeners: Set<PermissionsListener> = new Set();
  private currentOverlayPayload: BlockingOverlayPayload | null = null;
  private timerInterval: any = null;

  // System & Android Hardware Profile (Target Android 14 API 34, Min API 24)
  private systemStatus: AndroidSystemStatus = {
    apiLevel: 34,
    androidVersion: 'Android 14 (UpsideDownCake)',
    deviceManufacturer: 'FocusGuard Android Core Engine',
    deviceModel: 'Capacitor/Native Virtual Subsystem',
    batteryOptimizationsIgnored: true,
    accessibilityServiceEnabled: true,
    usageStatsGranted: true,
    overlayGranted: true,
    notificationsGranted: true,
    dndAccessGranted: true,
    foregroundServiceRunning: false,
  };

  constructor() {
    this.initFromStorage();
    this.setupLifecycleListeners();
  }

  private initFromStorage() {
    const savedSession = StorageService.getActiveBlockingSession();
    if (savedSession) {
      // Check if session has already expired
      const now = new Date().getTime();
      const end = new Date(savedSession.endTime).getTime();
      if (now >= end || savedSession.remainingSeconds <= 0) {
        savedSession.status = 'COMPLETED';
        savedSession.remainingSeconds = 0;
        StorageService.saveActiveBlockingSession(savedSession);
      }
      this.currentSession = savedSession;
    }
  }

  private setupLifecycleListeners() {
    if (typeof window === 'undefined') return;

    // Detect browser tab / app visibility changes (simulating app switching & screen off/on)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App went to background
        if (this.isBlockingActive()) {
          this.systemStatus.foregroundServiceRunning = true;
        }
      } else {
        // App returned to foreground
        if (this.currentSession && this.currentSession.status === 'FOCUS_ACTIVE') {
          // Re-sync remaining time
          this.recalculateRemainingTime();
        }
      }
    });

    // Window blur/focus for desktop/mobile multi-window simulation
    window.addEventListener('blur', () => {
      if (this.isBlockingActive()) {
        this.systemStatus.foregroundServiceRunning = true;
      }
    });
  }

  // --- PERMISSIONS MANAGEMENT ---

  public getPermissions(): AndroidPermissionInfo[] {
    const savedStates = StorageService.getAndroidPermissionStates();

    return [
      {
        key: 'usage_stats',
        name: 'Usage Access (PACKAGE_USAGE_STATS)',
        manifestPermission: 'android.permission.PACKAGE_USAGE_STATS',
        required: true,
        isGranted: savedStates['usage_stats'] ?? true,
        description: 'Allows FocusGuard to detect in real-time when a distracting app (e.g. YouTube, Instagram) is opened in the foreground.',
        rationale: 'Without Usage Access, Android will not allow FocusGuard to see which app you are currently using, preventing the blocker from recognizing when to protect your focus.',
        settingsAction: 'android.settings.USAGE_ACCESS_SETTINGS',
        minApiLevel: 21,
      },
      {
        key: 'overlay',
        name: 'Display Over Other Apps (SYSTEM_ALERT_WINDOW)',
        manifestPermission: 'android.permission.SYSTEM_ALERT_WINDOW',
        required: true,
        isGranted: savedStates['overlay'] ?? true,
        description: 'Enables FocusGuard to display the full-screen Focus Shield overlay immediately over blocked apps to prevent access.',
        rationale: 'Required by Android to render the high-priority lock screen and "Return to Focus" shield on top of distracting applications.',
        settingsAction: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
        minApiLevel: 23,
      },
      {
        key: 'notifications',
        name: 'Post Notifications (POST_NOTIFICATIONS)',
        manifestPermission: 'android.permission.POST_NOTIFICATIONS',
        required: true,
        isGranted: savedStates['notifications'] ?? true,
        description: 'Displays a persistent foreground service notification showing live remaining study time and quick actions.',
        rationale: 'Keeps the focus timer running accurately in the background and prevents Android OS from killing the focus background service.',
        settingsAction: 'android.settings.APP_NOTIFICATION_SETTINGS',
        minApiLevel: 33,
      },
      {
        key: 'accessibility',
        name: 'Accessibility Service (BIND_ACCESSIBILITY_SERVICE)',
        manifestPermission: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        required: false,
        isGranted: savedStates['accessibility'] ?? true,
        description: 'Provides instant 0ms window state detection on Android 10, 11, 12, 13, and 14 for seamless app switching protection.',
        rationale: 'Offers enhanced instant detection when rapidly switching between apps via Android gesture navigation.',
        settingsAction: 'android.settings.ACCESSIBILITY_SETTINGS',
        minApiLevel: 29,
      },
      {
        key: 'dnd',
        name: 'Do Not Disturb Access (ACCESS_NOTIFICATION_POLICY)',
        manifestPermission: 'android.permission.ACCESS_NOTIFICATION_POLICY',
        required: false,
        isGranted: savedStates['dnd'] ?? true,
        description: 'Silences all incoming social notifications, ringtones, and banners automatically during active focus sessions.',
        rationale: 'Prevents notification popups and vibrations from breaking your deep study flow.',
        settingsAction: 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
        minApiLevel: 23,
      },
    ];
  }

  public areRequiredPermissionsGranted(): boolean {
    const permissions = this.getPermissions();
    return permissions.filter((p) => p.required).every((p) => p.isGranted);
  }

  public getMissingRequiredPermissions(): AndroidPermissionInfo[] {
    const permissions = this.getPermissions();
    return permissions.filter((p) => p.required && !p.isGranted);
  }

  public setPermissionGranted(key: AndroidPermissionKey, isGranted: boolean): void {
    StorageService.setAndroidPermissionState(key, isGranted);
    this.notifyPermissionsUpdated();
  }

  public grantAllPermissions(): void {
    const keys: AndroidPermissionKey[] = ['usage_stats', 'overlay', 'notifications', 'accessibility', 'dnd'];
    keys.forEach((k) => StorageService.setAndroidPermissionState(k, true));
    this.notifyPermissionsUpdated();
  }

  public openAndroidSettings(permissionKey: AndroidPermissionKey): void {
    const perm = this.getPermissions().find((p) => p.key === permissionKey);
    const action = perm ? perm.settingsAction : 'android.settings.SETTINGS';

    // In a native Android / Capacitor environment, dispatch native intent:
    if (typeof window !== 'undefined') {
      const anyWindow = window as any;
      if (anyWindow.AndroidBridge && anyWindow.AndroidBridge.openSettings) {
        anyWindow.AndroidBridge.openSettings(action);
        return;
      }
      if (anyWindow.Capacitor && anyWindow.Capacitor.Plugins?.AppLauncher) {
        anyWindow.Capacitor.Plugins.AppLauncher.openUrl({ url: `intent:#Intent;action=${action};end` });
        return;
      }
    }

    // Web simulation: open browser notification permission if applicable
    if (permissionKey === 'notifications' && typeof Notification !== 'undefined') {
      Notification.requestPermission().then((res) => {
        this.setPermissionGranted('notifications', res === 'granted');
      });
    }
  }

  public getSystemStatus(): AndroidSystemStatus {
    const perms = this.getPermissions();
    return {
      ...this.systemStatus,
      usageStatsGranted: perms.find((p) => p.key === 'usage_stats')?.isGranted ?? false,
      overlayGranted: perms.find((p) => p.key === 'overlay')?.isGranted ?? false,
      notificationsGranted: perms.find((p) => p.key === 'notifications')?.isGranted ?? false,
      accessibilityServiceEnabled: perms.find((p) => p.key === 'accessibility')?.isGranted ?? false,
      dndAccessGranted: perms.find((p) => p.key === 'dnd')?.isGranted ?? false,
    };
  }

  // --- SESSION LIFECYCLE MANAGEMENT ---

  public startSession(params: {
    durationMinutes: number;
    mode?: 'focus' | 'pomodoro';
    subject?: string;
    notes?: string;
    blockedPackages?: string[];
  }): { success: boolean; session?: ActiveBlockingSession; missingPermissions?: AndroidPermissionInfo[] } {
    // 1. Verify permissions
    if (!this.areRequiredPermissionsGranted()) {
      return {
        success: false,
        missingPermissions: this.getMissingRequiredPermissions(),
      };
    }

    // 2. Fetch blocked packages
    let targetPackages = params.blockedPackages;
    if (!targetPackages || targetPackages.length === 0) {
      const apps = StorageService.getBlockedApps();
      targetPackages = apps
        .filter((a) => a.isBlocked && a.packageName && !this.isProtectedPackage(a.packageName))
        .map((a) => a.packageName!);
    }

    const now = new Date();
    const durationSeconds = Math.max(1, params.durationMinutes * 60);
    const endTime = new Date(now.getTime() + durationSeconds * 1000);

    const session: ActiveBlockingSession = {
      id: 'session-' + Date.now(),
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      initialDurationMinutes: params.durationMinutes,
      remainingSeconds: durationSeconds,
      blockedPackages: targetPackages,
      status: 'FOCUS_ACTIVE',
      mode: params.mode || 'focus',
      subject: params.subject,
      notes: params.notes,
    };

    this.currentSession = session;
    StorageService.saveActiveBlockingSession(session);
    this.systemStatus.foregroundServiceRunning = true;

    // Start background tick
    this.startSessionTimer();

    // Trigger persistent notification
    NotificationService.send({
      id: 'notif-focus-active-' + Date.now(),
      title: 'FocusGuard — Focus Mode Active 🛡️',
      message: `${params.durationMinutes} min study session started. ${targetPackages.length} distracting apps locked.`,
      type: 'focus',
      timestamp: now.toISOString(),
      read: false,
    });

    this.notifySessionStateChanged();
    return { success: true, session };
  }

  public pauseSession(): void {
    if (!this.currentSession || this.currentSession.status !== 'FOCUS_ACTIVE') return;

    this.currentSession.status = 'PAUSED';
    StorageService.saveActiveBlockingSession(this.currentSession);
    this.stopSessionTimer();
    this.dismissBlockingOverlay();
    this.notifySessionStateChanged();
  }

  public resumeSession(): void {
    if (!this.currentSession || this.currentSession.status !== 'PAUSED') return;

    // Recalculate end time based on remaining seconds
    const now = new Date();
    const end = new Date(now.getTime() + this.currentSession.remainingSeconds * 1000);
    this.currentSession.endTime = end.toISOString();
    this.currentSession.status = 'FOCUS_ACTIVE';

    StorageService.saveActiveBlockingSession(this.currentSession);
    this.startSessionTimer();
    this.notifySessionStateChanged();
  }

  public updateRemainingSeconds(seconds: number): void {
    if (!this.currentSession) return;
    this.currentSession.remainingSeconds = Math.max(0, seconds);
    if (this.currentSession.remainingSeconds <= 0 && this.currentSession.status === 'FOCUS_ACTIVE') {
      this.completeSession();
    } else {
      StorageService.saveActiveBlockingSession(this.currentSession);
      if (this.currentOverlayPayload) {
        this.currentOverlayPayload.remainingSeconds = this.currentSession.remainingSeconds;
        this.notifyOverlayUpdated();
      }
    }
  }

  public completeSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'COMPLETED';
    this.currentSession.remainingSeconds = 0;
    StorageService.saveActiveBlockingSession(this.currentSession);
    this.stopSessionTimer();
    this.dismissBlockingOverlay();
    this.systemStatus.foregroundServiceRunning = false;

    // Play chime & notification
    AudioService.playCompletionChime();
    NotificationService.send({
      id: 'notif-focus-complete-' + Date.now(),
      title: 'Focus Session Completed! 🏆',
      message: `Great job! Your ${this.currentSession.initialDurationMinutes}m focus session is complete. Apps unlocked.`,
      type: 'focus',
      timestamp: new Date().toISOString(),
      read: false,
    });

    this.notifySessionStateChanged();
  }

  public cancelSession(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'CANCELLED';
    StorageService.saveActiveBlockingSession(this.currentSession);
    this.stopSessionTimer();
    this.dismissBlockingOverlay();
    this.systemStatus.foregroundServiceRunning = false;

    this.notifySessionStateChanged();
  }

  public resetSessionToIdle(): void {
    this.currentSession = null;
    StorageService.clearActiveBlockingSession();
    this.stopSessionTimer();
    this.dismissBlockingOverlay();
    this.notifySessionStateChanged();
  }

  public getSessionState(): FocusSessionState {
    return this.currentSession ? this.currentSession.status : 'IDLE';
  }

  public getCurrentSession(): ActiveBlockingSession | null {
    return this.currentSession;
  }

  public isBlockingActive(): boolean {
    return this.currentSession !== null && this.currentSession.status === 'FOCUS_ACTIVE';
  }

  // --- FOREGROUND APP MONITORING & BLOCK ENFORCEMENT ---

  /**
   * Called by native Android bridge or test simulation when an app enters the foreground.
   */
  public onForegroundAppChanged(packageName: string, appName?: string): { blocked: boolean; reason?: string } {
    // 1. Never block FocusGuard itself
    if (this.isProtectedPackage(packageName)) {
      this.dismissBlockingOverlay();
      return { blocked: false, reason: 'FocusGuard is protected' };
    }

    // 2. Only block when session is in FOCUS_ACTIVE state
    if (!this.isBlockingActive()) {
      return { blocked: false, reason: 'Focus session is not active' };
    }

    // 3. Verify permissions are available
    if (!this.areRequiredPermissionsGranted()) {
      return { blocked: false, reason: 'Required Android permissions missing' };
    }

    // 4. Check if package is in blocked list
    const isPackageBlocked = this.currentSession?.blockedPackages.some(
      (pkg) => pkg.toLowerCase() === packageName.toLowerCase()
    );

    if (isPackageBlocked) {
      // Find full app metadata
      const allApps = StorageService.getBlockedApps();
      const matchedApp = allApps.find((a) => a.packageName?.toLowerCase() === packageName.toLowerCase()) || {
        name: appName || packageName,
        packageName: packageName,
        icon: '🛑',
        category: 'Distraction',
      };

      // Trigger High-Priority Blocking Overlay
      this.triggerBlockingOverlay({
        app: {
          id: (matchedApp as any).id,
          name: matchedApp.name,
          packageName: matchedApp.packageName || packageName,
          icon: (matchedApp as any).icon || '🛑',
          category: (matchedApp as any).category || 'Distraction',
        },
        remainingSeconds: this.currentSession!.remainingSeconds,
        sessionState: this.currentSession!.status,
        startTime: this.currentSession!.startTime,
        endTime: this.currentSession!.endTime,
        mode: this.currentSession!.mode,
        subject: this.currentSession!.subject,
      });

      // Play alert sound
      AudioService.playNotification();

      return { blocked: true, reason: `${matchedApp.name} is blocked during this active Focus Session.` };
    } else {
      // Allowed app (e.g. calculator, notes, educational app)
      this.dismissBlockingOverlay();
      return { blocked: false, reason: 'App is permitted' };
    }
  }

  /**
   * Simulates launching or switching to an application.
   */
  public simulateLaunchApp(app: BlockedApp | { name: string; packageName: string; icon?: string }): {
    blocked: boolean;
    message: string;
  } {
    const pkg = app.packageName || `com.app.${app.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const result = this.onForegroundAppChanged(pkg, app.name);

    if (result.blocked) {
      return {
        blocked: true,
        message: `🛡️ FocusGuard Blocked: "${app.name}" (${pkg}) is restricted during your active focus session.`,
      };
    } else {
      return {
        blocked: false,
        message: this.isBlockingActive()
          ? `✅ "${app.name}" is allowed during your study session.`
          : `ℹ️ "${app.name}" launched. FocusGuard is currently ${this.getSessionState()}.`,
      };
    }
  }

  public triggerBlockingOverlay(payload: BlockingOverlayPayload): void {
    this.currentOverlayPayload = payload;
    this.notifyOverlayUpdated();
  }

  public dismissBlockingOverlay(): void {
    if (this.currentOverlayPayload !== null) {
      this.currentOverlayPayload = null;
      this.notifyOverlayUpdated();
    }
  }

  public getCurrentOverlayPayload(): BlockingOverlayPayload | null {
    return this.currentOverlayPayload;
  }

  // --- TIMER & BACKGROUND ENGINE ---

  private startSessionTimer() {
    this.stopSessionTimer();
    this.timerInterval = setInterval(() => {
      if (!this.currentSession || this.currentSession.status !== 'FOCUS_ACTIVE') {
        this.stopSessionTimer();
        return;
      }

      const newRemaining = this.currentSession.remainingSeconds - 1;
      if (newRemaining <= 0) {
        this.completeSession();
      } else {
        this.currentSession.remainingSeconds = newRemaining;
        StorageService.saveActiveBlockingSession(this.currentSession);
        if (this.currentOverlayPayload) {
          this.currentOverlayPayload.remainingSeconds = newRemaining;
          this.notifyOverlayUpdated();
        }
      }
    }, 1000);
  }

  private stopSessionTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private recalculateRemainingTime() {
    if (!this.currentSession || this.currentSession.status !== 'FOCUS_ACTIVE') return;

    const now = new Date().getTime();
    const end = new Date(this.currentSession.endTime).getTime();
    const diffSeconds = Math.max(0, Math.round((end - now) / 1000));

    if (diffSeconds <= 0) {
      this.completeSession();
    } else {
      this.currentSession.remainingSeconds = diffSeconds;
      StorageService.saveActiveBlockingSession(this.currentSession);
      this.notifySessionStateChanged();
    }
  }

  private isProtectedPackage(pkg: string): boolean {
    const normalized = (pkg || '').toLowerCase();
    return (
      normalized.includes('focusguard') ||
      normalized === 'com.focusguard.study' ||
      normalized === 'com.focusguard.app' ||
      normalized === 'com.android.settings' ||
      normalized === 'com.google.android.packageinstaller'
    );
  }

  // --- SUBSCRIPTIONS ---

  public subscribeToSessionState(listener: SessionStateListener): () => void {
    this.sessionListeners.add(listener);
    listener(this.getSessionState(), this.currentSession);
    return () => this.sessionListeners.delete(listener);
  }

  public subscribeToBlockingOverlay(listener: BlockingOverlayListener): () => void {
    this.overlayListeners.add(listener);
    listener(this.currentOverlayPayload);
    return () => this.overlayListeners.delete(listener);
  }

  public subscribeToPermissions(listener: PermissionsListener): () => void {
    this.permissionsListeners.add(listener);
    listener(this.getPermissions());
    return () => this.permissionsListeners.delete(listener);
  }

  private notifySessionStateChanged() {
    const state = this.getSessionState();
    this.sessionListeners.forEach((l) => l(state, this.currentSession));
  }

  private notifyOverlayUpdated() {
    this.overlayListeners.forEach((l) => l(this.currentOverlayPayload));
  }

  private notifyPermissionsUpdated() {
    const perms = this.getPermissions();
    this.permissionsListeners.forEach((l) => l(perms));
  }
}

export const AndroidBlockerService = new AndroidBlockerServiceManager();
