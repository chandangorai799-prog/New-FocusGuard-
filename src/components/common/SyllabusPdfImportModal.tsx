import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  ListTodo,
  Check,
  RotateCcw,
  BookMarked,
  FileCheck,
  Sliders,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  TaskItem,
  TaskCategory,
  Priority,
  GeneratedSyllabusTask,
  SyllabusImportResult,
  StudyPlan,
} from '../../types';
import { PdfParserService, ParsedPdfData, SAMPLE_SYLLABUS_PRESETS, SyllabusPreset } from '../../services/pdfParserService';
import { AIService } from '../../services/aiService';
import { AudioService } from '../../services/audioService';

interface SyllabusPdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTasks: (newTasks: TaskItem[]) => void;
  onSaveStudyPlan?: (plan: StudyPlan) => void;
  studentName?: string;
}

type ModalStep = 'upload' | 'analyzing' | 'review' | 'success';

export const SyllabusPdfImportModal: React.FC<SyllabusPdfImportModalProps> = ({
  isOpen,
  onClose,
  onImportTasks,
  onSaveStudyPlan,
  studentName = 'Student',
}) => {
  const [step, setStep] = useState<ModalStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [pdfData, setPdfData] = useState<ParsedPdfData | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [subjectHint, setSubjectHint] = useState('');
  const [daysAvailable, setDaysAvailable] = useState<number>(14);
  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Analysis result states
  const [analysisResult, setAnalysisResult] = useState<SyllabusImportResult | null>(null);
  const [tasks, setTasks] = useState<GeneratedSyllabusTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgressText, setAnalysisProgressText] = useState('Reading PDF syllabus content...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle PDF file selection
  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf') && !file.type.includes('text')) {
      setErrorMessage('Please upload a valid PDF document or text syllabus file.');
      return;
    }

    try {
      setErrorMessage(null);
      AudioService.playTap();
      const parsed = await PdfParserService.extractTextFromPdf(file);
      setPdfData(parsed);

      // Auto detect subject name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      if (!subjectHint) {
        setSubjectHint(cleanName);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage('Could not process this file. You can paste the text manually below.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = (preset: SyllabusPreset) => {
    AudioService.playTap();
    setPdfData(null);
    setPastedText(preset.text);
    setSubjectHint(preset.subject);
    setShowPasteArea(true);
  };

  // Trigger AI generation
  const handleStartAnalysis = async () => {
    const rawText = (pdfData?.text || pastedText).trim();
    const hasPdfBase64 = !!pdfData?.base64;

    if (!hasPdfBase64 && !rawText) {
      setErrorMessage('Please upload a syllabus PDF or select a syllabus template to continue.');
      return;
    }

    setErrorMessage(null);
    setStep('analyzing');
    setIsProcessing(true);
    AudioService.playTap();

    // Visual step progress simulator
    const progressSteps = [
      'Scanning syllabus document structure & chapters...',
      'Deconstructing learning modules & topic weightage...',
      'Synthesizing spaced study roadmap & actionable tasks...',
      'Finalizing prioritized subtasks & review milestones...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < progressSteps.length) {
        setAnalysisProgressText(progressSteps[stepIdx]);
      }
    }, 1200);

    try {
      const result = await AIService.generateTasksFromSyllabus({
        pdfBase64: pdfData?.base64,
        mimeType: 'application/pdf',
        text: rawText,
        studentName,
        subjectHint: subjectHint || undefined,
        daysAvailable,
        hoursPerDay,
        difficulty,
      });

      clearInterval(interval);

      if (result && Array.isArray(result.tasks) && result.tasks.length > 0) {
        setAnalysisResult(result);
        setTasks(result.tasks);
        // Select all by default
        const allIds = new Set(result.tasks.map((t) => t.id));
        setSelectedTaskIds(allIds);
        setStep('review');
        AudioService.playCompletionChime();
      } else {
        throw new Error('No study tasks could be generated from this syllabus.');
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error('Syllabus analysis failed:', err);
      setErrorMessage(err.message || 'Analysis failed. Please check your document and retry.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle selection
  const toggleTaskSelection = (id: string) => {
    AudioService.playTap();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    AudioService.playTap();
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const deleteTask = (id: string) => {
    AudioService.playTap();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Final Import Action
  const handleConfirmImport = (saveAsStudyPlanToo: boolean = false) => {
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));

    if (selectedTasks.length === 0) {
      setErrorMessage('Please select at least one task to import.');
      return;
    }

    // Convert GeneratedSyllabusTask to full TaskItem
    const finalTaskItems: TaskItem[] = selectedTasks.map((st, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title: st.title,
      category: st.category as TaskCategory,
      priority: st.priority as Priority,
      dueDate: st.dueDate,
      dueTime: st.dueTime || '20:00',
      estimatedMinutes: st.estimatedMinutes || 60,
      actualMinutesSpent: 0,
      completed: false,
      subject: st.subject || analysisResult?.subject || subjectHint || 'Academic Course',
      notes: st.notes ? `${st.notes}${st.moduleName ? ` [Module: ${st.moduleName}]` : ''}` : undefined,
      subtasks: st.subtasks && st.subtasks.length > 0 ? st.subtasks : undefined,
      createdAt: new Date().toISOString(),
    }));

    onImportTasks(finalTaskItems);
    setImportedCount(finalTaskItems.length);

    // Optionally create study plan
    if (saveAsStudyPlanToo && onSaveStudyPlan && analysisResult) {
      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        studentName,
        title: `${analysisResult.subject} - Complete Syllabus Blueprint`,
        subject: analysisResult.subject,
        topics: analysisResult.modules.map((m) => m.unitTitle).join(', '),
        topicList: analysisResult.modules.map((m) => m.unitTitle),
        examDate: `In ${daysAvailable} days`,
        daysAvailable,
        hoursPerDay,
        dailyTarget: `Complete 1 module milestone & practice questions`,
        difficultyLevel: difficulty,
        preferredTime: 'Evening',
        summary: analysisResult.overview,
        recommendedDailyMinutes: hoursPerDay * 60,
        projectedReadinessScore: 92,
        topicPriorities: analysisResult.modules.map((m, idx) => ({
          topic: m.unitTitle,
          priority: idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'High',
          estimatedHours: m.estimatedHours || 6,
          urgencyReason: 'Core syllabus unit with major weightage',
          keyConcepts: m.keyTopics,
        })),
        dailySchedule: selectedTasks.map((t, i) => ({
          dayNumber: (i % daysAvailable) + 1,
          dayTitle: `Day ${(i % daysAvailable) + 1} - ${t.moduleName || t.category}`,
          date: t.dueDate,
          timeSlot: 'Evening (18:00 - 21:00)',
          focusTarget: t.title,
          sessions: [
            {
              time: '18:00 - 19:30',
              topic: t.title,
              activity: 'Concept study and note extraction',
              goal: 'Complete core reading and formulate summary',
              durationMinutes: t.estimatedMinutes || 60,
            },
          ],
        })),
        weeklyPlan: [
          {
            weekNumber: 1,
            theme: 'Foundation & Core Units',
            milestone: 'Master initial syllabus modules',
            deliverables: ['Module 1 & 2 comprehensive notes', 'Topic quizzes completed'],
          },
        ],
        revisionSchedule: [
          {
            stage: 'Mid-Syllabus Checkpoint',
            method: 'Active recall and formula cheat sheet review',
            timing: `Day ${Math.floor(daysAvailable / 2)}`,
          },
          {
            stage: 'Final Comprehensive Mock',
            method: 'Full syllabus timed simulation & past paper sprint',
            timing: '2 Days Before Exam',
          },
        ],
        practiceSchedule: [
          {
            phase: 'Topic Wise Practice',
            recommendedResource: 'Textbook & Standard Question Bank',
            targetScore: '85%+',
          },
        ],
        examPreparationStrategy: [
          'Deconstruct each syllabus unit systematically.',
          'Formulate condensed 1-page formula summaries for each unit.',
          'Solve past paper problems immediately following concept study.',
        ],
        createdAt: new Date().toISOString(),
        completedTaskIds: [],
      };

      onSaveStudyPlan(newPlan);
    }

    AudioService.playSuccess();
    setStep('success');
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeCategoryFilter === 'all') return true;
    return t.category.toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  const totalEstimatedMinutes = tasks
    .filter((t) => selectedTaskIds.has(t.id))
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  const totalHoursFormatted = (totalEstimatedMinutes / 60).toFixed(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl my-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Import Syllabus & Generate AI Tasks
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Smart AI
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Upload your syllabus PDF to automatically formulate structured, scheduled study tasks.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content based on step */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs font-semibold"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

            {/* STEP 1: Upload / Input */}
            {step === 'upload' && (
              <div className="space-y-6">
                {/* Drag & Drop Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : pdfData
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-zinc-700/80 hover:border-indigo-500/50 bg-zinc-950/40 hover:bg-zinc-900/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />

                  {pdfData ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <div className="text-zinc-100 font-semibold text-base">{pdfData.fileName}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-3">
                        <span>{pdfData.fileSizeFormatted}</span>
                        <span>•</span>
                        <span>{pdfData.numPages} {pdfData.numPages === 1 ? 'page' : 'pages'}</span>
                      </div>
                      <span className="mt-2 text-xs font-medium text-indigo-400 hover:underline">
                        Click or drag to replace PDF file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="text-zinc-100 font-medium text-base">
                        Click to select PDF or drag & drop syllabus here
                      </div>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Supports University, School & Competitive Exam syllabus PDFs (.pdf, .txt).
                      </p>
                    </div>
                  )}
                </div>

                {/* Pre-loaded Sample Presets for Quick Testing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <span>Or Pick a Ready Syllabus Template</span>
                    <span className="text-[11px] font-normal text-indigo-400">1-Click Fast Load</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SAMPLE_SYLLABUS_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-indigo-500/40 text-left transition-all group flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 flex items-center justify-center shrink-0 text-zinc-400 text-sm">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 truncate">
                            {preset.title}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">{preset.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Text Paste Option */}
                <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/30 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-zinc-300 hover:bg-zinc-800/40"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      Or Paste Syllabus Text directly
                    </span>
                    {showPasteArea ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showPasteArea && (
                    <div className="p-4 pt-0 space-y-2 border-t border-zinc-800/50">
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste syllabus modules, unit headers, and chapter bullet points here..."
                        rows={5}
                        className="w-full p-3 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500 resize-y"
                      />
                    </div>
                  )}
                </div>

                {/* Study Parameters Settings */}
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-4">
                  <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Target Task Schedule Parameters
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Subject Hint */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Subject / Course</label>
                      <input
                        type="text"
                        value={subjectHint}
                        onChange={(e) => setSubjectHint(e.target.value)}
                        placeholder="e.g. Physics / Data Structures"
                        className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Days Available */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Schedule Duration</label>
                      <select
                        value={daysAvailable}
                        onChange={(e) => setDaysAvailable(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value={7}>7 Days (Crash Sprint)</option>
                        <option value={14}>14 Days (Recommended)</option>
                        <option value={21}>21 Days (Balanced)</option>
                        <option value={30}>30 Days (Full Semester)</option>
                      </select>
                    </div>

                    {/* Daily Hours */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Daily Study Time</label>
                      <select
                        value={hoursPerDay}
                        onChange={(e) => setHoursPerDay(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value={2}>2 Hours / day</option>
                        <option value={3}>3 Hours / day</option>
                        <option value={4}>4 Hours / day</option>
                        <option value={6}>6 Hours / day (Intensive)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all text-sm group"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                    <span>Analyze Syllabus & Generate Actionable Tasks</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Analyzing State */}
            {step === 'analyzing' && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    AI
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-zinc-100">Generating Syllabus Tasks Roadmap</h3>
                  <p className="text-sm text-indigo-400 font-medium animate-pulse">{analysisProgressText}</p>
                  <p className="text-xs text-zinc-500">
                    Deconstructing syllabus chapters into manageable subtasks, due dates, and study priorities...
                  </p>
                </div>

                <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                    animate={{ x: [-200, 250] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Review & Customization */}
            {step === 'review' && analysisResult && (
              <div className="space-y-6">
                {/* Syllabus Overview Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                        Detected Course Syllabus
                      </span>
                      <h3 className="text-lg font-bold text-zinc-100">{analysisResult.subject}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{analysisResult.modules?.length || 0} Modules</span>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{totalHoursFormatted} Hours Total</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                    {analysisResult.overview}
                  </p>
                </div>

                {/* Bulk Controls & Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedTaskIds.size === tasks.length
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-zinc-600 bg-zinc-900'
                        }`}
                      >
                        {selectedTaskIds.size === tasks.length && <Check className="w-3 h-3" />}
                      </div>
                      <span>Select All ({selectedTaskIds.size}/{tasks.length})</span>
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {['all', 'study', 'assignment', 'revision', 'exam prep'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                          activeCategoryFilter === cat
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generated Task Cards List */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      No tasks found for this category filter.
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = selectedTaskIds.has(task.id);
                      const isExpanded = expandedTaskIds.has(task.id);

                      const categoryColors: Record<string, string> = {
                        Study: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        Assignment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        Revision: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        'Exam Prep': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                        Project: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      };

                      const priorityColors: Record<string, string> = {
                        Urgent: 'text-rose-400 font-bold',
                        High: 'text-amber-400 font-semibold',
                        Medium: 'text-zinc-400',
                        Low: 'text-zinc-500',
                      };

                      return (
                        <div
                          key={task.id}
                          className={`rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md'
                              : 'bg-zinc-950/40 border-zinc-800/40 opacity-70'
                          }`}
                        >
                          <div className="p-3.5 flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleTaskSelection(task.id)}
                              className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>

                            {/* Main Task Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span
                                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                                    categoryColors[task.category] || 'bg-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  {task.category}
                                </span>

                                <span className={`text-[11px] ${priorityColors[task.priority] || 'text-zinc-400'}`}>
                                  {task.priority} Priority
                                </span>

                                <span className="text-zinc-600 text-xs">•</span>

                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  {task.estimatedMinutes} mins
                                </span>

                                <span className="text-zinc-600 text-xs">•</span>

                                <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {task.dueDate}
                                </span>
                              </div>

                              <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                                {task.title}
                              </h4>

                              {task.notes && (
                                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                                  {task.notes}
                                </p>
                              )}

                              {/* Subtasks Accordion Toggle */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="mt-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskExpand(task.id)}
                                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                  >
                                    <ListTodo className="w-3.5 h-3.5" />
                                    <span>
                                      {task.subtasks.length} Actionable Subtasks Breakdown
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                                      {task.subtasks.map((st, sIdx) => (
                                        <div
                                          key={st.id || sIdx}
                                          className="text-xs text-zinc-300 flex items-start gap-2"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                          <span className="leading-relaxed">{st.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Delete Task Button */}
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
                              title="Remove Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Import Action Options Footer */}
                <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('upload')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Upload Different Syllabus</span>
                  </button>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                    {onSaveStudyPlan && (
                      <button
                        type="button"
                        onClick={() => handleConfirmImport(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Import Tasks & Create Study Plan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleConfirmImport(false)}
                      disabled={selectedTaskIds.size === 0}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Import {selectedTaskIds.size} Tasks to Task Manager</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Success Message */}
            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-bold text-zinc-100">
                    {importedCount} Syllabus Tasks Added!
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Your tasks have been scheduled across your study calendar with detailed subtasks and priority tags.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    View Tasks in Task Manager
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
