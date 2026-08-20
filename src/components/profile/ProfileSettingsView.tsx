import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Settings,
  Bell,
  Volume2,
  Shield,
  Smartphone,
  Sparkles,
  RotateCcw,
  Check,
  Award,
  BookOpen,
  Clock,
  Trash2,
  Info,
  ExternalLink,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { UserProfile, FocusSettings, PomodoroSettings, StudyTimePreference } from '../../types';
import { AudioService } from '../../services/audioService';
import { NotificationService } from '../../services/notificationService';
import { THEME_PRESETS } from '../../services/themeService';

interface ProfileSettingsViewProps {
  profile: UserProfile;
  focusSettings: FocusSettings;
  pomodoroSettings: PomodoroSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateFocusSettings: (settings: FocusSettings) => void;
  onUpdatePomodoroSettings: (settings: PomodoroSettings) => void;
  onResetAllData: () => void;
  onRestartOnboarding: () => void;
  onOpenShield?: () => void;
  onOpenThemeModal?: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  profile,
  focusSettings,
  pomodoroSettings,
  onUpdateProfile,
  onUpdateFocusSettings,
  onUpdatePomodoroSettings,
  onResetAllData,
  onRestartOnboarding,
  onOpenShield,
  onOpenThemeModal,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [primarySubject, setPrimarySubject] = useState<string>(profile.primarySubject || '');
  const [targetHours, setTargetHours] = useState<number>((profile.dailyStudyTargetMinutes || 180) / 60);
  const [pomodoroTarget, setPomodoroTarget] = useState<number>(profile.dailyPomodoroTarget || 6);
  const [preferredTime, setPreferredTime] = useState<StudyTimePreference>(profile.preferredStudyTime || 'Evening');

