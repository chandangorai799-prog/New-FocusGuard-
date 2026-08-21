import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationTab, UserProfile, TaskItem, FocusSessionRecord, StudyPlan, FocusSettings, PomodoroSettings, ChatMessage, AppNotification } from './types';
import { StorageService } from './services/storage';
import { AudioService } from './services/audioService';
import { AndroidBlockerService } from './services/androidBlockerService';
import { ThemeService } from './services/themeService';
import { NotificationService } from './services/notificationService';
import { useTheme } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { OnboardingModal } from './components/common/OnboardingModal';
import { DistractionShieldModal } from './components/common/DistractionShieldModal';
import { NotificationsModal } from './components/common/NotificationsModal';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { ThemeCustomizerModal } from './components/common/ThemeCustomizerModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { SmartFocusView } from './components/focus/SmartFocusView';
import { PomodoroView } from './components/pomodoro/PomodoroView';
import { StudyPlannerView } from './components/planner/StudyPlannerView';
import { AIAssistantView } from './components/assistant/AIAssistantView';
import { TaskManagerView } from './components/tasks/TaskManagerView';
import { StatisticsView } from './components/statistics/StatisticsView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { AppBlockerScreen } from './components/focus/AppBlockerScreen';
import { BlockingOverlay } from './components/focus/BlockingOverlay';

