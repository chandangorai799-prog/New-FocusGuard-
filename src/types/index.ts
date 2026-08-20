export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskPriority = Priority;
export type TaskCategory = 'Study' | 'Assignment' | 'Revision' | 'Project' | 'Exam Prep' | 'Personal' | 'Exam' | 'Other';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Exam Cram';
export type StudyTimePreference = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type NavigationTab = 'dashboard' | 'focus' | 'pomodoro' | 'planner' | 'assistant' | 'tasks' | 'statistics' | 'profile' | 'exams' | 'revision' | 'achievements' | 'ai' | 'appblocker' | 'appBlocker';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  completed: boolean;
  completedAt?: string;
  estimatedMinutes?: number;
  actualMinutesSpent?: number;
  notes?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  subject?: string;
  createdAt: string;
}

export interface ExamItem {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time?: string;
  topics: string[];
  preparationPercentage: number; // 0-100
  targetScore?: string;
  locationOrRoom?: string;
  notes?: string;
  importance?: 'High' | 'Medium' | 'Critical';
}

export interface QuizResult {
  id: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  accuracy: number; // 0-100%
  date: string; // YYYY-MM-DD
  difficulty?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'focus' | 'streak' | 'study' | 'quiz' | 'pomodoro';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  targetValue: number;
}

export interface FocusSessionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  durationMinutes: number;
  mode: 'focus' | 'pomodoro';
  subject?: string;
  notes?: string;
  rating?: number; // 1-5
  completed: boolean;
  xpEarned?: number;
}

export interface PomodoroSettings {
  focusDuration: number; // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number; // in minutes (default 15)
  longBreakInterval: number; // default 4 sessions
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface FocusSettings {
  defaultDuration: number; // minutes (default 45)
  shieldModeEnabled: boolean;
  ambientSound: 'none' | 'binaural' | 'rain' | 'whitenoise' | 'lofi' | 'space' | 'stream';
  ambientVolume: number; // 0-1
  strictMode: boolean; // lock screen simulation
}

export interface TopicPriority {
  topic: string;
  priority: 'High' | 'Medium' | 'Low';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedHours: number;
  urgencyReason: string;
  keyConcepts?: string[];
}

export interface DailyScheduleSession {
  time: string;
  topic: string;
  activity: string;
  goal: string;
  durationMinutes?: number;
}

export interface DailyScheduleDay {
  dayNumber: number;
  dayTitle: string;
  date?: string;
  timeSlot: string;
  focusTarget?: string;
  sessions: DailyScheduleSession[];
}

export interface WeeklyPlanItem {
  weekNumber: number;
  theme: string;
  milestone: string;
  deliverables: string[];
}

export interface RevisionStage {
  stage: string;
  method: string;
  timing: string;
}

export interface PracticePhase {
  phase: string;
  recommendedResource: string;
  targetScore: string;
}

export interface StudyPlan {
  id: string;
  studentName?: string;
  title: string;
  subject: string;
  topics: string;
  topicList?: string[];
  examDate: string;
  daysAvailable?: number;
  hoursPerDay: number;
  dailyTarget?: string;
  difficultyLevel: DifficultyLevel;
  preferredTime: StudyTimePreference;
  summary: string;
  recommendedDailyMinutes: number;
  projectedReadinessScore?: number; // 0 - 100%
  topicPriorities: TopicPriority[];
  dailySchedule: DailyScheduleDay[];
  weeklyPlan: WeeklyPlanItem[];
  revisionSchedule: RevisionStage[];
  practiceSchedule: PracticePhase[];
  examPreparationStrategy: string[];
  createdAt: string;
  completedTaskIds?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizData {
  title: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardDeck {
  deckTitle: string;
  cards: Flashcard[];
}

export type AssistantMode =
  | 'chat'
  | 'quiz'
  | 'mcq'
  | 'summarize'
  | 'explain'
  | 'simple_explain'
  | 'important_questions'
  | 'flashcards'
  | 'short_answer'
  | 'revision_notes';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  mode?: AssistantMode;
  text?: string;
  quizData?: QuizData;
  flashcardDeck?: FlashcardDeck;
  isError?: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  gradeOrGoal: string;
  dailyStudyTargetMinutes: number; // default 180 (3 hrs)
  dailyPomodoroTarget: number; // default 6
  preferredStudyTime: StudyTimePreference;
  primarySubject: string;
  onboardingCompleted: boolean;
  theme: 'dark' | 'light' | 'system';
  streakCount: number;
  bestStreak: number;
  lastActiveDate: string;
  soundVolume: number;
  hapticFeedback: boolean;
  blockedAppsCount: number;
  androidNotificationsEnabled: boolean;
  xp: number;
  level: number;
  studyReminderTime?: string; // e.g. "19:00"
  studyReminderEnabled?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'pomodoro' | 'focus' | 'task' | 'exam' | 'system';
  read: boolean;
}

export type AppBlockerCategory =
  | 'Social'
  | 'Entertainment'
  | 'Gaming'
  | 'Messaging'
  | 'Shopping'
  | 'Browser'
  | 'Productivity'
  | 'Other';

export interface BlockedApp {
  id: string;
  name: string;
  packageName?: string;
  category: AppBlockerCategory;
  icon: string; // emoji or icon key
  isBlocked: boolean;
  isCustom?: boolean;
  blockReason?: string;
}

export type FocusSessionState = 'IDLE' | 'FOCUS_ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type AndroidPermissionKey =
  | 'usage_stats'
  | 'overlay'
  | 'notifications'
  | 'accessibility'
  | 'dnd';

export interface AndroidPermissionInfo {
  key: AndroidPermissionKey;
  name: string;
  manifestPermission: string;
  required: boolean;
  isGranted: boolean;
  description: string;
  rationale: string;
  settingsAction: string;
  minApiLevel: number;
}

export interface ActiveBlockingSession {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  initialDurationMinutes: number;
  remainingSeconds: number;
  blockedPackages: string[];
  status: FocusSessionState;
  mode: 'focus' | 'pomodoro';
  subject?: string;
  notes?: string;
}

export interface AndroidSystemStatus {
  apiLevel: number;
  androidVersion: string;
  deviceManufacturer: string;
  deviceModel: string;
  batteryOptimizationsIgnored: boolean;
  accessibilityServiceEnabled: boolean;
  usageStatsGranted: boolean;
  overlayGranted: boolean;
  notificationsGranted: boolean;
  dndAccessGranted: boolean;
  foregroundServiceRunning: boolean;
}