  const [soundEnabled, setSoundEnabled] = useState<boolean>(focusSettings.soundEnabled ?? true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(focusSettings.hapticFeedback ?? true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    AudioService.playTap();

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim() || 'Alex Chen',
      primarySubject: primarySubject.trim() || 'General Studies',
      dailyStudyTargetMinutes: Math.round(targetHours * 60),
      dailyPomodoroTarget: pomodoroTarget,
      preferredStudyTime: preferredTime,
    };

    onUpdateProfile(updatedProfile);

    const updatedFocus: FocusSettings = {
      ...focusSettings,
      soundEnabled,
      hapticFeedback: hapticEnabled,
    };
    onUpdateFocusSettings(updatedFocus);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestNotification = async () => {
    AudioService.playTap();
    await NotificationService.requestPermission();
    NotificationService.send('🛡️ FocusGuard Notification Test', {
      body: 'Notifications are working! You will receive focus milestone and study reminders.',
      tag: 'test',
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 shrink-0" />
          <span>Profile & Preferences</span>
        </h2>
        <p className="text-xs text-slate-400 break-words">Manage your study goals, audio, and Android shield settings</p>
      </div>

      {/* User Profile Card */}
      <form
        onSubmit={handleSaveProfile}
        className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center space-x-3.5 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30 shrink-0">
            {name.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate">{name || 'Student'}</h3>
            <p className="text-xs text-blue-300 font-medium truncate">
              {primarySubject || 'FocusGuard Scholar'} • {profile.streakCount} Day Streak 🔥
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Primary Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Primary Subject / Focus Field
            </label>
            <input
              type="text"
              value={primarySubject}
              onChange={(e) => setPrimarySubject(e.target.value)}
              placeholder="e.g. Computer Science, Medicine"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Daily Study Goal */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Daily Study Target</label>
              <span className="text-xs font-bold text-blue-400">{targetHours}h / day</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={targetHours}
              onChange={(e) => setTargetHours(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Daily Pomodoro Target */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Daily Pomodoro Target
            </label>
            <select
              value={pomodoroTarget}
              onChange={(e) => setPomodoroTarget(parseInt(e.target.value) || 6)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="4">4 Sessions (2 hours)</option>
              <option value="6">6 Sessions (3 hours)</option>
              <option value="8">8 Sessions (4 hours)</option>
              <option value="12">12 Sessions (6 hours)</option>
            </select>
          </div>

          {/* Preferred Study Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Preferred Study Time
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value as StudyTimePreference)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Morning">Morning 🌅</option>
              <option value="Afternoon">Afternoon ☀️</option>
              <option value="Evening">Evening 🌇</option>
              <option value="Night">Night Owl 🌙</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-4 h-4" /> Preferences saved!
            </span>
          )}
          <div className="flex-1" />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Theme & Visual Atmosphere */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Theme & Visual Appearance
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-blue-400 capitalize px-2 py-0.5 bg-blue-950 border border-blue-800/50 rounded-full">
            {profile.theme || 'Midnight'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white">Custom Theme & Atmosphere Studio</h4>
            <p className="text-[11px] text-slate-400">
              Personalize color schemes, dark/light styles, and custom accent glow.
            </p>
          </div>
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={() => {
                AudioService.playTap();
                onOpenThemeModal();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize Theme</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio & Haptic Controls */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Audio & Sensory Feedback
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">Focus & Break Chimes</h4>
              <p className="text-[11px] text-slate-400 break-words">Synthesized acoustic bells on session milestones</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">Haptic Vibration</h4>
              <p className="text-[11px] text-slate-400 break-words">Tactile haptic pulse on mobile devices</p>
            </div>
            <input
              type="checkbox"
              checked={hapticEnabled}
              onChange={(e) => setHapticEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Android Shield & System Notifications */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Android Platform Capabilities
            </h3>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            Ready for APK Build
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Custom App Blocker Card */}
          <div className="p-3.5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
                  <span>Custom App Blocker</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                    {profile.blockedAppsCount || 20} apps
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 break-words">
                  Select and block any apps of your choice (Instagram, Games, YouTube, etc.)
                </p>
              </div>
            </div>
            {onOpenShield && (
              <button
                type="button"
                onClick={() => {
                  AudioService.playTap();
                  onOpenShield();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Configure
              </button>
            )}
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white">Push Notifications</h4>
              <p className="text-[11px] text-slate-400 break-words">Send test notification to verify browser/device support</p>
            </div>
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3 py-1.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600/50 transition shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Test Alert
            </button>
          </div>

          {/* PWA & Mobile App Section */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-semibold text-white">Progressive Web App (PWA)</h4>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded border border-emerald-500/30">
                  Offline Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 break-words mt-0.5">
                Install directly to your Android, iOS, or PC Home Screen. Works 100% offline with zero APK install steps.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                AudioService.playTap();
                const { pwaService } = await import('../../services/pwaService');
                if (pwaService.canInstall()) {
                  await pwaService.promptInstall();
                } else {
                  alert('To install FocusGuard on Android/Desktop: Tap browser menu (⋮) and choose "Install app" or "Add to Home Screen". On iPhone: Tap Share ⎋ -> "Add to Home Screen".');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-900/30 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install to Device</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1 text-xs text-slate-400">
            <p className="font-semibold text-slate-300">PWA & Offline Architecture:</p>
            <p className="text-[11px] break-words">
              FocusGuard features a built-in Service Worker (<code>sw.js</code>), Web App Manifest, offline local storage persistence, and standalone display support for an authentic app experience.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & Onboarding Reset */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          App Management & Reset
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              AudioService.playTap();
              onRestartOnboarding();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">Replay Onboarding Guide</span>
          </button>

          <button
            onClick={() => {
              AudioService.playTap();
              if (
                confirm(
                  'Are you sure you want to reset all focus session history, study plans, and tasks to default demo state?'
                )
              ) {
                onResetAllData();
              }
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold border border-rose-800/40 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* App Version Info */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold">FocusGuard • Version 2.0.0 (Android Native Ready)</p>
        <p className="text-[11px] break-words">Focus Better. Study Smarter. Built with Gemini AI & Modern React.</p>
      </div>
    </div>
  );
};