export default function App() {
  const { currentTheme, customAccent, isLight, setTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [tasks, setTasks] = useState<TaskItem[]>(StorageService.getTasks());
  const [sessions, setSessions] = useState<FocusSessionRecord[]>(StorageService.getSessions());
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(StorageService.getStudyPlans());
  const [focusSettings, setFocusSettings] = useState<FocusSettings>(StorageService.getFocusSettings());
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(StorageService.getPomodoroSettings());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(StorageService.getChatMessages());
  const [notifications, setNotifications] = useState<AppNotification[]>(StorageService.getNotifications());

  // Modal States
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!profile.onboardingCompleted);
  const [showShieldModal, setShowShieldModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [isFocusSessionActive, setIsFocusSessionActive] = useState<boolean>(false);
  const [focusInitialDuration, setFocusInitialDuration] = useState<number | undefined>(undefined);

  // Sync profile when theme changes in context
  useEffect(() => {
    if (profile.theme !== currentTheme || profile.customThemeColor !== customAccent) {
      setProfile((prev) => ({
        ...prev,
        theme: currentTheme,
        customThemeColor: customAccent,
      }));
    }
  }, [currentTheme, customAccent]);

  // Automatic Daily Task Reset & Date Rollover Listener
  // Automatically removes completed tasks from yesterday/earlier upon:
  // 1. App open / initial load
  // 2. Foreground return / tab visibility change (after midnight or unlocking phone)
  // 3. Periodic timer to handle midnight transition while app stays open
  useEffect(() => {
    const handleDailyTaskCleanup = () => {
      const { cleaned, removedCount } = StorageService.cleanExpiredCompletedTasks();
      if (removedCount > 0) {
        setTasks(cleaned);
      }
      // Keep streak synced with device local date
      const updatedProfile = StorageService.updateStreak();
      setProfile(updatedProfile);
    };

    // 1. Run immediately on mount
    handleDailyTaskCleanup();

    // 2. Run on visibility / focus change
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleDailyTaskCleanup();
      }
    };

    const onFocus = () => {
      handleDailyTaskCleanup();
    };

    // 3. Periodic check every 30 seconds for midnight rollover
    const interval = setInterval(handleDailyTaskCleanup, 30000);

    // 4. Start Daily 5:00 PM Focus Reminder Scheduler Ticker
    const stopReminderTicker = NotificationService.startDailyReminderTicker();

    // 5. Listen for Service Worker Notification Click events
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        setCurrentTab('focus');
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Check URL parameters if opened from notification click
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'focus' || params.get('action') === 'start_focus') {
        setCurrentTab('focus');
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
      stopReminderTicker();
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Sub-tabs for bottom nav mapping
  const activeBottomTab: 'dashboard' | 'focus' | 'planner' | 'assistant' | 'tasks' | 'profile' =
    currentTab === 'pomodoro' ? 'focus' :
    currentTab === 'statistics' ? 'profile' :
    currentTab;

  const unreadNotifsCount = (notifications || []).filter((n) => !n.read).length;

  // Refresh notifications list helper
  const handleRefreshNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  // Switch tab with audio feedback
  const handleTabChange = (tab: NavigationTab) => {
    AudioService.playTap();
    setCurrentTab(tab);
  };

  // Theme selection handler
  const handleSelectTheme = (themeId: string, accent?: string) => {
    setTheme(themeId, accent);
    const updated: UserProfile = {
      ...profile,
      theme: themeId,
      customThemeColor: accent || customAccent,
    };
    setProfile(updated);
  };

  // Launch Focus Mode from Dashboard or Task
  const handleStartFocus = (durationMinutes?: number) => {
    setFocusInitialDuration(durationMinutes || 45);
    setCurrentTab('focus');
  };

  const handleStartPomodoro = () => {
    setCurrentTab('pomodoro');
  };

  const handleStartFocusForTask = (task: TaskItem) => {
    setFocusInitialDuration(task.estimatedMinutes || 45);
    setCurrentTab('focus');
  };

  // Task Handlers
  const handleAddTask = (newTask: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const created = StorageService.addTask(newTask);
    setTasks(StorageService.getTasks());
    return created;
  };

  const handleUpdateTask = (task: TaskItem) => {
    StorageService.updateTask(task);
    setTasks(StorageService.getTasks());
  };

  const handleDeleteTask = (id: string) => {
    StorageService.deleteTask(id);
    setTasks(StorageService.getTasks());
  };

  const handleToggleTask = (id: string) => {
    AudioService.playTap();
    StorageService.toggleTask(id);
    setTasks(StorageService.getTasks());
  };

  // Session Logging Handler
  const handleRecordSession = (sessionData: Omit<FocusSessionRecord, 'id'>) => {
    StorageService.addSession(sessionData);
    setSessions(StorageService.getSessions());
    setProfile(StorageService.getProfile());
    setNotifications(StorageService.getNotifications());
  };

  // Study Plan Handlers
  const handleAddPlan = (plan: StudyPlan) => {
    StorageService.saveStudyPlan(plan);
    setStudyPlans(StorageService.getStudyPlans());
  };

  const handleDeletePlan = (id: string) => {
    StorageService.deleteStudyPlan(id);
    setStudyPlans(StorageService.getStudyPlans());
  };

  const handleTogglePlanTask = (planId: string, taskId: string) => {
    StorageService.togglePlanTask(planId, taskId);
    setStudyPlans(StorageService.getStudyPlans());
  };

  const handleImportPlanTasks = (newTasks: Omit<TaskItem, 'id' | 'createdAt'>[]) => {
    newTasks.forEach((t) => StorageService.addTask(t));
    setTasks(StorageService.getTasks());
  };

  // Chat Assistant Handlers
  const handleSendMessage = (msg: ChatMessage) => {
    StorageService.addChatMessage(msg);
    setChatMessages(StorageService.getChatMessages());
  };

  const handleClearHistory = () => {
    StorageService.clearChatMessages();
    setChatMessages([]);
  };

  // Settings Handlers
  const handleUpdateProfile = (newProfile: UserProfile) => {
    StorageService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleUpdateFocusSettings = (newSettings: FocusSettings) => {
    StorageService.saveFocusSettings(newSettings);
    setFocusSettings(newSettings);
  };

  const handleUpdatePomodoroSettings = (newSettings: PomodoroSettings) => {
    StorageService.savePomodoroSettings(newSettings);
    setPomodoroSettings(newSettings);
  };

  const handleResetAllData = () => {
    try {
      // 1. Reset all underlying storage and timers to ZERO
      AudioService.stopAmbient();
      AudioService.playSuccess();
      AndroidBlockerService.resetSessionToIdle();
      const freshData = StorageService.clearAllDemoDataToZero();

      // 2. Immediately update all React state variables
      setProfile(freshData.profile);
      setTasks(freshData.tasks);
      setSessions(freshData.sessions);
      setStudyPlans(freshData.studyPlans);
      setFocusSettings(freshData.focusSettings);
      setPomodoroSettings(freshData.pomodoroSettings);
      setChatMessages(freshData.chatMessages);
      setNotifications(freshData.notifications);
      setIsFocusSessionActive(false);
      setFocusInitialDuration(undefined);

      // 3. Navigate back to dashboard with clean zero state
      setCurrentTab('dashboard');
    } catch (e) {
      console.error('Failed to reset all data:', e);
      try {
        setProfile(StorageService.getProfile());
        setTasks(StorageService.getTasks());
        setSessions(StorageService.getSessions());
        setStudyPlans(StorageService.getStudyPlans());
        setCurrentTab('dashboard');
      } catch {}
    }
  };

  const handleLoadSampleDemo = () => {
    try {
      AudioService.stopAmbient();
      AudioService.playSuccess();
      AndroidBlockerService.resetSessionToIdle();
      const seedData = StorageService.loadSeedDemoData();

      setProfile(seedData.profile);
      setTasks(seedData.tasks);
      setSessions(seedData.sessions);
      setStudyPlans(seedData.studyPlans);
      setFocusSettings(seedData.focusSettings);
      setPomodoroSettings(seedData.pomodoroSettings);
      setChatMessages(seedData.chatMessages);
      setNotifications(seedData.notifications);
      setIsFocusSessionActive(false);
      setFocusInitialDuration(undefined);

      setCurrentTab('dashboard');
    } catch (e) {
      console.error('Failed to load sample demo data:', e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Responsive Centered Application Canvas */}
      <div className="w-full max-w-4xl lg:max-w-5xl flex-1 flex flex-col relative bg-slate-950 min-h-screen shadow-2xl border-x border-slate-900/80">
        {/* PWA Install Banner */}
        <PwaInstallBanner />

        {/* Android Top Header */}
        <Header
          profile={profile}
          notifications={notifications}
          streakCount={profile.streakCount}
          unreadCount={unreadNotifsCount}
          onOpenShield={() => {
            AudioService.playTap();
            setShowShieldModal(true);
          }}
          onOpenNotifications={() => {
            AudioService.playTap();
            StorageService.markNotificationsRead();
            const updatedNotifs = StorageService.getNotifications();
            setNotifications(updatedNotifs);
            setShowNotificationsModal(true);
          }}
          onOpenThemeModal={() => {
            AudioService.playTap();
            setShowThemeModal(true);
          }}
          onOpenProfile={() => handleTabChange('profile')}
          isFocusActive={isFocusSessionActive}
        />

        {/* Secondary Sub-Navigation for Mode Switching when on Focus or Profile tabs */}
        {(currentTab === 'focus' || currentTab === 'pomodoro') && (
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex justify-center gap-2">
            <button
              onClick={() => handleTabChange('focus')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'focus'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Smart Focus Shield
            </button>
            <button
              onClick={() => handleTabChange('pomodoro')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'pomodoro'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Pomodoro Timer
            </button>
          </div>
        )}

        {(currentTab === 'profile' || currentTab === 'statistics') && (
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex justify-center gap-2">
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Profile & Goals
            </button>
            <button
              onClick={() => handleTabChange('statistics')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'statistics'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Productivity Insights
            </button>
          </div>
        )}

        {/* Main Viewport Container */}
        <main
          className="flex-1 w-full p-3.5 sm:p-5 md:p-6 overflow-y-auto"
          style={{
            paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {currentTab === 'dashboard' && (
                <DashboardView
                  profile={profile}
                  tasks={tasks}
                  sessions={sessions}
                  studyPlans={studyPlans}
                  onStartFocus={handleStartFocus}
                  onStartPomodoro={handleStartPomodoro}
                  onNavigateToTab={(tab) => handleTabChange(tab)}
                  onToggleTask={handleToggleTask}
                  onOpenThemeModal={() => setShowThemeModal(true)}
                  onSelectTheme={handleSelectTheme}
                />
              )}

              {currentTab === 'focus' && (
                <SmartFocusView
                  settings={focusSettings}
                  profile={profile}
                  initialDuration={focusInitialDuration}
                  onRecordSession={handleRecordSession}
                  onUpdateSettings={handleUpdateFocusSettings}
                  onFocusStateChange={setIsFocusSessionActive}
                  onOpenShield={() => setShowShieldModal(true)}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {currentTab === 'pomodoro' && (
                <PomodoroView
                  settings={pomodoroSettings}
                  profile={profile}
                  sessions={sessions}
                  onRecordSession={handleRecordSession}
                  onUpdateSettings={handleUpdatePomodoroSettings}
                  onFocusStateChange={setIsFocusSessionActive}
                />
              )}

              {(currentTab === 'planner' || currentTab === 'ai') && (
                <StudyPlannerView
                  studyPlans={studyPlans}
                  onAddPlan={handleAddPlan}
                  onDeletePlan={handleDeletePlan}
                  onTogglePlanTask={handleTogglePlanTask}
                  onImportToTasks={handleImportPlanTasks}
                />
              )}

              {currentTab === 'assistant' && (
                <AIAssistantView
                  messages={chatMessages}
                  profile={profile}
                  onSendMessage={handleSendMessage}
                  onClearHistory={handleClearHistory}
                />
              )}

              {currentTab === 'tasks' && (
                <TaskManagerView
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTask={handleToggleTask}
                  onStartFocusForTask={handleStartFocusForTask}
                />
              )}

              {currentTab === 'statistics' && (
                <StatisticsView
                  sessions={sessions}
                  tasks={tasks}
                  profile={profile}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileSettingsView
                  profile={profile}
                  focusSettings={focusSettings}
                  pomodoroSettings={pomodoroSettings}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateFocusSettings={handleUpdateFocusSettings}
                  onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
                  onResetAllData={handleResetAllData}
                  onLoadSampleDemo={handleLoadSampleDemo}
                  onRestartOnboarding={() => setShowOnboarding(true)}
                  onOpenShield={() => handleTabChange('appBlocker')}
                  onOpenThemeModal={() => setShowThemeModal(true)}
                />
              )}

              {currentTab === 'appBlocker' && (
                <AppBlockerScreen
                  onBack={() => handleTabChange('focus')}
                  onStartFocusSession={() => handleTabChange('focus')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Android Bottom Navigation */}
        <BottomNav
          activeTab={activeBottomTab}
          onTabSelect={(tab) => {
            handleTabChange(tab as NavigationTab);
          }}
          pendingTasksCount={(tasks || []).filter((t) => !t.completed).length}
        />

        {/* Real-time Android Blocking Overlay */}
        <BlockingOverlay
          onReturnToFocus={() => {
            handleTabChange('focus');
          }}
        />

        {/* Global Modals */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setShowOnboarding(false);
          }}
        />

        <DistractionShieldModal
          isOpen={showShieldModal}
          onClose={() => setShowShieldModal(false)}
          onBlocklistUpdated={(_count) => {
            setProfile(StorageService.getProfile());
          }}
        />

        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={notifications}
          onRefresh={handleRefreshNotifications}
        />

        {/* Custom Theme Studio Modal */}
        <ThemeCustomizerModal
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
          currentThemeId={profile.theme || 'midnight'}
          customAccentColor={profile.customThemeColor}
          onSelectTheme={handleSelectTheme}
        />
      </div>
    </div>
  );
}
