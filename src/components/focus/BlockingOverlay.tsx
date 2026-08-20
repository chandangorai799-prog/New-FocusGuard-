import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowLeft, Clock, AlertTriangle, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { AndroidBlockerService, BlockingOverlayPayload } from '../../services/androidBlockerService';
import { AudioService } from '../../services/audioService';

interface BlockingOverlayProps {
  onReturnToFocus?: () => void;
}

const MOTIVATION_QUOTES = [
  'Every distraction you resist makes your focus muscle stronger.',
  'Your future self is depending on what you study right now.',
  'Discipline is choosing between what you want now and what you want most.',
  'Great grades are built on uninterrupted 25-minute blocks of deep work.',
  'Put the phone down. Pick up the textbook. You have got this!',
];

export const BlockingOverlay: React.FC<BlockingOverlayProps> = ({ onReturnToFocus }) => {
  const [payload, setPayload] = useState<BlockingOverlayPayload | null>(null);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);

  useEffect(() => {
    const unsub = AndroidBlockerService.subscribeToBlockingOverlay((p) => {
      setPayload(p);
      if (p) {
        setQuoteIndex(Math.floor(Math.random() * MOTIVATION_QUOTES.length));
      }
    });
    return () => unsub();
  }, []);

  if (!payload) return null;

  const { app, remainingSeconds, subject, mode } = payload;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleReturn = () => {
    AudioService.playSuccess();
    AndroidBlockerService.dismissBlockingOverlay();
    if (onReturnToFocus) {
      onReturnToFocus();
    }
  };

  return (
    <div
      id="android-blocking-overlay"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative z-10 space-y-5">
        {/* App Icon with Lock Badge */}
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-4xl shadow-lg">
            {app.icon || '📱'}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-rose-600 border-2 border-slate-900 flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Brand Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>FocusGuard Active Shield</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight pt-1">
            Stay Focused 🎯
          </h2>

          <p className="text-sm font-semibold text-slate-200">
            <span className="text-rose-400 font-bold">{app.name}</span> is blocked during this Focus Session.
          </p>

          <p className="text-[11px] font-mono text-slate-400">
            {app.packageName || 'com.app.blocked'}
          </p>
        </div>

        {/* Focus Timer Status */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Time Remaining:
            </span>
            <span className="font-mono text-base font-extrabold text-blue-400 tracking-wider">
              {formattedTime}
            </span>
          </div>

          {subject && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                Target Goal:
              </span>
              <span className="font-semibold text-amber-300 truncate max-w-[180px]">
                {subject}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
            <span className="text-slate-400 font-medium">Session Mode:</span>
            <span className="text-slate-300 font-medium capitalize">
              {mode === 'pomodoro' ? 'Pomodoro Focus' : 'Deep Study Timer'}
            </span>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-300 italic flex items-center gap-2 text-left">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="line-clamp-2">"{MOTIVATION_QUOTES[quoteIndex]}"</p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 space-y-2">
          <button
            id="return-to-focus-btn"
            onClick={handleReturn}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to FocusGuard</span>
          </button>

          <p className="text-[11px] text-slate-400">
            This app will unlock automatically when your timer reaches 00:00.
          </p>
        </div>
      </div>
    </div>
  );
};
