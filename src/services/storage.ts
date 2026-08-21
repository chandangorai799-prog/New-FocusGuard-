import {
  TaskItem,
  FocusSessionRecord,
  PomodoroSettings,
  FocusSettings,
  StudyPlan,
  ChatMessage,
  UserProfile,
  AppNotification,
  ExamItem,
  QuizResult,
  Achievement,
  BlockedApp,
  AppBlockerCategory,
  ActiveBlockingSession,
} from '../types';
import { AndroidNativeBridge } from './androidNativeBridge';

const STORAGE_KEYS = {
  PROFILE: 'focusguard_profile',
  TASKS: 'focusguard_tasks',
  SESSIONS: 'focusguard_sessions',
  POMODORO_SETTINGS: 'focusguard_pomodoro_settings',
  FOCUS_SETTINGS: 'focusguard_focus_settings',
  STUDY_PLANS: 'focusguard_study_plans',
  CHAT_MESSAGES: 'focusguard_chat_messages',
  NOTIFICATIONS: 'focusguard_notifications',
  EXAMS: 'focusguard_exams',
  QUIZ_RESULTS: 'focusguard_quiz_results',
  ACHIEVEMENTS: 'focusguard_achievements',
  BLOCKED_APPS: 'focusguard_blocked_apps',
  ACTIVE_BLOCKING_SESSION: 'focusguard_active_blocking_session',
  ANDROID_PERMISSIONS: 'focusguard_android_permissions',
};

export const DEFAULT_BLOCKED_APPS: BlockedApp[] = [
  // Social Media
  { id: 'app-instagram', name: 'Instagram', packageName: 'com.instagram.android', category: 'Social', icon: '📷', isBlocked: true },
  { id: 'app-tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', category: 'Social', icon: '🎵', isBlocked: true },
  { id: 'app-snapchat', name: 'Snapchat', packageName: 'com.snapchat.android', category: 'Social', icon: '👻', isBlocked: true },
  { id: 'app-twitter', name: 'X (Twitter)', packageName: 'com.twitter.android', category: 'Social', icon: '🐦', isBlocked: true },
  { id: 'app-reddit', name: 'Reddit', packageName: 'com.reddit.frontpage', category: 'Social', icon: '🤖', isBlocked: true },
  { id: 'app-facebook', name: 'Facebook', packageName: 'com.facebook.katana', category: 'Social', icon: '👤', isBlocked: true },
  { id: 'app-pinterest', name: 'Pinterest', packageName: 'com.pinterest', category: 'Social', icon: '📌', isBlocked: false },
  { id: 'app-threads', name: 'Threads', packageName: 'com.instagram.barcelona', category: 'Social', icon: '🧵', isBlocked: true },

  // Video & Entertainment
  { id: 'app-youtube', name: 'YouTube (Shorts)', packageName: 'com.google.android.youtube', category: 'Entertainment', icon: '▶️', isBlocked: true },
  { id: 'app-netflix', name: 'Netflix', packageName: 'com.netflix.mediaclient', category: 'Entertainment', icon: '🎬', isBlocked: true },
  { id: 'app-twitch', name: 'Twitch', packageName: 'tv.twitch.android.app', category: 'Entertainment', icon: '👾', isBlocked: true },
  { id: 'app-hotstar', name: 'Disney+ Hotstar', packageName: 'in.startv.hotstar', category: 'Entertainment', icon: '🌟', isBlocked: true },
  { id: 'app-prime', name: 'Amazon Prime Video', packageName: 'com.amazon.avod.thirdpartyclient', category: 'Entertainment', icon: '🍿', isBlocked: true },
  { id: 'app-spotify', name: 'Spotify', packageName: 'com.spotify.music', category: 'Entertainment', icon: '🎧', isBlocked: false },

  // Gaming
  { id: 'app-bgmi', name: 'BGMI / PUBG Mobile', packageName: 'com.pubg.imobile', category: 'Gaming', icon: '🪖', isBlocked: true },
  { id: 'app-freefire', name: 'Free Fire MAX', packageName: 'com.dts.freefiremax', category: 'Gaming', icon: '🔥', isBlocked: true },
  { id: 'app-roblox', name: 'Roblox', packageName: 'com.roblox.client', category: 'Gaming', icon: '🧱', isBlocked: true },
  { id: 'app-genshin', name: 'Genshin Impact', packageName: 'com.miHoYo.GenshinImpact', category: 'Gaming', icon: '⚔️', isBlocked: true },
  { id: 'app-coc', name: 'Clash of Clans', packageName: 'com.supercell.clashofclans', category: 'Gaming', icon: '🏰', isBlocked: true },
  { id: 'app-candycrush', name: 'Candy Crush Saga', packageName: 'com.king.candycrushsaga', category: 'Gaming', icon: '🍬', isBlocked: true },
  { id: 'app-chess', name: 'Chess.com', packageName: 'com.chess', category: 'Gaming', icon: '♟️', isBlocked: false },

  // Messaging
  { id: 'app-whatsapp', name: 'WhatsApp', packageName: 'com.whatsapp', category: 'Messaging', icon: '💬', isBlocked: false },
  { id: 'app-discord', name: 'Discord', packageName: 'com.discord', category: 'Messaging', icon: '🎙️', isBlocked: true },
  { id: 'app-telegram', name: 'Telegram', packageName: 'org.telegram.messenger', category: 'Messaging', icon: '✈️', isBlocked: true },
  { id: 'app-messenger', name: 'Messenger', packageName: 'com.facebook.orca', category: 'Messaging', icon: '💬', isBlocked: false },

  // Shopping
  { id: 'app-amazon', name: 'Amazon Shopping', packageName: 'com.amazon.mShop.android.shopping', category: 'Shopping', icon: '🛍️', isBlocked: true },
  { id: 'app-flipkart', name: 'Flipkart', packageName: 'com.flipkart.android', category: 'Shopping', icon: '🛒', isBlocked: true },
  { id: 'app-myntra', name: 'Myntra Fashion', packageName: 'com.myntra.android', category: 'Shopping', icon: '👗', isBlocked: true },

  // Browser
  { id: 'app-chrome', name: 'Google Chrome', packageName: 'com.android.chrome', category: 'Browser', icon: '🌐', isBlocked: false },
];

