import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Brain, Zap, TrendingUp, ArrowRight, Check, Sparkles, Clock, BookOpen } from 'lucide-react';
import { UserProfile, StudyTimePreference } from '../../types';
import { StorageService } from '../../services/storage';
import { AudioService } from '../../services/audioService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [name, setName] = useState<string>('Alex Chen');
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [preferredTime, setPreferredTime] = useState<StudyTimePreference>('Evening');
  const [primarySubject, setPrimarySubject] = useState<string>('Computer Science & Math');

  if (!isOpen) return null;

  const screens = [
    {
      title: 'Welcome to FocusGuard',
      subtitle: 'Your modern AI-powered study & productivity companion.',
      icon: Shield,
      badge: 'Version 2.0 • Android Native Architecture',
      color: 'from-blue-600 to-indigo-600',
      description:
        'FocusGuard helps students eliminate digital distractions, master deep study sessions, and reach peak academic performance with cutting-edge AI assistance.',
    },
    {
      title: 'Focus better. Study smarter.',
      subtitle: 'Smart Focus Shield & Advanced Pomodoro Engine',
      icon: Zap,
      badge: 'Cognitive Science Backed',
      color: 'from-indigo-600 to-sky-600',
      description:
        'Block distracting apps, immerse in 40Hz Gamma binaural audio beats, and flow through customizable study-break intervals proven to double retention.',
    },
    {
      title: 'AI-powered study planning',
      subtitle: 'Personalized Daily & Exam Revision Roadmaps',
      icon: Brain,
      badge: 'Powered by Gemini AI',
      color: 'from-sky-600 to-blue-700',
      description:
        'Enter your syllabus or topics. FocusGuard automatically optimizes daily schedules, topic priorities, revision cycles, and generates practice quizzes on the fly.',
    },
    {
      title: 'Track your productivity',
      subtitle: 'Rich Visual Statistics & Streak Milestones',
      icon: TrendingUp,
      badge: 'Measurable Growth',
      color: 'from-blue-700 to-indigo-800',
      description:
        'Watch your study hours, task completion rate, and productivity score climb with beautiful analytics designed to keep you motivated every single day.',
    },
  ];

  const handleNext = () => {
    AudioService.playTap();
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      const current = StorageService.getProfile();
      const updated: UserProfile = {
        ...current,
        name: name.trim() || 'Student',
        dailyStudyTargetMinutes: dailyHours * 60,
        preferredStudyTime: preferredTime,
        primarySubject: primarySubject.trim() || 'General Studies',
        onboardingCompleted: true,
      };
      StorageService.saveProfile(updated);
      AudioService.playCompletionChime();
      onComplete(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
      >
        {/* Step Indicator Dots */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-blue-500'
                    : i < step
                    ? 'w-2 bg-blue-400/60'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Step {step + 1} of 5
          </span>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step < 4 ? (
              <motion.div
                key={`screen-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                {/* Hero Icon */}
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${screens[step].color} flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-slate-800/80`}
                >
                  {React.createElement(screens[step].icon, {
                    className: 'w-10 h-10 text-white',
                  })}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800/40 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    {screens[step].badge}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white pt-1">
                    {screens[step].title}
                  </h2>
                  <p className="text-sm font-medium text-blue-300">
                    {screens[step].subtitle}
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-slate-400 px-2 max-w-sm">
                  {screens[step].description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="screen-profile-setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-1">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Personalize Your Study Profile</h2>
                  <p className="text-xs text-slate-400">
                    Tell FocusGuard your preferences to tailor your daily targets.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name / Nickname
                    </label>
                    <input
                      id="onboarding-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Primary Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Primary Subject / Focus Area
                    </label>
                    <input
                      id="onboarding-subject-input"
                      type="text"
                      value={primarySubject}
                      onChange={(e) => setPrimarySubject(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Daily Study Goal */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Daily Study Goal
                      </label>
                      <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                        {dailyHours} Hours / Day
                      </span>
                    </div>
                    <input
                      id="onboarding-hours-range"
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>1 hr (Casual)</span>
                      <span>3-4 hrs (Optimal)</span>
                      <span>8 hrs (Intensive)</span>
                    </div>
                  </div>

                  {/* Preferred Study Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Study Time
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Morning', 'Afternoon', 'Evening', 'Night'] as StudyTimePreference[]).map(
                        (time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setPreferredTime(time)}
                            className={`py-2 text-xs font-semibold rounded-xl border transition flex flex-col items-center justify-center gap-0.5 ${
                              preferredTime === time
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700/60'
                            }`}
                          >
                            <span>{time === 'Morning' ? '🌅' : time === 'Afternoon' ? '☀️' : time === 'Evening' ? '🌇' : '🌙'}</span>
                            <span className="text-[10px]">{time}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-800/60 bg-slate-900/60">
          {step > 0 ? (
            <button
              onClick={() => {
                AudioService.playTap();
                setStep(step - 1);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-xl transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            id="onboarding-next-btn"
            onClick={handleNext}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
          >
            <span>{step === 4 ? 'Get Started' : 'Continue'}</span>
            {step === 4 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
