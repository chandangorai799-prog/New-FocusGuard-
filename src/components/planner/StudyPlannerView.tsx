import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  BookOpen,
  Target,
  Layers,
  ArrowRight,
  TrendingUp,
  Share2,
  Download,
  Flame,
  X,
  Award,
  Zap,
  Check,
  Printer,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyPlan, DifficultyLevel, StudyTimePreference, TaskItem } from '../../types';
import { AIService } from '../../services/aiService';
import { AudioService } from '../../services/audioService';

interface StudyPlannerViewProps {
  studyPlans: StudyPlan[];
  onAddPlan: (plan: StudyPlan) => void;
  onDeletePlan: (id: string) => void;
  onTogglePlanTask: (planId: string, taskId: string) => void;
  onImportToTasks: (tasks: Omit<TaskItem, 'id' | 'createdAt'>[]) => void;
  onOpenSyllabusImport?: () => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  studyPlans,
  onAddPlan,
  onDeletePlan,
  onTogglePlanTask,
  onImportToTasks,
  onOpenSyllabusImport,
}) => {
  const safePlans = studyPlans || [];
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'view'>('view');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(safePlans[0]?.id || '');

  // Form States matching the User Specification
  const [studentName, setStudentName] = useState<string>('Student');
  const [subject, setSubject] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>('');
  const [topicList, setTopicList] = useState<string[]>([]);
  const [examDate, setExamDate] = useState<string>('');
  const [daysAvailable, setDaysAvailable] = useState<number>(21);
  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [topicDifficulty, setTopicDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [preferredTime, setPreferredTime] = useState<StudyTimePreference>('Evening');
  const [dailyTarget, setDailyTarget] = useState<string>('Master 1 core topic + 15 practice problems');
  const [notes, setNotes] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string>('');

  const currentPlan = safePlans.find((p) => p.id === selectedPlanId) || safePlans[0];

  const subjectPresets = [
    'Java & OOP',
    'Data Structures & Algorithms',
    'Python Programming',
    'Physics & Mechanics',
    'Organic Chemistry',
    'Calculus & Linear Algebra',
    'Operating Systems',
    'Database Management (SQL)',
  ];

  const handleAddTopic = () => {
    const trimmed = topicInput.trim();
    if (!trimmed) return;
    AudioService.playTap();

    // Support comma separated entries in one go
    if (trimmed.includes(',')) {
      const parts = trimmed
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !topicList.includes(p));
      setTopicList([...topicList, ...parts]);
    } else if (!topicList.includes(trimmed)) {
      setTopicList([...topicList, trimmed]);
    }
    setTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    AudioService.playTap();
    setTopicList(topicList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setStatusNotice('Please enter a subject name.');
      return;
    }

    const topicsString = topicList.length > 0 ? topicList.join(', ') : topicInput.trim();
    if (!topicsString) {
      setStatusNotice('Please add at least one topic to study.');
      return;
    }

    AudioService.playTap();
    setIsGenerating(true);
    setStatusNotice('');

    try {
      const result = await AIService.generateStudyPlan({
        studentName,
        subject,
        topics: topicsString,
        topicList: topicList.length > 0 ? topicList : topicsString.split(',').map((t) => t.trim()),
        examDate: examDate || `In ${daysAvailable} days`,
        daysAvailable,
        hoursPerDay,
        difficulty,
        topicDifficulty,
        preferredTime,
        dailyTarget,
        notes,
      });

      onAddPlan(result.plan);
      setSelectedPlanId(result.plan.id);
      setActiveSubTab('view');
      AudioService.playCompletionChime();

      try {
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      } catch {}

      if (result.errorNotice) {
        setStatusNotice(result.errorNotice);
      }
    } catch (err: any) {
      console.error(err);
      setStatusNotice('AI service encountered an issue. Generated smart offline study schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncToTaskManager = () => {
    if (!currentPlan) return;
    AudioService.playTap();

    const tasksToImport: Omit<TaskItem, 'id' | 'createdAt'>[] = [];
    currentPlan.dailySchedule.forEach((day, dIdx) => {
      day.sessions.forEach((session, sIdx) => {
        const dueDate = new Date(Date.now() + dIdx * 86400000).toISOString().split('T')[0];
        tasksToImport.push({
          title: `[${currentPlan.subject}] ${session.topic}: ${session.activity}`,
          category: 'Study',
          priority: dIdx === 0 ? 'High' : 'Medium',
          dueDate,
          dueTime: '18:00',
          completed: false,
          estimatedMinutes: session.durationMinutes || 50,
          notes: session.goal,
          subject: currentPlan.subject,
        });
      });
    });

    onImportToTasks(tasksToImport);
    AudioService.playCompletionChime();
    alert(`Successfully synced ${tasksToImport.length} study schedule sessions to your Task Manager!`);
  };

  const handlePrintPlan = () => {
    AudioService.playTap();
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            AI Study Planner
          </h2>
          <p className="text-xs text-slate-400">
            Intelligent exam timetables, spaced repetition & milestone tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenSyllabusImport && (
            <button
              id="btn-planner-import-syllabus-pdf"
              type="button"
              onClick={() => {
                AudioService.playTap();
                onOpenSyllabusImport();
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 border border-indigo-400/30 transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Import Syllabus PDF</span>
            </button>
          )}

          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => {
                AudioService.playTap();
                setActiveSubTab('view');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeSubTab === 'view'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Schedules ({safePlans.length})
            </button>
            <button
              onClick={() => {
                AudioService.playTap();
                setActiveSubTab('create');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeSubTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Plan My Study
            </button>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl text-xs text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* CREATE NEW STUDY PLAN FORM */}
      {activeSubTab === 'create' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleGeneratePlan}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl"
        >
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Generate Structured Study Schedule
            </h3>
            <p className="text-xs text-slate-400">
              Provide your syllabus and exam details to calculate an optimized daily learning timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Subject / Course Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Subject / Course Name *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Java / Data Structures / Physics"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Subject Presets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {subjectPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    AudioService.playTap();
                    setSubject(preset);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    subject === preset
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Topics to Cover (Dynamic Chips + Add button) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Topics to Cover * (Type and hit Enter or "+ Add Topic")
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="e.g. JVM & Memory, OOP Inheritance, Multithreading, Exception Handling..."
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Topic
              </button>
            </div>

            {/* Render Topic Chips */}
            {topicList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {topicList.map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 text-xs font-medium animate-fadeIn"
                  >
                    <span>{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="hover:text-rose-300 transition"
                      title="Remove topic"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Exam Target Date */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Exam / Target Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Days Available for Study */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Days Available</label>
                <span className="text-xs font-bold text-indigo-400">{daysAvailable} Days</span>
              </div>
              <input
                type="range"
                min="3"
                max="90"
                step="1"
                value={daysAvailable}
                onChange={(e) => setDaysAvailable(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Available Hours Per Day */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Study Hours / Day</label>
                <span className="text-xs font-bold text-indigo-400">{hoursPerDay}h</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Preparation Level */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Preparation Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner (Foundations first)</option>
                <option value="Intermediate">Intermediate (Balanced pace)</option>
                <option value="Advanced">Advanced (High problem density)</option>
                <option value="Exam Cram">Exam Cram (High-yield sprint)</option>
              </select>
            </div>

            {/* Topic Difficulty */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Topic Difficulty
              </label>
              <select
                value={topicDifficulty}
                onChange={(e) => setTopicDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Easy">Easy (Conceptual / Introductory)</option>
                <option value="Medium">Medium (Standard Academic)</option>
                <option value="Hard">Hard (Complex / Rigorous)</option>
              </select>
            </div>

            {/* Preferred Study Time */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Preferred Study Slot
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value as StudyTimePreference)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Morning">Morning (06:00 - 11:00)</option>
                <option value="Afternoon">Afternoon (12:00 - 17:00)</option>
                <option value="Evening">Evening (18:00 - 22:00)</option>
                <option value="Night">Night Owl (22:00 - 02:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Target */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Daily Study Target
              </label>
              <input
                type="text"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder="e.g. 1 major topic + 15 practice MCQs"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Weak Areas & Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Weak Areas / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Weak in recursion, prioritize past papers"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-98"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Exam Blueprint & Daily Milestones...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Study Plan</span>
              </>
            )}
          </button>
        </motion.form>
      )}

      {/* VIEW STUDY PLANS */}
      {activeSubTab === 'view' && (
        <div className="space-y-6">
          {safePlans.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <Calendar className="w-12 h-12 text-indigo-400 mx-auto opacity-60" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Study Plans Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Import a syllabus PDF to automatically extract topics & milestones, or create a custom plan.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {onOpenSyllabusImport && (
                  <button
                    type="button"
                    onClick={() => {
                      AudioService.playTap();
                      onOpenSyllabusImport();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Import Syllabus PDF</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    AudioService.playTap();
                    setActiveSubTab('create');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700"
                >
                  Create Plan Manually
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Switcher Pills */}
              {safePlans.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {safePlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        AudioService.playTap();
                        setSelectedPlanId(plan.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                        currentPlan?.id === plan.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {plan.subject}
                    </button>
                  ))}
                </div>
              )}

              {currentPlan && (
                <div className="space-y-5">
                  {/* Plan Header Card */}
                  <div className="bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/90 px-2.5 py-0.5 rounded-full border border-indigo-800/60">
                            {currentPlan.difficultyLevel} • {currentPlan.preferredTime}
                          </span>
                          {currentPlan.projectedReadinessScore && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                              <Award className="w-3 h-3 text-emerald-400" />
                              {currentPlan.projectedReadinessScore}% Projected Readiness
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                          {currentPlan.title}
                        </h3>
                        <p className="text-xs text-slate-300 font-medium">
                          {currentPlan.subject} • Target Date: {currentPlan.examDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={handleSyncToTaskManager}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Import all schedule sessions into Task Manager"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Sync to Tasks</span>
                        </button>
                        <button
                          onClick={handlePrintPlan}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Print / Export Roadmap"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            AudioService.playTap();
                            if (confirm('Delete this study plan?')) {
                              onDeletePlan(currentPlan.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                      {currentPlan.summary}
                    </p>
                  </div>

                  {/* 1. Topic Priorities & Weightage Matrix */}
                  {currentPlan.topicPriorities && currentPlan.topicPriorities.length > 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Topic Priority & Weightage Matrix
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentPlan.topicPriorities.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{item.topic}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.priority === 'High'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : item.priority === 'Medium'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {item.priority} Priority ({item.estimatedHours}h)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {item.urgencyReason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Daily Schedule Timeline with Interactive Checkboxes */}
                  {currentPlan.dailySchedule && currentPlan.dailySchedule.length > 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Daily Schedule & Study Sessions
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400">Click session to mark done</span>
                      </div>

                      <div className="space-y-3">
                        {currentPlan.dailySchedule.map((day, dIdx) => (
                          <div
                            key={dIdx}
                            className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                              <span className="text-xs font-bold text-indigo-300">
                                {day.dayTitle}
                              </span>
                              <span className="text-[10px] text-slate-400">{day.timeSlot}</span>
                            </div>

                            <div className="space-y-2">
                              {day.sessions.map((session, sIdx) => {
                                const taskId = `plan-${currentPlan.id}-d${dIdx}-s${sIdx}`;
                                const isCompleted = currentPlan.completedTaskIds?.includes(taskId);

                                return (
                                  <div
                                    key={sIdx}
                                    onClick={() => onTogglePlanTask(currentPlan.id, taskId)}
                                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                                      isCompleted
                                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                                      <button type="button" className="text-slate-400 hover:text-blue-400 shrink-0">
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <Circle className="w-4 h-4 text-slate-500" />
                                        )}
                                      </button>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800/50">
                                            {session.time}
                                          </span>
                                          {session.durationMinutes && (
                                            <span className="text-[10px] text-slate-400">
                                              {session.durationMinutes}m
                                            </span>
                                          )}
                                          <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                                            {session.topic}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                          {session.activity} — Goal: {session.goal}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Spaced Repetition Cycles & Weekly Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Spaced Revision Schedule */}
                    {currentPlan.revisionSchedule && currentPlan.revisionSchedule.length > 0 && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Spaced Repetition Cycles
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {currentPlan.revisionSchedule.map((r, idx) => (
                            <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                              <div className="flex justify-between text-xs font-bold text-emerald-400">
                                <span>{r.stage}</span>
                                <span className="text-[10px] text-slate-400">{r.timing}</span>
                              </div>
                              <p className="text-[11px] text-slate-300">{r.method}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weekly Plan */}
                    {currentPlan.weeklyPlan && currentPlan.weeklyPlan.length > 0 && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-sky-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Weekly Milestones
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {currentPlan.weeklyPlan.map((w, idx) => (
                            <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                              <span className="text-xs font-bold text-sky-300">
                                Week {w.weekNumber}: {w.theme}
                              </span>
                              <p className="text-[11px] text-slate-300 font-medium">{w.milestone}</p>
                              {w.deliverables && (
                                <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5 pt-1">
                                  {w.deliverables.map((d, dIdx) => (
                                    <li key={dIdx}>{d}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. High-Yield Exam Preparation Strategy */}
                  {currentPlan.examPreparationStrategy && currentPlan.examPreparationStrategy.length > 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          High-Yield Exam Strategy & Trap Avoidance
                        </h4>
                      </div>
                      <ul className="space-y-1.5">
                        {currentPlan.examPreparationStrategy.map((tip, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                            <span className="text-amber-400 font-bold">#{idx + 1}</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
