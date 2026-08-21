import { StorageService } from './storage';
import { AudioService } from './audioService';

const DAILY_REMINDER_LAST_DATE_KEY = 'focusguard_daily_5pm_last_date';

export const NotificationService = {
  // Request Web & Android Notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        console.warn('Error requesting notification permission:', e);
        return false;
      }
    }
    return false;
  },

  // Check if system notifications are currently granted
  isPermissionGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  },

  // Send system notification (works on Android lock screen, heads-up banner, and background)
  async send(
    titleOrPayload: string | { title: string; message?: string; type?: any; id?: string; timestamp?: string; read?: boolean },
    options?: { body?: string; icon?: string; tag?: string; requireInteraction?: boolean; data?: any }
  ): Promise<void> {
    let title = '';
    let message = '';
    let type: any = 'system';

    if (typeof titleOrPayload === 'string') {
      title = titleOrPayload;
      message = options?.body || '';
      type = options?.tag || 'system';
    } else {
      title = titleOrPayload.title;
      message = titleOrPayload.message || '';
      type = titleOrPayload.type || 'system';
    }

    // Record in local in-app notifications
    StorageService.addNotification({
      title,
      message,
      type,
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notificationOptions: any = {
        body: message,
        icon: options?.icon || '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: options?.tag || 'focusguard-alert',
        requireInteraction: options?.requireInteraction ?? true, // Keeps notification visible on lockscreen
        vibrate: [200, 100, 200, 100, 200],
        silent: false,
        data: options?.data || { url: '/?tab=focus' },
      };

      // 1. Try sending via Service Worker Registration (Required for Android lock screen & background banners)
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              ...notificationOptions,
              actions: [
                { action: 'start_focus', title: '🎯 Start Focus' },
                { action: 'snooze_10m', title: '⏳ Snooze 10m' },
              ],
            } as any);
            return;
          }
        }
      } catch (err) {
        console.warn('ServiceWorker showNotification fallback:', err);
      }

      // 2. Fallback to standard Window Notification
      try {
        new Notification(title, notificationOptions);
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  },

  // Daily 5:00 PM (17:00) Focus Reminder trigger
  async sendDaily5PMFocusReminder(isTest: boolean = false): Promise<void> {
    const title = '🎯 FocusGuard: Ready to Focus?';
    const message = isTest
      ? '🔔 Lock Screen Test: Har shaam 5:00 baje FocusGuard ka ye alert aayega — Ready to start your deep study session!'
      : 'Shaam ke 5:00 baje ho gaye hain! 🌇 Apne study goal ko achieve karne ke liye Focus Mode start karein.';

    // Play subtle alert tone if audio context active
    try {
      AudioService.playFocusStart();
    } catch {
      // ignore
    }

    await this.send(title, {
      body: message,
      tag: 'focusguard-daily-5pm',
      requireInteraction: true,
      data: { url: '/?tab=focus' },
    });
  },

  // Test Notification with a delay so user can lock their phone or switch to another app
  scheduleTestLockScreenNotification(delaySeconds: number = 3, onCountdown?: (remaining: number) => void): () => void {
    let remaining = delaySeconds;
    if (onCountdown) onCountdown(remaining);

    const interval = setInterval(() => {
      remaining -= 1;
      if (onCountdown) onCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        this.sendDaily5PMFocusReminder(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  },

  // Check and trigger daily reminder based on User Profile setting (default 17:00 / 5 PM)
  checkDailyFocusReminder(): void {
    if (typeof window === 'undefined') return;

    try {
      const profile = StorageService.getProfile();
      // Enabled by default unless explicitly set to false
      const isReminderEnabled = profile.studyReminderEnabled !== false;
      if (!isReminderEnabled) return;

      const reminderTime = profile.studyReminderTime || '17:00'; // Default 5:00 PM (17:00)
      const [targetHourStr, targetMinStr] = reminderTime.split(':');
      const targetHour = parseInt(targetHourStr, 10);
      const targetMin = parseInt(targetMinStr, 10);

      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      // Today's date string YYYY-MM-DD
      const todayStr = now.toISOString().split('T')[0];
      const lastTriggeredDate = localStorage.getItem(DAILY_REMINDER_LAST_DATE_KEY);

      // Check if current time is within 15 minutes of scheduled reminder and not already fired today
      if (currentHour === targetHour && currentMin >= targetMin && currentMin <= targetMin + 15) {
        if (lastTriggeredDate !== todayStr) {
          localStorage.setItem(DAILY_REMINDER_LAST_DATE_KEY, todayStr);
          this.sendDaily5PMFocusReminder(false);
          console.log(`[FocusGuard] Daily ${reminderTime} focus reminder triggered for ${todayStr}`);
        }
      }
    } catch (e) {
      console.warn('Error in checkDailyFocusReminder:', e);
    }
  },

  // Start background ticker that checks for 5:00 PM reminder every 30 seconds
  startDailyReminderTicker(): () => void {
    // Initial check
    this.checkDailyFocusReminder();

    const interval = setInterval(() => {
      this.checkDailyFocusReminder();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  },

  // Schedule Pomodoro completion alert
  notifyPomodoroComplete(mode: 'focus' | 'shortBreak' | 'longBreak'): void {
    if (mode === 'focus') {
      this.send('🎉 Pomodoro Session Completed!', {
        body: 'Great work! Time for a refreshing 5-minute break. Step away from your screen.',
        tag: 'pomodoro',
      });
    } else {
      this.send('⚡ Break Finished!', {
        body: 'Your break has ended. Ready to jump into the next focus session?',
        tag: 'pomodoro',
      });
    }
  },

  // Schedule Focus Goal reached
  notifyFocusGoalReached(minutes: number): void {
    this.send('🏆 Daily Focus Goal Achieved!', {
      body: `Incredible dedication! You completed ${Math.round(minutes / 60)} hours of deep study today.`,
      tag: 'system',
    });
  },
};
