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
  const durations = [15, 25, 45, 60, 90];
  const [selectedDuration, setSelectedDuration] = useState<number>(initialDuration || settings.defaultDuration || 45);
  const [timeLeft, setTimeLeft] = useState<number>(selectedDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<FocusSessionState>('IDLE');
  const [subject, setSubject] = useState<string>(profile.primarySubject || 'Deep Study');
  const [ambientSound, setAmbientSound] = useState<'none' | 'binaural' | 'rain' | 'whitenoise' | 'waves'>(settings.ambientSound || 'binaural');
  const [ambientVolume, setAmbientVolume] = useState<number>(settings.ambientVolume || 0.4);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [completedSessionTime, setCompletedSessionTime] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [reflectionNotes, setReflectionNotes] = useState<string>('Achieved great deep focus with zero distraction.');
  const [blockedAppsCount, setBlockedAppsCount] = useState<number>(0);

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
    }
  };

  const handlePause = () => {
    AudioService.playTap();
    setIsRunning(false);
    AudioService.stopAmbient();
    AndroidBlockerService.pauseSession();
  };

  const handleResume = () => {
    AudioService.playTap();
    setIsRunning(true);
    if (ambientSound !== 'none') {
      AudioService.startAmbient(ambientSound, ambientVolume);
    }
    AndroidBlockerService.resumeSession();
  };

  const handleReset = () => {
    AudioService.playTap();
    setIsRunning(false);
    AudioService.stopAmbient();
    AndroidBlockerService.resetSessionToIdle();
    setTimeLeft(selectedDuration * 60);
  };

  const handleAddFiveMinutes = () => {
    AudioService.playTap();
    const newTime = timeLeft + 300;
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

    NotificationService.send('🎯 Focus Session Completed!', {
      body: `Awesome job! You completed ${minutes} minutes of deep focus in ${subject}.`,
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

  const handleSoundChange = (newSound: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'waves') => {
    AudioService.playTap();
    setAmbientSound(newSound);
    onUpdateSettings({ ...settings, ambientSound: newSound });
    if (isRunning) {
      AudioService.startAmbient(newSound, ambientVolume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    AudioService.setAmbientVolume(newVol);
    onUpdateSettings({ ...settings, ambientVolume: newVol });
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1 p-2 max-w-[80%]">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest truncate max-w-full">
              {isRunning ? 'Deep Focus Session' : 'Ready to Focus'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-800/80 truncate max-w-full">
              {selectedDuration} min session
            </span>
          </div>
        </div>

        {/* Action Controls (Play/Pause/Reset) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
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
              <span>Start Focus</span>
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
            <button
              id="focus-add-five-btn"
              onClick={handleAddFiveMinutes}
              className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Add 5 Minutes"
            >
              <Plus className="w-4 h-4" />
              <span>5m</span>
            </button>
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

      {/* Preset Duration Selector */}
      {!isRunning && (
        <div className="w-full space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Duration (Minutes)
          </label>
          <div className="grid grid-cols-5 gap-2 w-full">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => {
                  AudioService.playTap();
                  setSelectedDuration(d);
                }}
                className={`py-2.5 rounded-2xl font-bold text-xs border transition cursor-pointer ${
                  selectedDuration === d
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ambient Soundscapes Selector */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Focus Ambient Soundscape
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Synthesized Zero-Bandwidth</span>
        </div>

        <div className="grid grid-cols-5 gap-2 w-full">
          {[
            { id: 'none', label: 'Mute', icon: VolumeX },
            { id: 'binaural', label: '40Hz Gamma', icon: Sparkles },
            { id: 'rain', label: 'Rain', icon: Volume2 },
            { id: 'whitenoise', label: 'White Noise', icon: Volume2 },
            { id: 'waves', label: 'Ocean', icon: Volume2 },
          ].map((item) => {
            const isSelected = ambientSound === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSoundChange(item.id as any)}
                className={`py-2.5 px-1 rounded-2xl text-[11px] font-semibold border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}
        </div>

        {ambientSound !== 'none' && (
          <div className="pt-2 flex items-center space-x-3 text-xs text-slate-400 w-full">
            <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] w-8 font-mono shrink-0">{Math.round(ambientVolume * 100)}%</span>
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
