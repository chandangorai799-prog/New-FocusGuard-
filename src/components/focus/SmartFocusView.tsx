import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Flame,
  Star,
  Music,
  Plus,
  Minus,
  Clock,
  Radio,
  Headphones,
  CloudRain,
  Waves,
  Zap,
  Disc,
  Compass,
  Timer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FocusSessionRecord, FocusSettings, UserProfile, FocusSessionState } from '../../types';
import { AudioService } from '../../services/audioService';
import { StorageService } from '../../services/storage';
import { NotificationService } from '../../services/notificationService';
import { AndroidBlockerService } from '../../services/androidBlockerService';
import { PermissionCheckModal } from './PermissionCheckModal';

interface SmartFocusViewProps {
  settings: FocusSettings;
  profile: UserProfile;
  onRecordSession: (session: Omit<FocusSessionRecord, 'id'>) => void;
  onUpdateSettings: (settings: FocusSettings) => void;
  initialDuration?: number;
  onFocusStateChange?: (isActive: boolean) => void;
  onOpenShield?: () => void;
}

export const SmartFocusView: React.FC<SmartFocusViewProps> = ({
  settings,
  profile,
  onRecordSession,
  onUpdateSettings,
  initialDuration,
  onFocusStateChange,
  onOpenShield,
}) => {
  const presetDurations = [
    { label: '15m', mins: 15 },
    { label: '25m', mins: 25 },
    { label: '45m', mins: 45 },
    { label: '1 Hour', mins: 60 },
    { label: '1.5 Hours', mins: 90 },
    { label: '2 Hours', mins: 120 },
    { label: '3 Hours', mins: 180 },
    { label: '4 Hours', mins: 240 },
  ];

  const [selectedDuration, setSelectedDuration] = useState<number>(initialDuration || settings.defaultDuration || 45);
  const [timeLeft, setTimeLeft] = useState<number>(selectedDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<FocusSessionState>('IDLE');
  const [subject, setSubject] = useState<string>(profile.primarySubject || 'Deep Study');
  const [ambientSound, setAmbientSound] = useState<'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves'>(settings.ambientSound || 'binaural');
  const [ambientVolume, setAmbientVolume] = useState<number>(settings.ambientVolume || 0.5);
  const [isAmbientActive, setIsAmbientActive] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [completedSessionTime, setCompletedSessionTime] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [reflectionNotes, setReflectionNotes] = useState<string>('Achieved great deep focus with zero distraction.');
  const [blockedAppsCount, setBlockedAppsCount] = useState<number>(0);
  const [testAlertCountdown, setTestAlertCountdown] = useState<number | null>(null);
  const [testAlertSuccess, setTestAlertSuccess] = useState<boolean>(false);

  const handleTriggerTest5PMAlert = async () => {
    AudioService.playTap();
    await NotificationService.requestPermission();

    NotificationService.scheduleTestLockScreenNotification(3, (remaining) => {
      setTestAlertCountdown(remaining);
      if (remaining <= 0) {
        setTestAlertCountdown(null);
        setTestAlertSuccess(true);
        setTimeout(() => setTestAlertSuccess(false), 5000);
      }
    });
  };

  // Hours & Minutes Breakdown
  const hours = Math.floor(selectedDuration / 60);
  const minutes = selectedDuration % 60;

  const handleSetHours = (newHours: number) => {
    AudioService.playTap();
    const clampedHours = Math.max(0, Math.min(12, newHours));
    const newTotal = clampedHours * 60 + minutes;
    const finalDuration = Math.max(1, newTotal);
    setSelectedDuration(finalDuration);
  };

  const handleSetMinutes = (newMinutes: number) => {
    AudioService.playTap();
    const clampedMinutes = Math.max(0, Math.min(59, newMinutes));
    const newTotal = hours * 60 + clampedMinutes;
    const finalDuration = Math.max(1, newTotal);
    setSelectedDuration(finalDuration);
  };

  const handleAdjustDuration = (deltaMins: number) => {
    AudioService.playTap();
    const newTotal = Math.max(1, Math.min(720, selectedDuration + deltaMins));
    setSelectedDuration(newTotal);
  };

  const timerRef = useRef<any>(null);

  // Sync blocked apps count from Storage
  useEffect(() => {
    const apps = StorageService.getBlockedApps();
    const count = apps.filter((a) => a.isBlocked).length;
    setBlockedAppsCount(count);
  }, []);

  // Listen to Android blocker service state
  useEffect(() => {
    const unsub = AndroidBlockerService.subscribeToSessionState((state, session) => {
      setSessionStatus(state);
      if (session && state === 'FOCUS_ACTIVE') {
        setIsRunning(true);
      } else if (state === 'PAUSED') {
        setIsRunning(false);
      } else if (state === 'IDLE' || state === 'COMPLETED' || state === 'CANCELLED') {
        setIsRunning(false);
      }
    });
    return () => unsub();
  }, []);

  // Sync duration when selectedDuration changes (if timer not running)
  useEffect(() => {
    if (!isRunning && sessionStatus === 'IDLE') {
      setTimeLeft(selectedDuration * 60);
    }
  }, [selectedDuration, isRunning, sessionStatus]);

  // Notify parent of focus state
  useEffect(() => {
    onFocusStateChange?.(isRunning && sessionStatus === 'FOCUS_ACTIVE');
  }, [isRunning, sessionStatus, onFocusStateChange]);

  // Timer Tick Engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionCompleted(selectedDuration);
            return 0;
          }
          const nextVal = prev - 1;
          AndroidBlockerService.updateRemainingSeconds(nextVal);
          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedDuration]);

  const handleStart = () => {
    // 1. Check Android permissions first
    if (!AndroidBlockerService.areRequiredPermissionsGranted()) {
      setShowPermissionModal(true);
      return;
    }

    startFocusSession();
  };

  const startFocusSession = () => {
    AudioService.playFocusStart();
    setIsRunning(true);

    const result = AndroidBlockerService.startSession({
      durationMinutes: selectedDuration,
      mode: 'focus',
      subject: subject.trim() || 'Deep Study',
    });

    if (!result.success) {
      setShowPermissionModal(true);
      return;
    }

    if (ambientSound !== 'none') {
      AudioService.startAmbient(ambientSound, ambientVolume);
      setIsAmbientActive(true);
    }
  };

  const handlePause = () => {
    AudioService.playTap();
    setIsRunning(false);
    AudioService.stopAmbient();
    setIsAmbientActive(false);
    AndroidBlockerService.pauseSession();
  };

  const handleResume = () => {
    AudioService.playTap();
    setIsRunning(true);
    if (ambientSound !== 'none') {
      AudioService.startAmbient(ambientSound, ambientVolume);
      setIsAmbientActive(true);
    }
    AndroidBlockerService.resumeSession();
  };

  const handleReset = () => {
    AudioService.playTap();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setSessionStatus('IDLE');
    AudioService.stopAmbient();
    setIsAmbientActive(false);
    AndroidBlockerService.resetSessionToIdle();
    setTimeLeft(selectedDuration * 60);
  };

  const handleAddMinutes = (minsToAdd: number) => {
    AudioService.playTap();
    const newTime = timeLeft + minsToAdd * 60;
    setTimeLeft(newTime);
    AndroidBlockerService.updateRemainingSeconds(newTime);
  };

  const handleEndEarly = () => {
    AudioService.playTap();
    const elapsedMinutes = Math.max(1, Math.round((selectedDuration * 60 - timeLeft) / 60));
    setIsRunning(false);
    AudioService.stopAmbient();
    AndroidBlockerService.cancelSession();
    handleSessionCompleted(elapsedMinutes);
  };

  const handleSessionCompleted = (minutes: number) => {
    AudioService.playCompletionChime();
    AudioService.stopAmbient();
    setIsRunning(false);
    AndroidBlockerService.completeSession();
    setCompletedSessionTime(minutes);
    setShowReflectionModal(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const hrs = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    const timeSummary = hrs > 0 ? `${hrs}h ${remainingMins}m` : `${minutes} minutes`;

    NotificationService.send('🎯 Focus Session Completed!', {
      body: `Awesome job! You completed ${timeSummary} of deep focus in ${subject}.`,
      tag: 'focus',
    });
  };

  const handleSaveReflection = () => {
    AudioService.playTap();
    onRecordSession({
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: completedSessionTime,
      mode: 'focus',
      subject: subject || 'Study Session',
      rating: rating,
      notes: reflectionNotes,
      completed: true,
    });

    setShowReflectionModal(false);
    setTimeLeft(selectedDuration * 60);
  };

  const handleSoundChange = (newSound: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream' | 'waves') => {
    AudioService.playTap();
    setAmbientSound(newSound);
    onUpdateSettings({ ...settings, ambientSound: newSound });
    if (newSound === 'none') {
      AudioService.stopAmbient();
      setIsAmbientActive(false);
    } else {
      AudioService.startAmbient(newSound, ambientVolume);
      setIsAmbientActive(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    AudioService.setAmbientVolume(newVol);
    onUpdateSettings({ ...settings, ambientVolume: newVol });
  };

  const handleToggleAmbient = () => {
    AudioService.playTap();
    if (isAmbientActive) {
      AudioService.stopAmbient();
      setIsAmbientActive(false);
    } else {
      const soundToPlay = ambientSound === 'none' ? 'binaural' : ambientSound;
      if (ambientSound === 'none') setAmbientSound('binaural');
      AudioService.startAmbient(soundToPlay, ambientVolume);
      setIsAmbientActive(true);
    }
  };

  // Format HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0 || selectedDuration >= 60) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationBadge = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m session`;
    if (h > 0) return `${h} hr session`;
    return `${m} min session`;
  };

  const totalSeconds = selectedDuration * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div
      className={`w-full space-y-6 pb-12 transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto'
          : ''
      }`}
    >
      {/* View Header */}
      <div className="w-full flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 truncate">
              Smart Focus Shield
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
              DND Active
            </span>
          </div>
          <p className="text-xs text-slate-400 break-words">Eliminate distractions & enter deep cognitive flow</p>
        </div>

        <button
          onClick={() => {
            AudioService.playTap();
            setIsFullScreen(!isFullScreen);
          }}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0 cursor-pointer"
          title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Immersive'}
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Focus Subject Input Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Focus Goal / Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isRunning}
            placeholder="e.g. Dynamic Programming & LeetCode"
            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder-slate-500 mt-1"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            AudioService.playTap();
            if (onOpenShield) onOpenShield();
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/60 rounded-2xl text-blue-300 text-xs font-semibold shrink-0 transition active:scale-95 cursor-pointer shadow-sm"
          title="Configure Blocked Apps list"
        >
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Shield ON</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">
            {profile.blockedAppsCount || 20}
          </span>
        </button>
      </div>

      {/* Daily 5:00 PM Lock Screen Notification Quick Test Banner */}
      <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/50 border border-blue-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-blue-950/20">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">Daily 5:00 PM Focus Reminder</span>
              <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                Lock Screen & Background
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {testAlertSuccess
                ? '✅ Notification sent! Check your lock screen / notification shade.'
                : 'Har shaam 5:00 baje automatic alert: "Ready to focus?"'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerTest5PMAlert}
          disabled={testAlertCountdown !== null}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/70 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-blue-900/40 cursor-pointer"
        >
          {testAlertCountdown !== null ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Lock Phone Screen ({testAlertCountdown}s)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Test Lock Screen Alert</span>
            </>
          )}
        </button>
      </div>

      {/* Main Focus Ring & Timer Display */}
      <div className="w-full flex flex-col items-center justify-center py-4 relative">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Animated Ambient Glow when running */}
          {isRunning && (
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-4 rounded-full bg-blue-500/20 blur-2xl pointer-events-none"
            />
          )}

          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              strokeWidth="4"
              className="stroke-slate-800/80 fill-transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx="50"
              cy="50"
              r="44"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
              className="stroke-blue-500 fill-transparent transition-all duration-1000 ease-linear shadow-lg"
            />
          </svg>

          {/* Center Digital Clock (HH:MM:SS / MM:SS) */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1 p-2 max-w-[85%]">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight font-mono drop-shadow-md">
                {formatTime(timeLeft)}
              </span>
              {selectedDuration >= 60 && (
                <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest text-slate-400 font-mono mt-0.5">
                  <span>HRS</span>
                  <span>MINS</span>
                  <span>SECS</span>
                </div>
              )}
            </div>
            
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest truncate max-w-full">
              {isRunning ? 'Deep Focus Session' : 'Ready to Focus'}
            </span>
            <span className="text-[11px] text-slate-300 font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 truncate max-w-full">
              {formatDurationBadge(selectedDuration)}
            </span>
          </div>
        </div>

        {/* Action Controls (Play/Pause/Reset/Quick Extend) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-6">
          <button
            id="focus-reset-btn"
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isRunning ? (
            <button
              id="focus-play-btn"
              onClick={handleStart}
              className="flex items-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 border border-blue-400/30 transform active:scale-95 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus ({formatDurationBadge(selectedDuration)})</span>
            </button>
          ) : (
            <button
              id="focus-pause-btn"
              onClick={handlePause}
              className="flex items-center space-x-2 px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-base shadow-xl shadow-amber-600/30 border border-amber-400/30 transform active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {isRunning && (
            <div className="flex items-center gap-1.5">
              <button
                id="focus-add-5m-btn"
                onClick={() => handleAddMinutes(5)}
                className="px-3 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 transition text-xs font-bold cursor-pointer"
                title="Add 5 Minutes"
              >
                +5m
              </button>
              <button
                id="focus-add-15m-btn"
                onClick={() => handleAddMinutes(15)}
                className="px-3 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 transition text-xs font-bold cursor-pointer"
                title="Add 15 Minutes"
              >
                +15m
              </button>
              <button
                id="focus-add-1h-btn"
                onClick={() => handleAddMinutes(60)}
                className="px-3 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 transition text-xs font-bold cursor-pointer"
                title="Add 1 Hour"
              >
                +1h
              </button>
            </div>
          )}

          {isRunning && (
            <button
              id="focus-end-early-btn"
              onClick={handleEndEarly}
              className="p-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/50 transition cursor-pointer"
              title="Finish / End Early"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Hours + Minutes Duration Setup */}
      {!isRunning && (
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                <Clock className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Custom Focus Duration (Hours + Minutes)
                </h3>
                <p className="text-[10px] text-slate-400">Set exact study session duration in hours and minutes</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-blue-400 px-2.5 py-1 rounded-xl bg-blue-950/80 border border-blue-800/50 inline-block">
                {hours}h {minutes}m ({selectedDuration}m)
              </span>
            </div>
          </div>

          {/* Dual Hours & Minutes Stepper Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hours Control Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-blue-400" />
                  Hours (0 - 12h)
                </span>
                <span className="text-sm font-mono font-black text-white">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetHours(hours - 1)}
                  disabled={hours <= 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer shrink-0"
                  title="Decrease 1 Hour"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={hours}
                  onChange={(e) => handleSetHours(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleSetHours(hours + 1)}
                  disabled={hours >= 12}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer shrink-0"
                  title="Increase 1 Hour"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Hours Pills */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[0, 1, 2, 3, 4, 6].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSetHours(h)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                      hours === h
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Control Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Minutes (0 - 55m)
                </span>
                <span className="text-sm font-mono font-black text-white">{minutes} Mins</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetMinutes(minutes - 5)}
                  disabled={minutes <= 0 && hours <= 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer shrink-0"
                  title="Decrease 5 Minutes"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="0"
                  max="55"
                  step="5"
                  value={minutes}
                  onChange={(e) => handleSetMinutes(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleSetMinutes(minutes + 5)}
                  disabled={minutes >= 55}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition cursor-pointer shrink-0"
                  title="Increase 5 Minutes"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Minutes Pills */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[0, 15, 25, 30, 45, 50].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSetMinutes(m)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border cursor-pointer ${
                      minutes === m
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons (Minutes & Hours) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Popular Study Presets
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(-15)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(15)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(30)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition cursor-pointer"
                >
                  +30m
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustDuration(60)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/60 transition cursor-pointer"
                >
                  +1 hr
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full">
              {presetDurations.map((item) => (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => {
                    AudioService.playTap();
                    setSelectedDuration(item.mins);
                  }}
                  className={`py-2 px-1 rounded-xl font-bold text-xs border transition text-center cursor-pointer ${
                    selectedDuration === item.mins
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ambient Soundscapes Selector */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${isAmbientActive ? 'bg-blue-600/30 text-blue-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              <Music className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Focus Ambient Soundscape
                {isAmbientActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Playing
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Zero-bandwidth synthesized focus audio & study beats</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleToggleAmbient}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isAmbientActive
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isAmbientActive ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Mute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Sound</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 w-full">
          {[
            { id: 'binaural', label: '40Hz Gamma', sub: 'Hyper-Focus', icon: Sparkles },
            { id: 'lofi', label: 'Lo-Fi Chill', sub: 'Study Beats', icon: Headphones },
            { id: 'rain', label: 'Rainfall', sub: 'Calm Drizzle', icon: CloudRain },
            { id: 'waves', label: 'Ocean Surf', sub: 'Rhythmic Tide', icon: Waves },
            { id: 'whitenoise', label: 'White Noise', sub: 'Deep Block', icon: Radio },
            { id: 'space', label: 'Cosmic Pad', sub: 'Deep Drone', icon: Compass },
            { id: 'stream', label: 'Forest Brook', sub: 'River Flow', icon: Zap },
            { id: 'none', label: 'Mute Off', sub: 'Silent', icon: VolumeX },
          ].map((item) => {
            const isSelected = ambientSound === item.id;
            const isCurrentlySounding = isSelected && isAmbientActive && item.id !== 'none';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSoundChange(item.id as any)}
                className={`py-2.5 px-2 rounded-2xl text-left border transition flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/25 text-blue-300 border-blue-500/60 shadow-md shadow-blue-600/20'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {isCurrentlySounding && (
                  <div className="absolute top-1.5 right-1.5 flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce h-2.5" />
                  </div>
                )}
                <item.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold truncate w-full text-center leading-tight">{item.label}</span>
                <span className="text-[9px] text-slate-500 truncate w-full text-center">{item.sub}</span>
              </button>
            );
          })}
        </div>

        {ambientSound !== 'none' && (
          <div className="pt-2 flex items-center space-x-3 text-xs text-slate-400 w-full bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/80">
            <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <span className="text-xs w-9 text-right font-mono font-bold text-blue-300 shrink-0">{Math.round(ambientVolume * 100)}%</span>
          </div>
        )}
      </div>

      {/* Post-Session Reflection Modal */}
      <AnimatePresence>
        {showReflectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Focus Session Complete!</h3>
                <p className="text-xs text-slate-400">
                  You logged <strong className="text-white">{completedSessionTime} minutes</strong> in{' '}
                  <strong className="text-blue-300">{subject}</strong>.
                </p>
              </div>

              {/* Rating */}
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-semibold text-slate-300">How was your focus?</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        AudioService.playTap();
                        setRating(star);
                      }}
                      className="p-1 text-slate-600 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Session Reflection / Notes</label>
                <textarea
                  rows={3}
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="What concepts did you master? Any tricky parts to review?"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleSaveReflection}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/30"
                >
                  Save & Log Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pre-Session Android Permission Checker */}
      <PermissionCheckModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onAllPermissionsGranted={() => {
          setShowPermissionModal(false);
          startFocusSession();
        }}
      />
    </div>
  );
};
