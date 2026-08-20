import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  Coffee,
  Brain,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PomodoroSettings, FocusSessionRecord, UserProfile } from '../../types';
import { AudioService } from '../../services/audioService';
import { NotificationService } from '../../services/notificationService';
import { AndroidBlockerService } from '../../services/androidBlockerService';

interface PomodoroViewProps {
  settings: PomodoroSettings;
  profile: UserProfile;
  sessions: FocusSessionRecord[];
  onRecordSession: (session: Omit<FocusSessionRecord, 'id'>) => void;
  onUpdateSettings: (settings: PomodoroSettings) => void;
  onFocusStateChange?: (isActive: boolean) => void;
}

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  settings,
  profile,
  sessions,
  onRecordSession,
  onUpdateSettings,
  onFocusStateChange,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [totalCompletedToday, setTotalCompletedToday] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Custom durations state
  const [focusMin, setFocusMin] = useState<number>(settings.focusDuration || 25);
  const [shortBreakMin, setShortBreakMin] = useState<number>(settings.shortBreakDuration || 5);
  const [longBreakMin, setLongBreakMin] = useState<number>(settings.longBreakDuration || 15);
  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(settings.autoStartBreaks || false);
  const [autoStartFocus, setAutoStartFocus] = useState<boolean>(settings.autoStartFocus || false);

  const getDurationForMode = (m: PomodoroMode) => {
    if (m === 'focus') return focusMin * 60;
    if (m === 'shortBreak') return shortBreakMin * 60;
    return longBreakMin * 60;
  };

  const [timeLeft, setTimeLeft] = useState<number>(focusMin * 60);
  const timerRef = useRef<any>(null);

  // Sync today's pomodoro count
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const safeSessions = sessions || [];
    const poms = safeSessions.filter((s) => s.date === today && s.mode === 'pomodoro' && s.completed).length;
    setTotalCompletedToday(poms);
  }, [sessions]);

  // Sync focus state
  useEffect(() => {
    onFocusStateChange?.(isRunning && mode === 'focus');
  }, [isRunning, mode, onFocusStateChange]);

  // Timer Tick Engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleModeCompletion();
            return 0;
          }
          const nextVal = prev - 1;
          if (mode === 'focus') {
            AndroidBlockerService.updateRemainingSeconds(nextVal);
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, sessionCount, focusMin, shortBreakMin, longBreakMin, autoStartBreaks, autoStartFocus]);

  const handleModeCompletion = () => {
    if (mode === 'focus') {
      AudioService.playCompletionChime();
      NotificationService.notifyPomodoroComplete('focus');
      AndroidBlockerService.completeSession();

      // Record completed Pomodoro
      onRecordSession({
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: focusMin,
        mode: 'pomodoro',
        subject: profile.primarySubject || 'Pomodoro Study',
        completed: true,
      });

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}

      // Transition to break
      if (sessionCount >= (settings.longBreakInterval || 4)) {
        setMode('longBreak');
        setTimeLeft(longBreakMin * 60);
        setSessionCount(1);
        setIsRunning(autoStartBreaks);
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakMin * 60);
        setSessionCount((prev) => prev + 1);
        setIsRunning(autoStartBreaks);
      }
    } else {
      // Break finished
      AudioService.playBreakChime();
      NotificationService.notifyPomodoroComplete(mode);
      setMode('focus');
      setTimeLeft(focusMin * 60);
      setIsRunning(autoStartFocus);
      if (autoStartFocus) {
        AndroidBlockerService.startSession({
          durationMinutes: focusMin,
          mode: 'pomodoro',
          subject: profile.primarySubject || 'Pomodoro Study',
        });
      }
    }
  };

  const handleStart = () => {
    AudioService.playFocusStart();
    setIsRunning(true);
    if (mode === 'focus') {
      AndroidBlockerService.startSession({
        durationMinutes: focusMin,
        mode: 'pomodoro',
        subject: profile.primarySubject || 'Pomodoro Study',
      });
    }
  };

  const handlePause = () => {
    AudioService.playTap();
    setIsRunning(false);
    if (mode === 'focus') {
      AndroidBlockerService.pauseSession();
    }
  };

  const handleReset = () => {
    AudioService.playTap();
    setIsRunning(false);
    if (mode === 'focus') {
      AndroidBlockerService.resetSessionToIdle();
    }
    setTimeLeft(getDurationForMode(mode));
  };

  const handleSkip = () => {
    AudioService.playTap();
    setIsRunning(false);
    if (mode === 'focus') {
      AndroidBlockerService.cancelSession();
      setMode('shortBreak');
      setTimeLeft(shortBreakMin * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusMin * 60);
    }
  };

  const switchModeManually = (newMode: PomodoroMode) => {
    AudioService.playTap();
    setIsRunning(false);
    if (mode === 'focus') {
      AndroidBlockerService.cancelSession();
    }
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
  };

  const handleSaveSettings = () => {
    AudioService.playTap();
    const updated: PomodoroSettings = {
      ...settings,
      focusDuration: focusMin,
      shortBreakDuration: shortBreakMin,
      longBreakDuration: longBreakMin,
      autoStartBreaks,
      autoStartFocus,
    };
    onUpdateSettings(updated);
    setShowSettingsModal(false);
    setTimeLeft(getDurationForMode(mode));
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentDurationSecs = getDurationForMode(mode);
  const progressPercent = Math.min(100, Math.max(0, ((currentDurationSecs - timeLeft) / currentDurationSecs) * 100));

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header & Settings */}
      <div className="w-full flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 truncate">
            Pomodoro Studio
          </h2>
          <p className="text-xs text-slate-400 break-words">25m Focus • 5m Rest • 15m Consolidation</p>
        </div>

        <button
          onClick={() => {
            AudioService.playTap();
            setShowSettingsModal(true);
          }}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0 cursor-pointer"
          title="Pomodoro Durations & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selector Tabs (Focus, Short Break, Long Break) */}
      <div className="w-full grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        {[
          { id: 'focus', label: 'Study Focus', icon: Brain, duration: focusMin },
          { id: 'shortBreak', label: 'Short Break', icon: Coffee, duration: shortBreakMin },
          { id: 'longBreak', label: 'Long Break', icon: Coffee, duration: longBreakMin },
        ].map((tab) => {
          const isActive = mode === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => switchModeManually(tab.id as PomodoroMode)}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                isActive
                  ? tab.id === 'focus'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              <span className="text-[10px] opacity-75 shrink-0">({tab.duration}m)</span>
            </button>
          );
        })}
      </div>

      {/* Main Circular Clock Display */}
      <div className="w-full flex flex-col items-center justify-center py-4 relative">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              strokeWidth="4"
              className="stroke-slate-800/80 fill-transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
              className={`fill-transparent transition-all duration-1000 ease-linear ${
                mode === 'focus' ? 'stroke-rose-500' : 'stroke-emerald-500'
              }`}
            />
          </svg>

          {/* Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1 p-2 max-w-[80%]">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter font-mono">
              {formatTime(timeLeft)}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider truncate max-w-full ${
                mode === 'focus' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {mode === 'focus' ? 'Deep Study Interval' : 'Rest & Refresh'}
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full truncate max-w-full">
              Session {sessionCount} of {settings.longBreakInterval || 4}
            </span>
          </div>
        </div>

        {/* Buttons (Play, Pause, Skip, Reset) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isRunning ? (
            <button
              onClick={handleStart}
              className={`flex items-center space-x-2 px-8 py-4 rounded-2xl text-white font-extrabold text-base shadow-xl transform active:scale-95 transition cursor-pointer ${
                mode === 'focus'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30 border border-rose-400/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 border border-emerald-400/30'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{mode === 'focus' ? 'Start Pomodoro' : 'Start Break'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-base shadow-xl shadow-amber-600/30 border border-amber-400/30 transform active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleSkip}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Skip Interval"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Daily Pomodoro Stats Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Today's Pomodoro Mastery
            </h3>
          </div>
          <span className="text-xs font-bold text-rose-400">
            {totalCompletedToday} / {profile.dailyPomodoroTarget || 6} Completed
          </span>
        </div>

        {/* Visual Dots for 6 Daily Goal Sessions */}
        <div className="grid grid-cols-6 gap-2 w-full">
          {Array.from({ length: profile.dailyPomodoroTarget || 6 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all ${
                idx < totalCompletedToday
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-1 break-words">
          {totalCompletedToday >= (profile.dailyPomodoroTarget || 6)
            ? '🎉 Daily Pomodoro Goal Crushed! Excellent cognitive endurance.'
            : `${(profile.dailyPomodoroTarget || 6) - totalCompletedToday} more sessions to reach your daily goal.`}
        </p>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Customize Pomodoro Intervals</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Focus Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={focusMin}
                  onChange={(e) => setFocusMin(parseInt(e.target.value) || 25)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Short Break (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreakMin}
                  onChange={(e) => setShortBreakMin(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Long Break (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={longBreakMin}
                  onChange={(e) => setLongBreakMin(parseInt(e.target.value) || 15)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-300">Auto-start Breaks</span>
                <input
                  type="checkbox"
                  checked={autoStartBreaks}
                  onChange={(e) => setAutoStartBreaks(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Auto-start Next Focus</span>
                <input
                  type="checkbox"
                  checked={autoStartFocus}
                  onChange={(e) => setAutoStartFocus(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/30"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