// Default User Profile
const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Chen',
  avatar: '🎓',
  gradeOrGoal: 'Computer Science & Engineering (Semester 6)',
  dailyStudyTargetMinutes: 180, // 3 hours
  dailyPomodoroTarget: 6,
  preferredStudyTime: 'Evening',
  primarySubject: 'Data Structures & Algorithms',
  onboardingCompleted: true,
  theme: 'dark',
  streakCount: 7,
  bestStreak: 14,
  lastActiveDate: new Date().toISOString().split('T')[0],
  soundVolume: 0.8,
  hapticFeedback: true,
  blockedAppsCount: 28,
  androidNotificationsEnabled: true,
  xp: 450,
  level: 4,
  studyReminderTime: '17:00', // 5:00 PM Evening Focus Alert
  studyReminderEnabled: true,
};

// Default Pomodoro Settings
const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Default Focus Settings
const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  defaultDuration: 45,
  shieldModeEnabled: true,
  ambientSound: 'binaural',
  ambientVolume: 0.4,
  strictMode: false,
};

/**
 * Device Local Date Helpers
 * Ensures reliable calendar-day comparisons across all timezones.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDateFromIso(isoString?: string): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return getLocalDateString(d);
}

/**
 * Checks whether a completed task is from a previous calendar day (yesterday or earlier).
 * - Completed tasks completed today remain visible for the rest of today.
 * - Incomplete/pending tasks are NEVER removed.
 */
export function isTaskExpiredCompleted(task: TaskItem, todayStr: string = getLocalDateString()): boolean {
  if (!task.completed) {
    return false;
  }

  // 1. If completedAt timestamp exists, compare against local today
  if (task.completedAt) {
    const completedDate = getLocalDateFromIso(task.completedAt);
    if (completedDate) {
      return completedDate < todayStr;
    }
  }

  // 2. Fallback if completedAt wasn't recorded: check dueDate
  if (task.dueDate && task.dueDate < todayStr) {
    return true;
  }

  // 3. Fallback: check createdAt
  if (task.createdAt) {
    const createdDate = getLocalDateFromIso(task.createdAt);
    if (createdDate && createdDate < todayStr) {
      return true;
    }
  }

  return false;
}

// Initial Seed Tasks Generator
export function getInitialTasks(): TaskItem[] {
  const today = getLocalDateString();
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));
  const inTwoDays = getLocalDateString(new Date(Date.now() + 2 * 86400000));

  return [
    {
      id: 'task-1',
      title: 'Review Dynamic Programming & Memoization Patterns',
      category: 'Study',
      priority: 'High',
      dueDate: today,
      dueTime: '18:00',
      completed: true,
      completedAt: new Date().toISOString(),
      estimatedMinutes: 60,
      actualMinutesSpent: 55,
      notes: 'Solve LeetCode #70 (Climbing Stairs) and #322 (Coin Change).',
      subject: 'Algorithms',
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-1', title: 'Top-down recursive memoization', completed: true },
        { id: 'sub-2', title: 'Bottom-up DP table iteration', completed: true },
        { id: 'sub-3', title: 'Space optimization to O(1)', completed: false },
      ],
    },
    {
      id: 'task-2',
      title: 'Complete Linear Algebra Eigenvalues Assignment',
      category: 'Assignment',
      priority: 'High',
      dueDate: today,
      dueTime: '21:30',
      completed: false,
      estimatedMinutes: 90,
      actualMinutesSpent: 25,
      notes: 'Problems 4.1 through 4.8 from Gilbert Strang textbook.',
      subject: 'Mathematics',
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-4', title: 'Find characteristic polynomials', completed: true },
        { id: 'sub-5', title: 'Compute eigenvectors and eigenspaces', completed: false },
        { id: 'sub-6', title: 'Diagonalize 3x3 matrix', completed: false },
      ],
    },
    {
      id: 'task-3',
      title: 'Operating Systems Process Scheduling Quiz Prep',
      category: 'Exam',
      priority: 'Medium',
      dueDate: tomorrow,
      dueTime: '15:00',
      completed: false,
      estimatedMinutes: 45,
      notes: 'Round Robin vs Shortest Job First scheduling algorithms with Gantt charts.',
      subject: 'Operating Systems',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Summarize Database Normalization Forms (1NF to BCNF)',
      category: 'Study',
      priority: 'Medium',
      dueDate: inTwoDays,
      dueTime: '20:00',
      completed: false,
      estimatedMinutes: 40,
      notes: 'Create 1-page comparison chart for exam cheat sheet.',
      subject: 'Database Systems',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Organize study desk & water bottle prep',
      category: 'Personal',
      priority: 'Low',
      dueDate: today,
      completed: true,
      completedAt: new Date().toISOString(),
      estimatedMinutes: 10,
      actualMinutesSpent: 10,
      createdAt: new Date().toISOString(),
    },
  ];
}

