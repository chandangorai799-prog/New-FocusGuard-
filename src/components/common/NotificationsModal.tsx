import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, X, Sparkles, Clock, Trash2, Check, Smartphone, Flame, ShieldAlert, Timer } from 'lucide-react';
import { AppNotification, UserProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { AudioService } from '../../services/audioService';
import { NotificationService } from '../../services/notificationService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}) => {
  const safeNotifs = notifications || [];
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(NotificationService.isPermissionGranted());

  // When user opens/views the notifications modal, auto-mark unread notifications as read
  // so the red badge number clears automatically
  useEffect(() => {
    if (isOpen) {
      setProfile(StorageService.getProfile());
      setPermissionGranted(NotificationService.isPermissionGranted());
      const hasUnread = safeNotifs.some((n) => !n.read);
      if (hasUnread) {
        StorageService.markNotificationsRead();
        onRefresh();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleReminder = (enabled: boolean) => {
    AudioService.playTap();
    const updated = {
      ...profile,
      studyReminderEnabled: enabled,
      studyReminderTime: profile.studyReminderTime || '17:00',
    };
    setProfile(updated);
    StorageService.saveProfile(updated);
  };

  const handleTimeChange = (newTime: string) => {
    AudioService.playTap();
    const updated = {
      ...profile,
      studyReminderEnabled: true,
      studyReminderTime: newTime,
    };
    setProfile(updated);
    StorageService.saveProfile(updated);
  };

  const handleTestLockScreenAlert = async () => {
    AudioService.playTap();
    const granted = await NotificationService.requestPermission();
    setPermissionGranted(granted);

    // 3-second countdown so user can lock phone or switch apps to test
    NotificationService.scheduleTestLockScreenNotification(
      3,
      (remaining) => {
        setCountdown(remaining);
        if (remaining <= 0) {
          setCountdown(null);
          onRefresh();
        }
      },
      profile.studyReminderTime || '17:00'
    );
  };

  const handleMarkAllRead = () => {
    AudioService.playTap();
    StorageService.markNotificationsRead();
    onRefresh();
  };

  const handleClearAll = () => {
    AudioService.playTap();
    StorageService.saveNotifications([]);
    onRefresh();
  };

  const handleNotificationClick = (notifId: string) => {
    const notifs = StorageService.getNotifications().map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    StorageService.saveNotifications(notifs);
    onRefresh();
  };

  const formattedReminderTime = NotificationService.formatTime(profile.studyReminderTime || '17:00');

  const timePresets = [
    { label: '6:00 AM', time: '06:00', icon: '🌅' },
    { label: '9:00 AM', time: '09:00', icon: '☀️' },
    { label: '2:00 PM', time: '14:00', icon: '🌤️' },
    { label: '5:00 PM', time: '17:00', icon: '🌇' },
    { label: '8:00 PM', time: '20:00', icon: '🌙' },
    { label: '10:00 PM', time: '22:00', icon: '🌌' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Study Notifications</h2>
              <p className="text-[11px] text-slate-400">Lock Screen & Customizable Focus Reminders</p>
            </div>
          </div>
          <button
            onClick={() => {
              AudioService.playTap();
              // Ensure all read on close as well
              StorageService.markNotificationsRead();
              onRefresh();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Custom Focus & Lock Screen Reminder Banner */}
        <div className="p-3.5 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border-b border-blue-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Timer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Daily Focus Reminder</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded border border-emerald-500/30">
                    {profile.studyReminderEnabled !== false ? `${formattedReminderTime} Active` : 'Off'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Har roz <strong>{formattedReminderTime}</strong> par alert: <strong>"Ready to focus?"</strong>
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={profile.studyReminderEnabled !== false}
                onChange={(e) => handleToggleReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Time Selector & Presets */}
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-blue-900/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Notification Ka Exact Time:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={profile.studyReminderTime || '17:00'}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-slate-900 border border-blue-500/50 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {timePresets.map((preset) => {
                const isSelected = (profile.studyReminderTime || '17:00') === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleTimeChange(preset.time)}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-medium whitespace-nowrap transition flex items-center gap-1 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lock Screen Test Button */}
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Lock screen & background alert: <strong>{permissionGranted ? 'Granted 🟢' : 'Needs Permission 🔔'}</strong>
              </span>
            </div>

            <button
              onClick={handleTestLockScreenAlert}
              disabled={countdown !== null}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 text-white text-[11px] font-bold shadow-md shadow-blue-900/30 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {countdown !== null ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Lock Phone Now ({countdown}s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test {formattedReminderTime} Alert</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Recent Alerts History:</span>

          <div className="flex items-center gap-3">
            {safeNotifs.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {safeNotifs.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <Bell className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-semibold">No notification history</p>
              <p className="text-[11px]">Daily 5:00 PM focus alerts, streak milestones, and task reminders appear here.</p>
            </div>
          ) : (
            safeNotifs.map((notif) => {
              const time = new Date(notif.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id)}
                  className={`p-3.5 rounded-2xl border transition space-y-1 cursor-pointer select-none ${
                    notif.read
                      ? 'bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      : 'bg-blue-950/30 border-blue-800/50 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                      )}
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-3.5">{notif.message}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Badge count cleared
          </span>
          <button
            onClick={() => {
              AudioService.playTap();
              StorageService.markNotificationsRead();
              onRefresh();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

