import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Cpu } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 5000,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress indicator
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(currentProgress);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        if (onFinish) {
          onFinish();
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  return (
    <motion.div
      id="focusguard-splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none px-6 py-10 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top subtle badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="pt-4"
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] font-medium text-slate-400 backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>v1.0.0 • Production Ready</span>
        </div>
      </motion.div>

      {/* Center Hero Branding */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
        {/* Animated Shield Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.15,
          }}
          className="relative"
        >
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-3 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl blur-md opacity-60 animate-pulse" />

          {/* Logo Container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-white/20 flex items-center justify-center shadow-2xl shadow-blue-500/25">
            <Shield className="w-12 h-12 sm:w-14 sm:h-14 text-blue-400 drop-shadow-[0_4px_12px_rgba(59,130,246,0.6)]" />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </motion.div>

        {/* App Title & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
              FocusGuard
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
              AI
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            AI-Powered Focus & Study Companion
          </p>
        </motion.div>

        {/* Minimal Progress Line */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="w-48 sm:w-56 h-1 bg-slate-800/80 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </div>

      {/* Developer Credit Footer (Must be clearly visible on every launch) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="pb-4 flex flex-col items-center text-center space-y-1.5"
      >
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 font-semibold tracking-wide">
            Developed by <span className="text-white font-bold">CG Web Solutions</span>
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          Chandan Gorai • Intelligent Productivity Engine
        </p>
      </motion.div>
    </motion.div>
  );
};
