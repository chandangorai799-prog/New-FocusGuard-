import React, { useState, useEffect } from 'react';
import { Shield, Bell, Smartphone, Monitor, Flame } from 'lucide-react';
import { UserProfile, AppNotification } from '../../types';
import { AudioService } from '../../services/audioService';

interface HeaderProps {
  profile?: UserProfile;
  notifications?: AppNotification[];
  unreadCount?: number;
  streakCount?: number;
  onOpenNotifications: () => void;
  onOpenShield: () => void;
  onOpenProfile?: () => void;
  isPhoneFrame?: boolean;
  onTogglePhoneFrame?: () => void;
  isFocusActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notifications,
  unreadCount,
  streakCount,
  onOpenNotifications,
  onOpenShield,
  onOpenProfile,
  isPhoneFrame = false,
  onTogglePhoneFrame,
  isFocusActive = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const computedUnread = typeof unreadCount === 'number' ? unreadCount : (notifications || []).filter((n) => !n.read).length;
  const computedStreak = typeof streakCount === 'number' ? streakCount : (profile?.streakCount || 0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none z-30 sticky top-0">
      {/* Simulated Android Status Bar */}
      <div className="px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 font-medium tracking-tight border-b border-slate-800/40">
        <div className="flex items-center space-x-2">
          <span>{timeStr || '09:41'}</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded font-mono">
            5G
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {isFocusActive && (
            <span className="flex items-center space-x-1 text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Shield Active</span>
            </span>
          )}
          <div className="flex items-center space-x-1 text-slate-400">
            <span className="text-[10px]">100%</span>
            <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-2xs"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main FocusGuard App Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                FocusGuard
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                  AI Study
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Focus Better. Study Smarter.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Streak Badge */}
          <div
            id="header-streak-badge"
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-semibold"
            title={`${computedStreak} days active study streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{computedStreak}d</span>
          </div>

          {/* Shield Status Button */}
          <button
            id="header-shield-button"
            onClick={() => {
              AudioService.playTap();
              onOpenShield();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-blue-400 hover:text-blue-300 transition relative"
            title="Focus Shield & App Blocker Settings"
          >
            <Shield className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-slate-900"></span>
          </button>

          {/* Notifications Button */}
          <button
            id="header-notifications-button"
            onClick={() => {
              AudioService.playTap();
              onOpenNotifications();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition relative"
            title="Notifications & Study Reminders"
          >
            <Bell className="w-4 h-4" />
            {computedUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                {computedUnread}
              </span>
            )}
          </button>

          {/* User Profile Avatar / Shortcut */}
          {onOpenProfile && (
            <button
              id="header-profile-button"
              onClick={() => {
                AudioService.playTap();
                onOpenProfile();
              }}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm hover:scale-105 transition"
              title="Open Profile & Settings"
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
