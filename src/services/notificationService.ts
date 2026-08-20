import { StorageService } from './storage';

export const NotificationService = {
  // Request Web Notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Send system notification
  send(titleOrPayload: string | { title: string; message?: string; type?: any; id?: string; timestamp?: string; read?: boolean }, options?: { body?: string; icon?: string; tag?: string }): void {
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
      try {
        new Notification(title, {
          body: message,
          icon: options?.icon || 'https://api.iconify.design/lucide:shield-check.svg?color=%232563eb',
          tag: options?.tag,
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
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
