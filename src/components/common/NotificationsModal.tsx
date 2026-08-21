import React, { useEffect } from 'react';
import { Bell, CheckCheck, X, Sparkles, Clock, Trash2, Check } from 'lucide-react';
import { AppNotification } from '../../types';
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

  // When user opens/views the notifications modal, auto-mark unread notifications as read
  // so the red badge number clears automatically
  useEffect(() => {
    if (isOpen) {
      const hasUnread = safeNotifs.some((n) => !n.read);
      if (hasUnread) {
        StorageService.markNotificationsRead();
        onRefresh();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSendTestReminder = async () => {
    AudioService.playTap();
    await NotificationService.requestPermission();
    NotificationService.send('📚 FocusGuard Study Reminder', {
      body: 'Time for your planned deep focus study session. Your future self will thank you!',
      tag: 'task',
    });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Study Notifications</h2>
              <p className="text-[11px] text-slate-400">All notifications marked as checked</p>
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

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={handleSendTestReminder}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Send Test Alert
          </button>

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
              <p className="text-xs font-semibold">No notifications</p>
              <p className="text-[11px]">Session milestones, streak updates, and task reminders appear here.</p>
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

