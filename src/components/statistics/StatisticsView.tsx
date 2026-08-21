import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Timer,
  Flame,
  Award,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { FocusSessionRecord, TaskItem, UserProfile } from '../../types';
import { AudioService } from '../../services/audioService';
import { getLocalDateString } from '../../services/storage';

interface StatisticsViewProps {
  sessions: FocusSessionRecord[];
  tasks: TaskItem[];
  profile: UserProfile;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  sessions,
  tasks,
  profile,
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const safeSessions = sessions || [];
  const safeTasks = tasks || [];

  // Compute metrics
  const completedSessions = safeSessions.filter((s) => s.completed);
  const totalStudyMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalStudyMinutes / 60).toFixed(1);

  const totalPomodoros = completedSessions.filter((s) => s.mode === 'pomodoro').length;
  const completedTasks = safeTasks.filter((t) => t.completed).length;
  const pendingTasks = safeTasks.filter((t) => !t.completed).length;
  const taskCompletionRate = safeTasks.length > 0 ? Math.round((completedTasks / safeTasks.length) * 100) : 0;

  // Subject-wise Breakdown
  const subjectMap: Record<string, number> = {};
  completedSessions.forEach((s) => {
    const subj = s.subject || 'General Study';
    subjectMap[subj] = (subjectMap[subj] || 0) + s.durationMinutes;
  });

  const subjectBreakdown = Object.entries(subjectMap)
    .map(([name, minutes]) => ({
      name,
      minutes,
      percentage: totalStudyMinutes > 0 ? Math.round((minutes / totalStudyMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  // Past 7 Days Graph Data
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dStr = getLocalDateString(d);
    const daySessions = completedSessions.filter((s) => s.date === dStr);
    const mins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    return {
      dayName: daysOfWeek[d.getDay()],
      dateStr: dStr,
      minutes: mins,
      hours: (mins / 60).toFixed(1),
    };
  });

  const maxMinutesInDay = Math.max(...last7DaysData.map((d) => d.minutes), 120);

  // Productivity Score
  const avgDailyTarget = profile.dailyStudyTargetMinutes || 180;
  const avgMinutesPerDay = Math.round(totalStudyMinutes / Math.max(1, last7DaysData.length));
  const overallScore = Math.min(100, Math.round(((avgMinutesPerDay / avgDailyTarget) * 0.6 + (taskCompletionRate / 100) * 0.4) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Productivity & Insights
          </h2>
          <p className="text-xs text-slate-400">Study hours, task completion & cognitive endurance</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                AudioService.playTap();
                setTimeRange(range);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Study Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Study Time</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalHours} <span className="text-xs font-normal text-slate-400">hours</span></p>
          <span className="text-[10px] text-blue-400">{completedSessions.length} total sessions</span>
        </div>

        {/* Focus Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Focus Score</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400">{overallScore}%</p>
          <span className="text-[10px] text-slate-400">Rank: Peak Scholar</span>
        </div>

        {/* Task Completion */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tasks Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {completedTasks} <span className="text-xs font-normal text-slate-400">/ {tasks.length}</span>
          </p>
          <span className="text-[10px] text-emerald-400">{taskCompletionRate}% completion rate</span>
        </div>

        {/* Streak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{profile.streakCount} <span className="text-xs font-normal text-slate-400">days</span></p>
          <span className="text-[10px] text-slate-400">Best: {profile.bestStreak || profile.streakCount} days</span>
        </div>
      </div>

      {/* 7-Day Study Time Activity Bar Graph */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Weekly Study Activity (Hours / Day)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Daily Goal: {(profile.dailyStudyTargetMinutes / 60).toFixed(1)}h
          </span>
        </div>

        {/* Custom Responsive SVG / HTML Bar Chart */}
        <div className="flex items-end justify-between gap-2 pt-6 pb-2 h-44 px-2">
          {last7DaysData.map((d, idx) => {
            const heightPercent = Math.min(100, Math.max(12, (d.minutes / maxMinutesInDay) * 100));
            const isToday = idx === 6;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip on hover */}
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-300 transition">
                  {d.hours}h
                </span>

                {/* Vertical Bar */}
                <div className="w-full max-w-[36px] bg-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-end h-28 relative p-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                    className={`w-full rounded-lg ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-600 to-sky-400 shadow-md shadow-blue-500/40'
                        : 'bg-gradient-to-t from-slate-700 to-blue-600/80 group-hover:from-blue-600 group-hover:to-indigo-500'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {d.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Breakdown & Productivity AI Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Subject-wise Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Subject Distribution
            </h3>
          </div>

          <div className="space-y-3">
            {subjectBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No session logs recorded yet.
              </p>
            ) : (
              subjectBreakdown.map((subj, idx) => {
                const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500'];
                const color = colors[idx % colors.length];

                return (
                  <div key={subj.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{subj.name}</span>
                      <span className="text-slate-400 font-mono">
                        {Math.floor(subj.minutes / 60)}h {subj.minutes % 60}m ({subj.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${subj.percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Cognitive Insights Card */}
        <div className="bg-slate-900/80 border border-indigo-900/40 rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Productivity Diagnosis
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-indigo-300">Peak Alertness Window</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Your highest focus ratings occur during {profile.preferredStudyTime} sessions. Schedule tough problem sets in this window!
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-emerald-300">Spaced Repetition Tip</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Review your high-priority notes within 24 hours of first study to retain up to 80% more cognitive detail.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-amber-300">Pomodoro Interval Flow</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You have completed {totalPomodoros} Pomodoro intervals. Consistent 5-minute movement breaks prevent mental fatigue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