const INITIAL_TASKS: TaskItem[] = getInitialTasks();

// Initial Seed Exams
const INITIAL_EXAMS: ExamItem[] = [
  {
    id: 'exam-1',
    title: 'Data Structures & Algorithms Midterm',
    subject: 'Algorithms',
    date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    time: '10:00 AM',
    topics: ['Dynamic Programming', 'Graph Algorithms', 'Trees & Heaps', 'Complexity Analysis'],
    preparationPercentage: 75,
    targetScore: '90%+',
    locationOrRoom: 'Hall B - Room 204',
    notes: 'Focus heavily on DP memoization and Dijkstra shortest path.',
    importance: 'Critical',
  },
  {
    id: 'exam-2',
    title: 'Linear Algebra Final Assessment',
    subject: 'Mathematics',
    date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    time: '02:00 PM',
    topics: ['Eigenvalues & Eigenvectors', 'Orthogonality & SVD', 'Vector Spaces', 'Matrix Transformations'],
    preparationPercentage: 55,
    targetScore: '85%+',
    locationOrRoom: 'Science Building A3',
    notes: 'Bring scientific calculator and student ID card.',
    importance: 'High',
  },
  {
    id: 'exam-3',
    title: 'Database Systems Quiz 2',
    subject: 'Database Systems',
    date: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    time: '11:30 AM',
    topics: ['Normalization (1NF to BCNF)', 'SQL Query Optimization', 'Transactions & ACID'],
    preparationPercentage: 40,
    targetScore: '95%+',
    locationOrRoom: 'Lab 4',
    notes: 'Revision on BCNF decomposition examples.',
    importance: 'Medium',
  },
];

// Initial Seed Quiz Results (for Smart Revision)
const INITIAL_QUIZ_RESULTS: QuizResult[] = [
  {
    id: 'quiz-1',
    subject: 'Algorithms',
    topic: 'Dynamic Programming & Memoization',
    score: 4,
    totalQuestions: 5,
    accuracy: 80,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    difficulty: 'Medium',
  },
  {
    id: 'quiz-2',
    subject: 'Mathematics',
    topic: 'Eigenvalues & Diagonalization',
    score: 3,
    totalQuestions: 5,
    accuracy: 60,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    difficulty: 'Hard',
  },
  {
    id: 'quiz-3',
    subject: 'Operating Systems',
    topic: 'Process Synchronization & Semaphores',
    score: 2,
    totalQuestions: 4,
    accuracy: 50,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    difficulty: 'Hard',
  },
];

// Initial Seed Sessions (Past 7 days)
function getInitialSessions(): FocusSessionRecord[] {
  const sessions: FocusSessionRecord[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const count = i === 0 ? 3 : Math.floor(Math.random() * 2) + 2;
    for (let s = 0; s < count; s++) {
      const duration = s % 2 === 0 ? 25 : 45;
      sessions.push({
        id: `session-${i}-${s}`,
        date: dateStr,
        startTime: `${14 + s * 2}:00`,
        durationMinutes: duration,
        mode: duration === 25 ? 'pomodoro' : 'focus',
        subject: s % 2 === 0 ? 'Algorithms' : 'Mathematics',
        rating: 5,
        completed: true,
        xpEarned: duration === 25 ? 15 : 25,
        notes: 'Great flow state, no distractions.',
      });
    }
  }
  return sessions;
}

// Initial Notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '🔥 7-Day Study Streak!',
    message: 'Awesome consistency! You hit your daily study goal 7 days in a row.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'system',
    read: false,
  },
  {
    id: 'notif-2',
    title: '⏰ Assignment Reminder',
    message: 'Linear Algebra Assignment is due tonight at 9:30 PM.',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    type: 'task',
    read: true,
  },
  {
    id: 'notif-3',
    title: '📅 Exam Approaching',
    message: 'Data Structures & Algorithms Midterm is in 4 days. Time for revision!',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'exam',
    read: false,
  },
];

