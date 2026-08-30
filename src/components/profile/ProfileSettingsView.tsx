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
  Code,
  Building2,
  Cpu,
  Heart,
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
  onLoadSampleDemo?: () => void;
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
  onLoadSampleDemo,
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
  const [studyReminderEnabled, setStudyReminderEnabled] = useState<boolean>(profile.studyReminderEnabled !== false);
  const [studyReminderTime, setStudyReminderTime] = useState<string>(profile.studyReminderTime || '17:00');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showLoadSampleConfirm, setShowLoadSampleConfirm] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

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
      studyReminderEnabled,
      studyReminderTime,
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

  const handleTestLockScreenNotification = async () => {
    AudioService.playTap();
    await NotificationService.requestPermission();
    NotificationService.scheduleTestLockScreenNotification(
      3,
      (remaining) => {
        setCountdown(remaining);
        if (remaining <= 0) {
          setCountdown(null);
        }
      },
      studyReminderTime
    );
  };

  const formattedReminder = NotificationService.formatTime(studyReminderTime);

  const timePresets = [
    { label: '6:00 AM', time: '06:00', icon: '🌅' },
    { label: '9:00 AM', time: '09:00', icon: '☀️' },
    { label: '2:00 PM', time: '14:00', icon: '🌤️' },
    { label: '5:00 PM', time: '17:00', icon: '🌇' },
    { label: '8:00 PM', time: '20:00', icon: '🌙' },
    { label: '10:00 PM', time: '22:00', icon: '🌌' },
  ];

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

          {/* Daily Customizable Focus Reminder & Lock Screen Notification */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 rounded-2xl border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-white">Daily Focus Reminder ({formattedReminder})</h4>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-500/30">
                    Lock Screen & Background
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 break-words mt-0.5">
                  Har roz <strong>{formattedReminder}</strong> par FocusGuard alert bhejega: <strong>"Ready to focus?"</strong>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={studyReminderEnabled}
                  onChange={(e) => setStudyReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Time Selector & Presets */}
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Notification Time:</span>
                  <input
                    type="time"
                    value={studyReminderTime}
                    onChange={(e) => setStudyReminderTime(e.target.value)}
                    className="bg-slate-900 border border-blue-500/50 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs font-bold text-blue-300">{formattedReminder}</span>
                </div>

                <button
                  type="button"
                  onClick={handleTestLockScreenNotification}
                  disabled={countdown !== null}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-[11px] font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {countdown !== null ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Lock Phone ({countdown}s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test {formattedReminder} Alert</span>
                    </>
                  )}
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {timePresets.map((preset) => {
                  const isSelected = studyReminderTime === preset.time;
                  return (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => setStudyReminderTime(preset.time)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-medium whitespace-nowrap transition flex items-center gap-1 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white">System Push Notifications</h4>
              <p className="text-[11px] text-slate-400 break-words">Allow browser and device system permission for notifications on lock screen</p>
            </div>
            <button
              type="button"
              onClick={handleTestLockScreenNotification}
              className="px-3 py-1.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600/50 transition shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Test Notification
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
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Data Management & Reset
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Zero data or load samples</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            id="btn-clear-demo"
            onClick={() => {
              AudioService.playTap();
              setShowResetConfirm(true);
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 text-xs font-bold border border-rose-800/50 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">Clear Demo Data (Zero All)</span>
          </button>

          {onLoadSampleDemo && (
            <button
              id="btn-load-sample-demo"
              onClick={() => {
                AudioService.playTap();
                setShowLoadSampleConfirm(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold border border-indigo-800/40 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">Load Sample Demo</span>
            </button>
          )}

          <button
            id="btn-replay-onboarding"
            onClick={() => {
              AudioService.playTap();
              onRestartOnboarding();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">Replay Guide</span>
          </button>
        </div>

        {resetSuccessMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {showResetConfirm && (
          <div className="p-4 bg-slate-950/95 border border-rose-500/40 rounded-2xl space-y-3 shadow-2xl">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Clear All Demo Data to Zero?</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  This will set all your tasks, focus sessions, study plans, exams, streak, and XP to <strong>0</strong> so you can start with a completely clean slate.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  AudioService.playTap();
                  setShowResetConfirm(false);
                  onResetAllData();
                  setResetSuccessMessage('All demo data cleared to 0 successfully!');
                  setTimeout(() => setResetSuccessMessage(null), 3000);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-900/40 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All to 0</span>
              </button>
            </div>
          </div>
        )}

        {showLoadSampleConfirm && (
          <div className="p-4 bg-slate-950/95 border border-indigo-500/40 rounded-2xl space-y-3 shadow-2xl">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Load Sample Demo Tasks & Exams?</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  This will populate the app with pre-built sample engineering tasks, exams, and study subjects for testing.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLoadSampleConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  AudioService.playTap();
                  setShowLoadSampleConfirm(false);
                  if (onLoadSampleDemo) onLoadSampleDemo();
                  setResetSuccessMessage('Sample demo data loaded successfully!');
                  setTimeout(() => setResetSuccessMessage(null), 3000);
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-900/40 cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Yes, Load Sample Data</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Developer & About Section */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">About FocusGuard & Developer</h3>
              <p className="text-[11px] text-slate-400">Engineering & product specifications</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
            v1.0.0
          </span>
        </div>

        {/* App & Developer Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* App Overview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">FocusGuard</h4>
                <p className="text-[11px] text-blue-300 font-medium">AI-Powered Focus & Study Companion</p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/60 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>App Name:</span>
                <span className="font-semibold text-white">FocusGuard</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Version:</span>
                <span className="font-mono text-emerald-400 font-semibold">1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Tagline:</span>
                <span className="text-slate-300 text-right truncate max-w-[170px]">AI-Powered Focus & Study Companion</span>
              </div>
            </div>
          </div>

          {/* Developer Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30 shrink-0">
                CG
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">Chandan Gorai</h4>
                <p className="text-[11px] text-indigo-300 font-medium">CG Web Solutions</p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800/60 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Developed by:</span>
                <span className="font-semibold text-white">Chandan Gorai</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Developer/Brand:</span>
                <span className="font-semibold text-indigo-300">CG Web Solutions</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Architecture:</span>
                <span className="text-slate-300">Gemini AI • React • PWA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement / Feature Highlights */}
        <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-200">FocusGuard</strong> by <strong className="text-indigo-300">CG Web Solutions</strong> helps students overcome digital distractions, master deep work cycles with intelligent timers, and turn syllabus documents into structured study schedules.
          </p>
        </div>
      </div>

      {/* App Version & Developer Footer Note */}
      <div className="text-center text-xs text-slate-500 space-y-1.5 pt-1 pb-4">
        <p className="font-semibold text-slate-400">
          FocusGuard • Version 1.0.0
        </p>
        <p className="text-[11px] text-slate-400">
          Developed by <span className="text-slate-200 font-semibold">Chandan Gorai</span> • <span className="text-indigo-300 font-medium">CG Web Solutions</span>
        </p>
        <p className="text-[10px] text-slate-600">
          AI-Powered Focus & Study Companion
        </p>
      </div>
    </div>
  );
};
