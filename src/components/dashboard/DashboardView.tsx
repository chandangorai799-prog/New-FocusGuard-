import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Zap,
  Timer,
  Brain,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  Calendar,
  AlertCircle,
  BookOpen,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import { UserProfile, TaskItem, FocusSessionRecord, StudyPlan, NavigationTab } from '../../types';
import { AudioService } from '../../services/audioService';
import { THEME_PRESETS } from '../../services/themeService';

interface DashboardViewProps {
  profile: UserProfile;
  tasks: TaskItem[];
  sessions: FocusSessionRecord[];
  studyPlans: StudyPlan[];
  onStartFocus: (durationMinutes?: number) => void;
  onStartPomodoro: () => void;
  onNavigateToTab: (tab: NavigationTab) => void;
  onToggleTask: (taskId: string) => void;
  onOpenThemeModal?: () => void;
  onSelectTheme?: (themeId: string, customAccent?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  tasks,
  sessions,
  studyPlans,
  onStartFocus,
  onStartPomodoro,
  onNavigateToTab,
  onToggleTask,
  onOpenThemeModal,
  onSelectTheme,
}) => {
  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Today's stats calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const safeSessions = sessions || [];
  const safeTasks = tasks || [];
  const safePlans = studyPlans || [];

  const todaySessions = safeSessions.filter((s) => s.date === todayStr && s.completed);

  const totalFocusMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const pomodoroSessionsToday = todaySessions.filter((s) => s.mode === 'pomodoro').length;

  const todayTasks = safeTasks.filter((t) => !t.dueDate || t.dueDate <= todayStr);
  const completedTasksToday = todayTasks.filter((t) => t.completed).length;
  const totalTasksTodayCount = todayTasks.length;

  // Productivity Score formula: combination of study time vs target (60%) + task completion rate (40%)
  const targetMinutes = profile?.dailyStudyTargetMinutes || 180;
  const timeProgress = Math.min(1, totalFocusMinutesToday / targetMinutes);
  const taskProgress = totalTasksTodayCount > 0 ? completedTasksToday / totalTasksTodayCount : 0;
  const productivityScore = Math.min(100, Math.round((timeProgress * 0.6 + taskProgress * 0.4) * 100));

  // Format hours/minutes
  const hours = Math.floor(totalFocusMinutesToday / 60);
  const minutes = totalFocusMinutesToday % 60;
  const focusTimeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const activePlan = safePlans.length > 0 ? safePlans[0] : null;

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Top Greeting & Productivity Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative overflow-hidden bg-gradient-to-br from-blue-900/60 via-slate-900 to-indigo-950/80 border border-blue-800/40 rounded-3xl p-5 sm:p-6 shadow-xl"
      >
        {/* Glow ambient background element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/50 inline-flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Focus Mode Ready
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
              {getGreeting()}, {profile.name || 'Student'} 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 break-words">
              {profile.primarySubject
                ? `Ready for ${profile.primarySubject} session?`
                : "Let's make today productive and distraction-free."}
            </p>
          </div>

          {/* Productivity Score Circular Ring */}
          <div className="flex items-center space-x-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 px-4 shrink-0 backdrop-blur-sm self-start md:self-auto">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500 stroke-current transition-all duration-1000 ease-out"
                  strokeDasharray={`${productivityScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-white">{productivityScore}%</span>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Productivity Score</span>
              <p className="text-xs font-bold text-blue-300 truncate">
                {productivityScore >= 80 ? 'Peak Flow ⚡' : productivityScore >= 50 ? 'On Track 👍' : 'Starting Up 🚀'}
              </p>
              <span className="text-[10px] text-slate-500 block">Goal: {profile.dailyStudyTargetMinutes / 60}h/day</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Theme Quick Switcher & Customizer Bar */}
      <motion.div
        id="dashboard-theme-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-md backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">App Theme</span>
              <span className="text-[10px] font-semibold text-blue-400 capitalize px-1.5 py-0.2 bg-blue-950 border border-blue-800/50 rounded-full">
                {profile.theme || 'Midnight'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Theme Presets Swatches */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
          {THEME_PRESETS.map((preset) => {
            const isActive = (profile.theme || 'midnight') === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  AudioService.playTap();
                  if (onSelectTheme) {
                    onSelectTheme(preset.id, preset.accentColor);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/40'
                }`}
                title={`Switch to ${preset.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                  style={{ backgroundColor: preset.accentColor }}
                />
                <span className="truncate">{preset.name.split(' ')[0]}</span>
              </button>
            );
          })}

          {/* Open Full Customizer Modal Button */}
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={() => {
                AudioService.playTap();
                onOpenThemeModal();
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm flex items-center space-x-1 shrink-0 transition active:scale-95 cursor-pointer ml-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Custom...</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* 4 Key Metrics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Focus Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Focus Time</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight break-words">{focusTimeDisplay}</p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
            Target: {Math.round(profile.dailyStudyTargetMinutes / 60)}h
          </span>
        </motion.div>

        {/* Tasks Completed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tasks Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight break-words">
            {completedTasksToday}/{totalTasksTodayCount}
          </p>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
            {totalTasksTodayCount > 0 ? `${Math.round((completedTasksToday / totalTasksTodayCount) * 100)}% done` : 'No tasks yet'}
          </span>
        </motion.div>

        {/* Pomodoro Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pomodoro</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white tracking-tight break-words">
            {pomodoroSessionsToday} <span className="text-xs font-normal text-slate-400">sessions</span>
          </p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
            Goal: {profile.dailyPomodoroTarget || 6}
          </span>
        </motion.div>

        {/* Study Streak */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Current Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-400 tracking-tight break-words">
            {profile.streakCount} <span className="text-xs font-normal text-slate-400">days</span>
          </p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
            Best: {profile.bestStreak || profile.streakCount} days
          </span>
        </motion.div>
      </div>

      {/* Quick Start Focus & Pomodoro Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Quick Start Focus */}
        <motion.button
          id="btn-quick-start-focus"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            AudioService.playFocusStart();
            onStartFocus(45);
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-between shadow-lg shadow-blue-600/25 border border-blue-400/30 transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20 shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">Start Smart Focus</h3>
              <p className="text-xs text-blue-100/90 font-medium truncate">45 min Deep Study & App Shield</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </motion.button>

        {/* Quick Start Pomodoro */}
        <motion.button
          id="btn-quick-start-pomodoro"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            AudioService.playFocusStart();
            onStartPomodoro();
          }}
          className="w-full p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-between shadow-lg transition text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
              <Timer className="w-6 h-6 text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">Start Pomodoro</h3>
              <p className="text-xs text-slate-400 font-medium truncate">25 min Focus + 5 min Break</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>

      {/* AI Shortcuts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* AI Study Planner Shortcut */}
        <button
          id="shortcut-ai-planner"
          onClick={() => {
            AudioService.playTap();
            onNavigateToTab('planner');
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-indigo-900/50 hover:border-indigo-600/50 transition flex items-center space-x-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">AI Study Planner</h4>
            <p className="text-[11px] text-slate-400 truncate">Plan My Study schedule</p>
          </div>
        </button>

        {/* AI Assistant Shortcut */}
        <button
          id="shortcut-ai-assistant"
          onClick={() => {
            AudioService.playTap();
            onNavigateToTab('assistant');
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-sky-900/50 hover:border-sky-600/50 transition flex items-center space-x-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">Ask AI Assistant</h4>
            <p className="text-[11px] text-slate-400 truncate">Quiz, Summaries & Tutor</p>
          </div>
        </button>
      </div>

      {/* Today's Tasks Section */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-sm font-bold text-white">Today's Tasks</h3>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {todayTasks.length}
            </span>
          </div>

          <button
            onClick={() => {
              AudioService.playTap();
              onNavigateToTab('tasks');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 w-full">
          {todayTasks.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">No tasks scheduled for today</p>
              <button
                type="button"
                onClick={() => {
                  AudioService.playTap();
                  onNavigateToTab('tasks');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/30 transition cursor-pointer"
              >
                <span>+ Add Your First Task</span>
              </button>
            </div>
          ) : (
            todayTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`w-full p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                  task.completed
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="text-slate-400 hover:text-blue-400 shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold break-words ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300 shrink-0">{task.category}</span>
                      {task.dueTime && <span className="shrink-0">Due {task.dueTime}</span>}
                      {task.estimatedMinutes && <span className="shrink-0">{task.estimatedMinutes}m est.</span>}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    task.priority === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : task.priority === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active AI Study Plan Widget (if exists) */}
      {activePlan && (
        <div className="w-full bg-slate-900/80 border border-indigo-900/40 rounded-3xl p-4 sm:p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <h3 className="text-sm font-bold text-white truncate">Active AI Study Plan</h3>
            </div>
            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/50 shrink-0">
              {activePlan.difficultyLevel}
            </span>
          </div>

          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white break-words">{activePlan.title}</h4>
                <p className="text-[11px] text-slate-400 break-words">{activePlan.subject} • Exam: {activePlan.examDate}</p>
              </div>
              <button
                onClick={() => {
                  AudioService.playTap();
                  onNavigateToTab('planner');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Open Plan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed break-words">
              {activePlan.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