export const StorageService = {
  // Profile
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        return DEFAULT_PROFILE;
      }
      const parsed = JSON.parse(data);
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  },

  // XP and Level Management
  addXP(amount: number): { newXp: number; newLevel: number; leveledUp: boolean } {
    const profile = this.getProfile();
    const currentXp = profile.xp || 0;
    const newXp = currentXp + amount;
    const currentLevel = profile.level || 1;
    const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
    const leveledUp = newLevel > currentLevel;

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
    };
    this.saveProfile(updatedProfile);

    if (leveledUp) {
      this.addNotification({
        title: `🎉 Level Up! You reached Level ${newLevel}!`,
        message: `Keep up the great momentum! You now have ${newXp} XP.`,
        type: 'system',
      });
    }

    return { newXp, newLevel, leveledUp };
  },

  updateStreak(): UserProfile {
    const profile = this.getProfile();
    const today = getLocalDateString();
    const lastActive = profile.lastActiveDate;

    if (lastActive === today) {
      return profile;
    }

    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    let newStreak = profile.streakCount || 0;

    if (lastActive === yesterday) {
      newStreak += 1;
    } else if (!lastActive) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }

    const best = Math.max(newStreak, profile.bestStreak || 0);
    const updated: UserProfile = {
      ...profile,
      streakCount: newStreak,
      bestStreak: best,
      lastActiveDate: today,
    };
    this.saveProfile(updated);
    return updated;
  },

  // Tasks
  getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      let list: TaskItem[] = [];
      if (!data) {
        list = getInitialTasks();
      } else {
        const parsed = JSON.parse(data);
        list = Array.isArray(parsed) ? parsed : getInitialTasks();
      }

      // Automatically filter out tasks completed on previous calendar days
      const todayStr = getLocalDateString();
      const cleaned = list.filter((task) => !isTaskExpiredCompleted(task, todayStr));

      if (cleaned.length !== list.length || !data) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return getInitialTasks();
    }
  },

  /**
   * Cleans all tasks completed on yesterday or earlier calendar days.
   * Today's tasks (completed or pending) and future/past incomplete tasks remain untouched.
   */
  cleanExpiredCompletedTasks(todayStr: string = getLocalDateString()): { cleaned: TaskItem[]; removedCount: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return { cleaned: [], removedCount: 0 };
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return { cleaned: [], removedCount: 0 };

      const cleaned = parsed.filter((task: TaskItem) => !isTaskExpiredCompleted(task, todayStr));
      const removedCount = parsed.length - cleaned.length;

      if (removedCount > 0) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(cleaned));
      }

      return { cleaned, removedCount };
    } catch (e) {
      console.error('Failed to clean expired completed tasks:', e);
      return { cleaned: [], removedCount: 0 };
    }
  },

  saveTasks(tasks: TaskItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  },

  addTask(task: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const tasks = this.getTasks();
    const newTask: TaskItem = {
      ...task,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      dueDate: task.dueDate || getLocalDateString(),
      completed: task.completed ?? false,
      completedAt: task.completed ? (task.completedAt || new Date().toISOString()) : undefined,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  updateTask(taskOrId: string | TaskItem, updates?: Partial<TaskItem>): TaskItem | null {
    const tasks = this.getTasks();
    const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    const taskUpdates = typeof taskOrId === 'object' ? taskOrId : updates || {};
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = tasks[index];
    const willBeCompleted = taskUpdates.completed !== undefined ? taskUpdates.completed : current.completed;
    let completedAt = taskUpdates.completedAt !== undefined ? taskUpdates.completedAt : current.completedAt;

    if (willBeCompleted && !completedAt) {
      completedAt = new Date().toISOString();
    } else if (!willBeCompleted) {
      completedAt = undefined;
    }

    tasks[index] = {
      ...current,
      ...taskUpdates,
      completed: willBeCompleted,
      completedAt,
    };
    this.saveTasks(tasks);
    return tasks[index];
  },

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length !== tasks.length) {
      this.saveTasks(filtered);
      return true;
    }
    return false;
  },

  toggleTaskComplete(id: string): TaskItem | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const isComp = !tasks[index].completed;
    tasks[index] = {
      ...tasks[index],
      completed: isComp,
      completedAt: isComp ? new Date().toISOString() : undefined,
    };
    this.saveTasks(tasks);

    if (isComp) {
      this.addXP(10); // +10 XP for task completion
    }

    return tasks[index];
  },

  // Focus & Pomodoro Sessions
  getSessions(): FocusSessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) {
        const seeded = getInitialSessions();
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : getInitialSessions();
    } catch {
      return getInitialSessions();
    }
  },

  saveSessions(sessions: FocusSessionRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  },

  recordSession(session: Omit<FocusSessionRecord, 'id'>): FocusSessionRecord {
    const sessions = this.getSessions();
    const xpGained = session.durationMinutes >= 45 ? 30 : session.durationMinutes >= 25 ? 20 : 10;
    const newSession: FocusSessionRecord = {
      ...session,
      id: 'session-' + Date.now(),
      xpEarned: xpGained,
    };
    sessions.push(newSession);
    this.saveSessions(sessions);
    this.updateStreak();
    this.addXP(xpGained);
    return newSession;
  },

  // Exams Management
  getExams(): ExamItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
        return INITIAL_EXAMS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  },

  saveExams(exams: ExamItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.error('Failed to save exams:', e);
    }
  },

  addExam(exam: Omit<ExamItem, 'id'>): ExamItem {
    const exams = this.getExams();
    const newExam: ExamItem = {
      ...exam,
      id: 'exam-' + Date.now(),
    };
    exams.push(newExam);
    // Sort by date
    exams.sort((a, b) => a.date.localeCompare(b.date));
    this.saveExams(exams);
    this.addXP(15);
    return newExam;
  },

  updateExam(id: string, updates: Partial<ExamItem>): ExamItem | null {
    const exams = this.getExams();
    const idx = exams.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    exams[idx] = { ...exams[idx], ...updates };
    exams.sort((a, b) => a.date.localeCompare(b.date));
    this.saveExams(exams);
    return exams[idx];
  },

  deleteExam(id: string): boolean {
    const exams = this.getExams();
    const filtered = exams.filter((e) => e.id !== id);
    if (filtered.length !== exams.length) {
      this.saveExams(filtered);
      return true;
    }
    return false;
  },

  // Quiz Results & Smart Revision
  getQuizResults(): QuizResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(INITIAL_QUIZ_RESULTS));
        return INITIAL_QUIZ_RESULTS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_QUIZ_RESULTS;
    } catch {
      return INITIAL_QUIZ_RESULTS;
    }
  },

  saveQuizResults(results: QuizResult[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
    } catch (e) {
      console.error('Failed to save quiz results:', e);
    }
  },

  recordQuizResult(result: Omit<QuizResult, 'id' | 'date'>): QuizResult {
    const results = this.getQuizResults();
    const newResult: QuizResult = {
      ...result,
      id: 'quiz-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    results.unshift(newResult);
    this.saveQuizResults(results);
    this.addXP(25);
    return newResult;
  },

  // Dynamic Achievements
  getAchievements(): Achievement[] {
    const sessions = this.getSessions();
    const tasks = this.getTasks();
    const profile = this.getProfile();
    const quizResults = this.getQuizResults();
    const studyPlans = this.getStudyPlans();

    const totalSessions = sessions.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pomodoroSessions = sessions.filter((s) => s.mode === 'pomodoro').length;
    const highAccuracyQuiz = quizResults.some((q) => q.accuracy >= 80);
    const longFocusSession = sessions.some((s) => s.durationMinutes >= 60);
    const streak = profile.streakCount || 1;

    return [
      {
        id: 'ach-1',
        title: 'First Focus 🎯',
        description: 'Complete your first deep focus session.',
        icon: '🎯',
        category: 'focus',
        xpReward: 50,
        unlocked: totalSessions >= 1,
        currentValue: Math.min(1, totalSessions),
        targetValue: 1,
      },
      {
        id: 'ach-2',
        title: '7-Day Warrior 🔥',
        description: 'Maintain a 7-day study streak.',
        icon: '🔥',
        category: 'streak',
        xpReward: 100,
        unlocked: streak >= 7,
        currentValue: streak,
        targetValue: 7,
      },
      {
        id: 'ach-3',
        title: 'Task Conqueror ✅',
        description: 'Complete 10 study or assignment tasks.',
        icon: '✅',
        category: 'study',
        xpReward: 75,
        unlocked: completedTasks >= 10,
        currentValue: completedTasks,
        targetValue: 10,
      },
      {
        id: 'ach-4',
        title: 'Pomodoro Pro ⏱️',
        description: 'Complete 15 Pomodoro study intervals.',
        icon: '⏱️',
        category: 'pomodoro',
        xpReward: 120,
        unlocked: pomodoroSessions >= 15,
        currentValue: pomodoroSessions,
        targetValue: 15,
      },
      {
        id: 'ach-5',
        title: 'Quiz Master 🧠',
        description: 'Achieve 80%+ accuracy in any AI Quiz.',
        icon: '🧠',
        category: 'quiz',
        xpReward: 80,
        unlocked: highAccuracyQuiz,
        currentValue: highAccuracyQuiz ? 1 : 0,
        targetValue: 1,
      },
      {
        id: 'ach-6',
        title: 'Deep Diver 🌊',
        description: 'Complete a continuous 60-minute focus session.',
        icon: '🌊',
        category: 'focus',
        xpReward: 100,
        unlocked: longFocusSession,
        currentValue: longFocusSession ? 1 : 0,
        targetValue: 1,
      },
      {
        id: 'ach-7',
        title: 'Plan Architect 📐',
        description: 'Generate and save a personalized AI Study Plan.',
        icon: '📐',
        category: 'study',
        xpReward: 60,
        unlocked: studyPlans.length >= 1,
        currentValue: studyPlans.length,
        targetValue: 1,
      },
      {
        id: 'ach-8',
        title: 'Study Master 👑',
        description: 'Complete 25 total study and focus sessions.',
        icon: '👑',
        category: 'study',
        xpReward: 200,
        unlocked: totalSessions >= 25,
        currentValue: totalSessions,
        targetValue: 25,
      },
    ];
  },

  // Pomodoro Settings
  getPomodoroSettings(): PomodoroSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(DEFAULT_POMODORO_SETTINGS));
        return DEFAULT_POMODORO_SETTINGS;
      }
      return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_POMODORO_SETTINGS;
    }
  },

  savePomodoroSettings(settings: PomodoroSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save pomodoro settings:', e);
    }
  },

  // Focus Settings
  getFocusSettings(): FocusSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(DEFAULT_FOCUS_SETTINGS));
        return DEFAULT_FOCUS_SETTINGS;
      }
      return { ...DEFAULT_FOCUS_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_FOCUS_SETTINGS;
    }
  },

  saveFocusSettings(settings: FocusSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save focus settings:', e);
    }
  },

  // Study Plans
  getStudyPlans(): StudyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveStudyPlans(plans: StudyPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save study plans:', e);
    }
  },

  addStudyPlan(plan: StudyPlan): void {
    const plans = this.getStudyPlans();
    plans.unshift(plan);
    this.saveStudyPlans(plans);
    this.addXP(40);
  },

  deleteStudyPlan(id: string): void {
    const plans = this.getStudyPlans().filter((p) => p.id !== id);
    this.saveStudyPlans(plans);
  },

  togglePlanTaskCompleted(planId: string, taskId: string): StudyPlan | null {
    const plans = this.getStudyPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return null;
    const completed = new Set(plan.completedTaskIds || []);
    if (completed.has(taskId)) {
      completed.delete(taskId);
    } else {
      completed.add(taskId);
      this.addXP(5);
    }
    plan.completedTaskIds = Array.from(completed);
    this.saveStudyPlans(plans);
    return plan;
  },

  // Chat Messages
  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (!data) {
        const welcome: ChatMessage[] = [
          {
            id: 'msg-welcome',
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            mode: 'chat',
            text: `👋 **Welcome to FocusGuard AI Assistant!**\n\nI am your personalized study tutor and exam coach. How can I help you today?\n\n**Quick Actions:**\n- 🎯 **Generate Practice Quiz / MCQs**\n- 📝 **Summarize Notes & Lectures**\n- 💡 **Explain Difficult Topics in Simple Terms**\n- 🗂️ **Generate Flashcards**\n- 📋 **Create High-Yield Revision Notes**\n\nChoose an action below or type any question to start!`,
          },
        ];
        localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(welcome));
        return welcome;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat messages:', e);
    }
  },

  addChatMessage(message: ChatMessage): void {
    const messages = this.getChatMessages();
    messages.push(message);
    this.saveChatMessages(messages);
  },

  clearChatHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifs: AppNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const notifs = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs);
    return newNotif;
  },

  markNotificationsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(notifs);
  },

  // Blocked Apps Management
  getBlockedApps(): BlockedApp[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_APPS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(DEFAULT_BLOCKED_APPS));
        return DEFAULT_BLOCKED_APPS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BLOCKED_APPS;
    } catch {
      return DEFAULT_BLOCKED_APPS;
    }
  },

  saveBlockedApps(apps: BlockedApp[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(apps));
      // update profile blockedAppsCount
      const blockedCount = apps.filter((a) => a.isBlocked).length;
      const profile = this.getProfile();
      if (profile.blockedAppsCount !== blockedCount) {
        this.saveProfile({ ...profile, blockedAppsCount: blockedCount });
      }

      // Sync to Native Android SharedPreferences & AccessibilityService
      const blockedPackages = apps
        .filter((a) => a.isBlocked && a.packageName && !a.packageName.toLowerCase().includes('focusguard'))
        .map((a) => a.packageName!);
      AndroidNativeBridge.syncBlockedPackages(blockedPackages).catch(() => {});
    } catch (e) {
      console.error('Failed to save blocked apps:', e);
    }
  },

  toggleAppBlock(id: string): BlockedApp | null {
    const apps = this.getBlockedApps();
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    apps[idx] = { ...apps[idx], isBlocked: !apps[idx].isBlocked };
    this.saveBlockedApps(apps);
    return apps[idx];
  },

  addCustomApp(app: Omit<BlockedApp, 'id'>): BlockedApp {
    const apps = this.getBlockedApps();
    const newApp: BlockedApp = {
      ...app,
      id: 'custom-app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      isCustom: true,
      isBlocked: app.isBlocked !== undefined ? app.isBlocked : true,
    };
    apps.unshift(newApp);
    this.saveBlockedApps(apps);
    this.addXP(10);
    return newApp;
  },

  deleteCustomApp(id: string): boolean {
    const apps = this.getBlockedApps();
    const filtered = apps.filter((a) => a.id !== id);
    if (filtered.length !== apps.length) {
      this.saveBlockedApps(filtered);
      return true;
    }
    return false;
  },

  setCategoryBlocked(category: AppBlockerCategory, isBlocked: boolean): BlockedApp[] {
    const apps = this.getBlockedApps().map((app) => {
      if (app.category === category) {
        return { ...app, isBlocked };
      }
      return app;
    });
    this.saveBlockedApps(apps);
    return apps;
  },

  blockAllApps(): BlockedApp[] {
    const apps = this.getBlockedApps().map((app) => ({ ...app, isBlocked: true }));
    this.saveBlockedApps(apps);
    return apps;
  },

  unblockAllApps(): BlockedApp[] {
    const apps = this.getBlockedApps().map((app) => ({ ...app, isBlocked: false }));
    this.saveBlockedApps(apps);
    return apps;
  },

  resetBlockedAppsToDefault(): BlockedApp[] {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(DEFAULT_BLOCKED_APPS));
    const blockedCount = DEFAULT_BLOCKED_APPS.filter((a) => a.isBlocked).length;
    const profile = this.getProfile();
    this.saveProfile({ ...profile, blockedAppsCount: blockedCount });
    return DEFAULT_BLOCKED_APPS;
  },

  // Active FocusGuard Blocking Session Persistence
  getActiveBlockingSession(): ActiveBlockingSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_BLOCKING_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveActiveBlockingSession(session: ActiveBlockingSession | null): void {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BLOCKING_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BLOCKING_SESSION, JSON.stringify(session));
    }
  },

  clearActiveBlockingSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_BLOCKING_SESSION);
  },

  getAndroidPermissionStates(): Record<string, boolean> {
    const raw = localStorage.getItem(STORAGE_KEYS.ANDROID_PERMISSIONS);
    if (!raw) {
      // Default: usage stats & overlay are granted for seamless study experience
      const defaults: Record<string, boolean> = {
        usage_stats: true,
        overlay: true,
        notifications: true,
        accessibility: true,
        dnd: true,
      };
      localStorage.setItem(STORAGE_KEYS.ANDROID_PERMISSIONS, JSON.stringify(defaults));
      return defaults;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  setAndroidPermissionState(key: string, isGranted: boolean): Record<string, boolean> {
    const current = this.getAndroidPermissionStates();
    current[key] = isGranted;
    localStorage.setItem(STORAGE_KEYS.ANDROID_PERMISSIONS, JSON.stringify(current));
    return current;
  },

  // Export / Import
  exportAllData(): string {
    const data = {
      profile: this.getProfile(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      exams: this.getExams(),
      quizResults: this.getQuizResults(),
      pomodoroSettings: this.getPomodoroSettings(),
      focusSettings: this.getFocusSettings(),
      studyPlans: this.getStudyPlans(),
      notifications: this.getNotifications(),
      blockedApps: this.getBlockedApps(),
      exportedAt: new Date().toISOString(),
      appName: 'FocusGuard',
      version: '2.0.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
      if (data.tasks) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
      if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.exams) localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(data.exams));
      if (data.quizResults) localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(data.quizResults));
      if (data.pomodoroSettings) localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(data.pomodoroSettings));
      if (data.focusSettings) localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(data.focusSettings));
      if (data.studyPlans) localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(data.studyPlans));
      if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      if (data.blockedApps) localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(data.blockedApps));
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  toggleTask(id: string): TaskItem | null {
    return this.toggleTaskComplete(id);
  },

  addSession(session: Omit<FocusSessionRecord, 'id'>): FocusSessionRecord {
    return this.recordSession(session);
  },

  saveStudyPlan(plan: StudyPlan): void {
    this.addStudyPlan(plan);
  },

  togglePlanTask(planId: string, taskId: string): StudyPlan | null {
    return this.togglePlanTaskCompleted(planId, taskId);
  },

  clearChatMessages(): void {
    this.clearChatHistory();
  },

  /**
   * Clears all demo and user data to complete ZERO:
   * - 0 tasks
   * - 0 focus sessions
   * - 0 exams
   * - 0 study plans
   * - 0 quiz results
   * - 0 streak, 0 XP, Level 1
   * - 0 blocked apps
   */
  clearAllDemoDataToZero(): {
    profile: UserProfile;
    tasks: TaskItem[];
    sessions: FocusSessionRecord[];
    studyPlans: StudyPlan[];
    focusSettings: FocusSettings;
    pomodoroSettings: PomodoroSettings;
    chatMessages: ChatMessage[];
    notifications: AppNotification[];
    exams: ExamItem[];
    quizResults: QuizResult[];
    blockedApps: BlockedApp[];
  } {
    // 1. Safely remove each user storage key individually
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to remove key ${key}:`, err);
      }
    });

    // 2. Clone zeroed clean objects
    const zeroProfile: UserProfile = {
      name: 'Student',
      avatar: '🎓',
      gradeOrGoal: 'General Studies',
      dailyStudyTargetMinutes: 120,
      dailyPomodoroTarget: 4,
      preferredStudyTime: 'Evening',
      primarySubject: 'Self Study',
      onboardingCompleted: true,
      theme: 'dark',
      streakCount: 0,
      bestStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      soundVolume: 0.8,
      hapticFeedback: true,
      blockedAppsCount: 0,
      androidNotificationsEnabled: true,
      xp: 0,
      level: 1,
      studyReminderTime: '19:00',
      studyReminderEnabled: true,
    };

    const zeroTasks: TaskItem[] = [];
    const zeroSessions: FocusSessionRecord[] = [];
    const zeroStudyPlans: StudyPlan[] = [];
    const zeroExams: ExamItem[] = [];
    const zeroQuizResults: QuizResult[] = [];
    const zeroPomodoroSettings: PomodoroSettings = JSON.parse(JSON.stringify(DEFAULT_POMODORO_SETTINGS));
    const zeroFocusSettings: FocusSettings = JSON.parse(JSON.stringify(DEFAULT_FOCUS_SETTINGS));
    const zeroBlockedApps: BlockedApp[] = DEFAULT_BLOCKED_APPS.map((app) => ({
      ...app,
      isBlocked: false,
    }));

    const zeroNotifications: AppNotification[] = [
      {
        id: 'notif-zero-' + Date.now(),
        title: '✨ All Demo Data Cleared (Zero State)',
        message: 'All demo tasks, sessions, exams, and stats have been reset to 0. You are ready for a clean start!',
        timestamp: new Date().toISOString(),
        type: 'system',
        read: false,
      },
    ];

    const zeroChatMessages: ChatMessage[] = [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        mode: 'chat',
        text: `👋 **Welcome to FocusGuard AI Assistant!**\n\nAll demo data has been cleared to 0. I am your personalized study tutor and exam coach.\n\n**Quick Actions:**\n- 🎯 **Generate Practice Quiz / MCQs**\n- 📝 **Summarize Notes & Lectures**\n- 💡 **Explain Difficult Topics in Simple Terms**\n- 🗂️ **Generate Flashcards**\n- 📋 **Create High-Yield Revision Notes**\n\nHow can I help you today?`,
      },
    ];

    // 3. Write zero defaults into localStorage safely
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(zeroProfile));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(zeroTasks));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(zeroSessions));
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(zeroStudyPlans));
      localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(zeroPomodoroSettings));
      localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(zeroFocusSettings));
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(zeroExams));
      localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(zeroQuizResults));
      localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(zeroBlockedApps));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(zeroNotifications));
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(zeroChatMessages));
    } catch (e) {
      console.error('Failed to initialize zero state into storage:', e);
    }

    return {
      profile: zeroProfile,
      tasks: zeroTasks,
      sessions: zeroSessions,
      studyPlans: zeroStudyPlans,
      focusSettings: zeroFocusSettings,
      pomodoroSettings: zeroPomodoroSettings,
      chatMessages: zeroChatMessages,
      notifications: zeroNotifications,
      exams: zeroExams,
      quizResults: zeroQuizResults,
      blockedApps: zeroBlockedApps,
    };
  },

  resetAllData(): void {
    this.clearAllDemoDataToZero();
  },

  resetAllUserData(): {
    profile: UserProfile;
    tasks: TaskItem[];
    sessions: FocusSessionRecord[];
    studyPlans: StudyPlan[];
    focusSettings: FocusSettings;
    pomodoroSettings: PomodoroSettings;
    chatMessages: ChatMessage[];
    notifications: AppNotification[];
    exams: ExamItem[];
    quizResults: QuizResult[];
    blockedApps: BlockedApp[];
  } {
    return this.clearAllDemoDataToZero();
  },

  loadSeedDemoData(): {
    profile: UserProfile;
    tasks: TaskItem[];
    sessions: FocusSessionRecord[];
    studyPlans: StudyPlan[];
    focusSettings: FocusSettings;
    pomodoroSettings: PomodoroSettings;
    chatMessages: ChatMessage[];
    notifications: AppNotification[];
    exams: ExamItem[];
    quizResults: QuizResult[];
    blockedApps: BlockedApp[];
  } {
    // 1. Safely remove each user storage key individually
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to remove key ${key}:`, err);
      }
    });

    // 2. Clone fresh pristine default seed objects
    const freshProfile: UserProfile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    const freshTasks: TaskItem[] = getInitialTasks();
    const freshSessions: FocusSessionRecord[] = [];
    const freshStudyPlans: StudyPlan[] = [];
    const freshPomodoroSettings: PomodoroSettings = JSON.parse(JSON.stringify(DEFAULT_POMODORO_SETTINGS));
    const freshFocusSettings: FocusSettings = JSON.parse(JSON.stringify(DEFAULT_FOCUS_SETTINGS));
    const freshExams: ExamItem[] = JSON.parse(JSON.stringify(INITIAL_EXAMS));
    const freshQuizResults: QuizResult[] = JSON.parse(JSON.stringify(INITIAL_QUIZ_RESULTS));
    const freshBlockedApps: BlockedApp[] = JSON.parse(JSON.stringify(DEFAULT_BLOCKED_APPS));
    const freshNotifications: AppNotification[] = [
      {
        id: 'notif-sample-' + Date.now(),
        title: '📚 Sample Demo Data Loaded',
        message: 'Sample tasks, subjects, and study schedule loaded for demonstration.',
        timestamp: new Date().toISOString(),
        type: 'system',
        read: false,
      },
    ];
    const freshChatMessages: ChatMessage[] = [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        mode: 'chat',
        text: `👋 **Welcome to FocusGuard AI Assistant!**\n\nI am your personalized study tutor and exam coach. How can I help you today?\n\n**Quick Actions:**\n- 🎯 **Generate Practice Quiz / MCQs**\n- 📝 **Summarize Notes & Lectures**\n- 💡 **Explain Difficult Topics in Simple Terms**\n- 🗂️ **Generate Flashcards**\n- 📋 **Create High-Yield Revision Notes**\n\nChoose an action below or type any question to start!`,
      },
    ];

    // 3. Write seed defaults into localStorage safely
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(freshProfile));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(freshTasks));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(freshSessions));
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(freshStudyPlans));
      localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(freshPomodoroSettings));
      localStorage.setItem(STORAGE_KEYS.FOCUS_SETTINGS, JSON.stringify(freshFocusSettings));
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(freshExams));
      localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(freshQuizResults));
      localStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(freshBlockedApps));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(freshNotifications));
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(freshChatMessages));
    } catch (e) {
      console.error('Failed to initialize seed defaults into storage:', e);
    }

    return {
      profile: freshProfile,
      tasks: freshTasks,
      sessions: freshSessions,
      studyPlans: freshStudyPlans,
      focusSettings: freshFocusSettings,
      pomodoroSettings: freshPomodoroSettings,
      chatMessages: freshChatMessages,
      notifications: freshNotifications,
      exams: freshExams,
      quizResults: freshQuizResults,
      blockedApps: freshBlockedApps,
    };
  },

  resetToDefaults() {
    return this.clearAllDemoDataToZero();
  },
};
