import React from 'react';
import { Shield, Bell, Smartphone, Monitor, Flame, Palette } from 'lucide-react';
import { UserProfile, AppNotification } from '../../types';
import { AudioService } from '../../services/audioService';

interface HeaderProps {
  profile?: UserProfile;
  notifications?: AppNotification[];
  unreadCount?: number;
  streakCount?: number;
  onOpenNotifications: () => void;
  onOpenShield: () => void;
  onOpenThemeModal?: () => void;
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
  onOpenThemeModal,
  onOpenProfile,
  isPhoneFrame = false,
  onTogglePhoneFrame,
  isFocusActive = false,
}) => {
  const computedUnread = typeof unreadCount === 'number' ? unreadCount : (notifications || []).filter((n) => !n.read).length;
  const computedStreak = typeof streakCount === 'number' ? streakCount : (profile?.streakCount || 0);

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none z-30 sticky top-0">
      {/* Main FocusGuard App Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* App Branding & Logo */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          {/* Logo Emblem */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xs opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/15 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0 transition-transform active:scale-95">
              <Shield className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-400 drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]" />
            </div>
          </div>

          {/* Full FocusGuard Name & Subtitle - Guaranteed Single Line */}
          <div className="flex flex-col justify-center shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <h1 className="font-extrabold text-[16px] sm:text-[18px] tracking-tight text-white flex items-center leading-none whitespace-nowrap">
                <span>FocusGuard</span>
              </h1>
              {isFocusActive ? (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-md shrink-0 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-[9px] font-bold tracking-wider uppercase text-amber-300 leading-none whitespace-nowrap">
                    Active
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-400/30 rounded-md shrink-0 shadow-2xs">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[9px] font-bold tracking-wider uppercase text-blue-300 leading-none whitespace-nowrap">
                    AI
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-tight whitespace-nowrap leading-tight mt-0.5">
              Focus Better <span className="text-slate-600 mx-0.5">•</span> Study Smarter
            </p>
          </div>
        </div>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Streak Badge */}
          <div
            id="header-streak-badge"
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-[11px] sm:text-xs font-semibold shrink-0"
            title={`${computedStreak} days active study streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="whitespace-nowrap">{computedStreak}d</span>
          </div>

          {/* Shield Status Button */}
          <button
            id="header-shield-button"
            onClick={() => {
              AudioService.playTap();
              onOpenShield();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-blue-400 hover:text-blue-300 transition relative cursor-pointer shrink-0"
            title="Focus Shield & App Blocker Settings"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 ring-2 ring-slate-900"></span>
          </button>

          {/* Notifications Button */}
          <button
            id="header-notifications-button"
            onClick={() => {
              AudioService.playTap();
              onOpenNotifications();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition relative cursor-pointer shrink-0"
            title="Notifications & Study Reminders"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {computedUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 sm:min-w-4 sm:h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                {computedUnread}
              </span>
            )}
          </button>

          {/* Theme Palette Customizer Button */}
          {onOpenThemeModal && (
            <button
              id="header-theme-button"
              onClick={() => {
                AudioService.playTap();
                onOpenThemeModal();
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-amber-400 hover:text-amber-300 transition relative cursor-pointer shrink-0"
              title="Custom Themes & Colors"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* User Profile Avatar / Shortcut */}
          {onOpenProfile && (
            <button
              id="header-profile-button"
              onClick={() => {
                AudioService.playTap();
                onOpenProfile();
              }}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
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
