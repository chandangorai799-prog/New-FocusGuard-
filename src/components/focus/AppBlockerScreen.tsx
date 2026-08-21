import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  Filter,
  Play,
  Sparkles,
  Sliders,
  ArrowLeft,
  X,
  ExternalLink,
  Layers,
  Info,
  DownloadCloud,
} from 'lucide-react';
import { BlockedApp, AppBlockerCategory, AndroidPermissionInfo } from '../../types';
import { StorageService, DEFAULT_BLOCKED_APPS } from '../../services/storage';
import { AudioService } from '../../services/audioService';
import { AndroidBlockerService } from '../../services/androidBlockerService';
import { AndroidNativeBridge, InstalledAppInfo } from '../../services/androidNativeBridge';
import { PermissionCheckModal } from './PermissionCheckModal';

interface AppBlockerScreenProps {
  onBack?: () => void;
  onStartFocusSession?: () => void;
}

const CATEGORIES: AppBlockerCategory[] = [
  'Social',
  'Entertainment',
  'Gaming',
  'Messaging',
  'Shopping',
  'Browser',
  'Other',
];

const EMOJI_OPTIONS = [
  '📱', '📷', '🎮', '🎬', '💬', '🛍️', '🌐', '🎵',
  '👻', '📺', '🎯', '👾', '🍿', '🎧', '⚔️', '🏰',
  '🍬', '♟️', '🧵', '🤖', '🐦', '🔥', '💎', '🚀',
];

const QUICK_PRESETS: { name: string; category: AppBlockerCategory; icon: string; pkg: string }[] = [
  { name: 'YouTube (Shorts)', category: 'Entertainment', icon: '▶️', pkg: 'com.google.android.youtube' },
  { name: 'Instagram', category: 'Social', icon: '📷', pkg: 'com.instagram.android' },
  { name: 'TikTok', category: 'Social', icon: '🎵', pkg: 'com.zhiliaoapp.musically' },
  { name: 'Snapchat', category: 'Social', icon: '👻', pkg: 'com.snapchat.android' },
  { name: 'BGMI / PUBG', category: 'Gaming', icon: '🪖', pkg: 'com.pubg.imobile' },
  { name: 'Google Chrome', category: 'Browser', icon: '🌐', pkg: 'com.android.chrome' },
];

export const AppBlockerScreen: React.FC<AppBlockerScreenProps> = ({
  onBack,
  onStartFocusSession,
}) => {
  const [apps, setApps] = useState<BlockedApp[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all_apps' | 'device_apps' | 'custom_add' | 'categories' | 'android_perms'>('all_apps');
  const [permissions, setPermissions] = useState<AndroidPermissionInfo[]>([]);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  // Native Device Apps State
  const [deviceApps, setDeviceApps] = useState<InstalledAppInfo[]>([]);
  const [isLoadingDeviceApps, setIsLoadingDeviceApps] = useState<boolean>(false);
  const [accessibilityStatus, setAccessibilityStatus] = useState<{ isEnabled: boolean; isRunning: boolean }>({
    isEnabled: true,
    isRunning: true,
  });

  // New Custom App state
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<AppBlockerCategory>('Social');
  const [customPackage, setCustomPackage] = useState<string>('');
  const [customIcon, setCustomIcon] = useState<string>('📱');
  const [customReason, setCustomReason] = useState<string>('');
  const [saveBannerMsg, setSaveBannerMsg] = useState<string>('');

  useEffect(() => {
    loadAppsAndPermissions();
    checkAccessibility();

    const unsubPerms = AndroidBlockerService.subscribeToPermissions((p) => {
      setPermissions(p);
    });

    const handleFocus = () => {
      checkAccessibility();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubPerms();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkAccessibility = async () => {
    try {
      const status = await AndroidNativeBridge.checkAccessibilityEnabled();
      setAccessibilityStatus(status);
    } catch (e) {
      console.warn('Failed to query accessibility status:', e);
    }
  };

  const loadAppsAndPermissions = () => {
    const loadedApps = StorageService.getBlockedApps().filter(
      (a) => !a.packageName?.toLowerCase().includes('focusguard')
    );
    setApps(loadedApps);
    setPermissions(AndroidBlockerService.getPermissions());
  };

  const loadDeviceInstalledApps = async () => {
    setIsLoadingDeviceApps(true);
    try {
      const installed = await AndroidNativeBridge.getInstalledApps();
      if (installed && installed.length > 0) {
        setDeviceApps(installed);
      } else {
        // Fallback default suggestions for web preview
        setDeviceApps([
          { name: 'Instagram', packageName: 'com.instagram.android', isSystemApp: false, category: 'Social' },
          { name: 'YouTube', packageName: 'com.google.android.youtube', isSystemApp: true, category: 'Entertainment' },
          { name: 'TikTok', packageName: 'com.zhiliaoapp.musically', isSystemApp: false, category: 'Social' },
          { name: 'Snapchat', packageName: 'com.snapchat.android', isSystemApp: false, category: 'Social' },
          { name: 'BGMI', packageName: 'com.pubg.imobile', isSystemApp: false, category: 'Gaming' },
          { name: 'Netflix', packageName: 'com.netflix.mediaclient', isSystemApp: false, category: 'Entertainment' },
          { name: 'Reddit', packageName: 'com.reddit.frontpage', isSystemApp: false, category: 'Social' },
          { name: 'Twitter / X', packageName: 'com.twitter.android', isSystemApp: false, category: 'Social' },
          { name: 'Free Fire', packageName: 'com.dts.freefiremax', isSystemApp: false, category: 'Gaming' },
          { name: 'Chrome', packageName: 'com.android.chrome', isSystemApp: true, category: 'Browser' },
        ]);
      }
    } catch (e) {
      console.warn('Error fetching device apps:', e);
    } finally {
      setIsLoadingDeviceApps(false);
    }
  };

  const totalAppsCount = apps.length;
  const blockedAppsCount = apps.filter((a) => a.isBlocked).length;
  const sessionState = AndroidBlockerService.getSessionState();
  const isSessionActive = sessionState === 'FOCUS_ACTIVE';
  const requiredPermissionsGranted = AndroidBlockerService.areRequiredPermissionsGranted();

  const handleToggleApp = (id: string) => {
    AudioService.playTap();
    const updated = StorageService.toggleAppBlock(id);
    if (updated) {
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showBanner(`Updated: ${updated.name} is now ${updated.isBlocked ? 'Blocked 🛑' : 'Allowed ✅'}`);
    }
  };

  const handleToggleDeviceApp = (devApp: InstalledAppInfo) => {
    AudioService.playTap();
    const existing = apps.find(
      (a) => a.packageName?.toLowerCase() === devApp.packageName.toLowerCase()
    );

    if (existing) {
      handleToggleApp(existing.id);
    } else {
      // Add and block
      const created = StorageService.addCustomApp({
        name: devApp.name,
        category: (devApp.category as AppBlockerCategory) || 'Other',
        packageName: devApp.packageName,
        icon: getCategoryEmoji(devApp.category),
        isBlocked: true,
      });
      setApps((prev) => [created, ...prev]);
      showBanner(`Added & Blocked "${devApp.name}"`);
    }
  };

  const getCategoryEmoji = (cat?: string) => {
    switch (cat) {
      case 'Social': return '📷';
      case 'Entertainment': return '🎬';
      case 'Gaming': return '🎮';
      case 'Messaging': return '💬';
      case 'Browser': return '🌐';
      case 'Shopping': return '🛍️';
      default: return '📱';
    }
  };

  const handleSelectAll = () => {
    AudioService.playTap();
    const newApps = StorageService.blockAllApps().filter(
      (a) => !a.packageName?.toLowerCase().includes('focusguard')
    );
    setApps(newApps);
    showBanner(`All ${newApps.length} apps marked as Blocked.`);
  };

  const handleClearSelection = () => {
    AudioService.playTap();
    const newApps = StorageService.unblockAllApps().filter(
      (a) => !a.packageName?.toLowerCase().includes('focusguard')
    );
    setApps(newApps);
    showBanner('All apps unblocked (Clear Selection).');
  };

  const handleResetDefaults = () => {
    AudioService.playTap();
    const newApps = StorageService.resetBlockedAppsToDefault().filter(
      (a) => !a.packageName?.toLowerCase().includes('focusguard')
    );
    setApps(newApps);
    showBanner('Reset to default recommended blocklist.');
  };

  const handleDeleteCustomApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    AudioService.playTap();
    const success = StorageService.deleteCustomApp(id);
    if (success) {
      setApps((prev) => prev.filter((a) => a.id !== id));
      showBanner('Custom app removed from blocklist.');
    }
  };

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    if (customPackage.toLowerCase().includes('focusguard') || customName.toLowerCase().includes('focusguard')) {
      showBanner('❌ FocusGuard cannot be added to the blocked list!');
      return;
    }

    AudioService.playSuccess();
    const created = StorageService.addCustomApp({
      name: customName.trim(),
      category: customCategory,
      packageName: customPackage.trim() || `com.custom.${customName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      icon: customIcon,
      isBlocked: true,
      blockReason: customReason.trim() || undefined,
    });

    setApps((prev) => [created, ...prev]);
    setCustomName('');
    setCustomPackage('');
    setCustomReason('');
    showBanner(`✅ Added & Blocked "${created.name}"!`);
    setActiveTab('all_apps');
  };

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    AudioService.playTap();
    const existing = apps.find(
      (a) => a.name.toLowerCase() === preset.name.toLowerCase() || a.packageName === preset.pkg
    );

    if (existing) {
      if (!existing.isBlocked) {
        handleToggleApp(existing.id);
      } else {
        showBanner(`ℹ️ "${preset.name}" is already blocked!`);
      }
      return;
    }

    const created = StorageService.addCustomApp({
      name: preset.name,
      category: preset.category,
      packageName: preset.pkg,
      icon: preset.icon,
      isBlocked: true,
    });

    setApps((prev) => [created, ...prev]);
    showBanner(`✅ Preset added: "${preset.name}"`);
  };

  const handleTestAppLaunch = (app: BlockedApp) => {
    AudioService.playTap();
    const res = AndroidBlockerService.simulateLaunchApp(app);
    setTestResultMsg(res.message);
    setTimeout(() => {
      setTestResultMsg(null);
    }, 4000);
  };

  const handleOpenAccessibility = async () => {
    AudioService.playTap();
    await AndroidNativeBridge.openAccessibilitySettings();
    setTimeout(checkAccessibility, 1500);
  };

  const showBanner = (msg: string) => {
    setSaveBannerMsg(msg);
    setTimeout(() => {
      setSaveBannerMsg('');
    }, 2500);
  };

  // Filtered list
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.packageName && app.packageName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Blocked') return app.isBlocked;
    if (selectedCategory === 'Allowed') return !app.isBlocked;
    if (selectedCategory === 'Custom') return app.isCustom;
    return app.category === selectedCategory;
  });

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 p-3 sm:p-5 md:p-6 space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {onBack && (
            <button
              id="appblocker-back-btn"
              onClick={() => {
                AudioService.playTap();
                onBack();
              }}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
              title="Return to Previous Screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                App Blocker
              </h1>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-bold shrink-0">
                {blockedAppsCount} / {totalAppsCount} Blocked
              </span>
            </div>
            <p className="text-xs text-slate-400 break-words">
              Restrict distracting apps with real Android AccessibilityService during Focus Sessions.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Accessibility Service Indicator */}
          <button
            id="appblocker-accessibility-badge"
            onClick={handleOpenAccessibility}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              accessibilityStatus.isEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
            }`}
            title="Click to open Android Accessibility Settings"
          >
            <span className="text-xs">{accessibilityStatus.isEnabled ? '🟢' : '🔴'}</span>
            <span>{accessibilityStatus.isEnabled ? 'Accessibility: ON' : 'Enable Accessibility'}</span>
          </button>

          {/* Permission Status Pill */}
          <button
            id="appblocker-permissions-badge"
            onClick={() => {
              AudioService.playTap();
              setShowPermissionModal(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              requiredPermissionsGranted
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Permissions</span>
          </button>

          {/* Quick Start Focus Button */}
          {onStartFocusSession && (
            <button
              id="appblocker-start-focus-btn"
              onClick={() => {
                AudioService.playTap();
                onStartFocusSession();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Start Focus</span>
            </button>
          )}
        </div>
      </div>

      {/* Accessibility Service Disabled Banner */}
      {!accessibilityStatus.isEnabled && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold text-white">
                Accessibility Service is Disabled
              </p>
              <p className="text-[11px] text-rose-200">
                To block other Android apps, FocusGuard needs Accessibility permission.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAccessibility}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition shrink-0 cursor-pointer"
          >
            Enable Accessibility
          </button>
        </div>
      )}

      {/* Floating Save Notification Banner */}
      {saveBannerMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveBannerMsg}</span>
        </div>
      )}

      {/* Test Launch Result Notification */}
      {testResultMsg && (
        <div className="p-3 bg-slate-900 border border-blue-500/40 rounded-2xl text-xs text-blue-200 font-medium flex items-center gap-2 animate-fadeIn shadow-lg">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{testResultMsg}</span>
        </div>
      )}

      {/* Active Session Status Bar if session is currently active */}
      {isSessionActive && (
        <div className="p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/40 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                Focus Session is ACTIVE — Real App Blocking is Live!
              </p>
              <p className="text-[11px] text-slate-300">
                Opening any of your {blockedAppsCount} blocked apps will instantly trigger the FocusGuard Shield.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-xl border border-blue-500/30">
            Status: FOCUS_ACTIVE
          </span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto no-scrollbar pb-1">
        <button
          id="tab-all-apps"
          onClick={() => {
            AudioService.playTap();
            setActiveTab('all_apps');
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'all_apps'
              ? 'text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Blocklist ({apps.length})</span>
        </button>

        <button
          id="tab-device-apps"
          onClick={() => {
            AudioService.playTap();
            setActiveTab('device_apps');
            if (deviceApps.length === 0) {
              loadDeviceInstalledApps();
            }
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'device_apps'
              ? 'text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>Device Apps</span>
        </button>

        <button
          id="tab-custom-add"
          onClick={() => {
            AudioService.playTap();
            setActiveTab('custom_add');
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'custom_add'
              ? 'text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Add Custom App</span>
        </button>

        <button
          id="tab-categories"
          onClick={() => {
            AudioService.playTap();
            setActiveTab('categories');
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Category Rules</span>
        </button>

        <button
          id="tab-android-diag"
          onClick={() => {
            AudioService.playTap();
            setActiveTab('android_perms');
          }}
          className={`pb-2.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'android_perms'
              ? 'text-blue-400 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span>Android Permissions & APIs</span>
        </button>
      </div>

      {/* TAB 1: ALL APPS & BLOCKLIST MANAGEMENT */}
      {activeTab === 'all_apps' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Select All, Clear Selection, Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-blockable-apps-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps (e.g. YouTube, Instagram, Chrome, Games)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-select-all-apps"
                onClick={handleSelectAll}
                className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5"
                title="Select all apps for blocking"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Select All</span>
              </button>

              <button
                id="btn-clear-selection-apps"
                onClick={handleClearSelection}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
                title="Clear all selections (unblock all)"
              >
                <span>Clear Selection</span>
              </button>

              <button
                id="btn-reset-default-apps"
                onClick={handleResetDefaults}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                title="Reset to recommended default blocklist"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Blocked', 'Allowed', 'Custom', 'Social', 'Entertainment', 'Gaming', 'Messaging', 'Browser', 'Shopping'].map(
              (cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      AudioService.playTap();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              }
            )}
          </div>

          {/* Apps Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredApps.length === 0 ? (
              <div className="col-span-full py-12 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
                <p className="text-sm text-slate-400">No apps match "{searchQuery}".</p>
                <button
                  onClick={() => {
                    setActiveTab('custom_add');
                    setCustomName(searchQuery);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add "{searchQuery || 'New App'}" to Blocklist
                </button>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleToggleApp(app.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer group ${
                    app.isBlocked
                      ? 'bg-slate-900/90 border-slate-700/90 hover:border-blue-500/60 shadow-sm'
                      : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/50 opacity-70'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition ${
                        app.isBlocked
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {app.icon || '📱'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white truncate">{app.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium shrink-0">
                          {app.category}
                        </span>
                        {app.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 truncate max-w-full">
                        {app.packageName || 'com.app.package'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Test Simulator, Delete & Toggle */}
                  <div className="flex items-center space-x-2.5 shrink-0">
                    {/* Test App Launch Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestAppLaunch(app);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                      title="Test simulated app launch"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    {/* Delete Custom App */}
                    {app.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomApp(app.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Delete custom app"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold ${
                          app.isBlocked ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      >
                        {app.isBlocked ? 'ON' : 'OFF'}
                      </span>
                      <div
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                          app.isBlocked ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                            app.isBlocked ? 'translate-x-6' : 'translate-x-0'
                          } shadow-md flex items-center justify-center`}
                        >
                          {app.isBlocked && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEVICE INSTALLED APPS SCANNER */}
      {activeTab === 'device_apps' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                Applications Installed on Device
              </h3>
              <p className="text-xs text-slate-400">
                Scan and toggle real installed apps directly on your Android phone.
              </p>
            </div>
            <button
              onClick={loadDeviceInstalledApps}
              disabled={isLoadingDeviceApps}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDeviceApps ? 'animate-spin' : ''}`} />
              <span>{isLoadingDeviceApps ? 'Scanning...' : 'Refresh Apps'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {deviceApps.map((devApp) => {
              const matched = apps.find(
                (a) => a.packageName?.toLowerCase() === devApp.packageName.toLowerCase()
              );
              const isBlocked = matched?.isBlocked ?? false;

              return (
                <div
                  key={devApp.packageName}
                  onClick={() => handleToggleDeviceApp(devApp)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isBlocked
                      ? 'bg-slate-900/90 border-blue-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {getCategoryEmoji(devApp.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{devApp.name}</h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {devApp.category}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 truncate">{devApp.packageName}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      isBlocked
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isBlocked ? 'Blocked 🛑' : 'Block App +'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ADD CUSTOM APP */}
      {activeTab === 'custom_add' && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Add Any Custom Application
            </h2>
            <p className="text-xs text-slate-400">
              Add any installed game, app, or package name that you want FocusGuard to block during focus sessions.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Popular Distractions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-left flex items-center space-x-2.5 transition text-xs group"
                >
                  <span className="text-xl">{p.icon}</span>
                  <div className="truncate">
                    <p className="font-bold text-white group-hover:text-blue-300 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddCustomApp} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  App Name *
                </label>
                <input
                  id="new-custom-app-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Free Fire, Netflix, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  id="new-custom-app-cat"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as AppBlockerCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Android Package Name (Optional)
                </label>
                <input
                  id="new-custom-app-package"
                  type="text"
                  value={customPackage}
                  onChange={(e) => setCustomPackage(e.target.value)}
                  placeholder="e.g. com.dts.freefireth"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Blocking (Optional)
                </label>
                <input
                  id="new-custom-app-reason"
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g. Addictive short videos"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Emoji Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Icon / Emoji
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      AudioService.playTap();
                      setCustomIcon(emoji);
                    }}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${
                      customIcon === emoji
                        ? 'bg-blue-600 text-white scale-110 shadow-md'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                id="submit-add-app-btn"
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save and Block App</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: CATEGORY RULES */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Toggle entire categories of distracting apps with a single click.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const catApps = apps.filter((a) => a.category === cat);
              const allBlocked = catApps.length > 0 && catApps.every((a) => a.isBlocked);
              const blockedCount = catApps.filter((a) => a.isBlocked).length;

              return (
                <div
                  key={cat}
                  className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between transition hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{cat}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({blockedCount}/{catApps.length} Blocked)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs pt-0.5">
                      {catApps.map((a) => a.name).join(', ') || 'No apps configured in this category'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      AudioService.playTap();
                      const updated = StorageService.setCategoryBlocked(cat, !allBlocked).filter(
                        (a) => !a.packageName?.toLowerCase().includes('focusguard')
                      );
                      setApps(updated);
                      showBanner(`Updated ${cat} category: ${!allBlocked ? 'All Blocked' : 'All Allowed'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      allBlocked
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                        : blockedCount > 0
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {allBlocked ? 'All Blocked' : blockedCount > 0 ? 'Partial' : 'Allow All'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ANDROID PERMISSIONS & APIS */}
      {activeTab === 'android_perms' && (
        <div className="space-y-4 w-full">
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">
                  Android Subsystem & Architecture (Target API 36)
                </h2>
              </div>
              <button
                onClick={() => setShowPermissionModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
              >
                Manage Permissions
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              FocusGuard relies on standard Android platform APIs to monitor foreground applications, display the blocking overlay, and keep the focus service running reliably in the background:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">1. AccessibilityService</span>
                  <span className="text-[10px] text-emerald-400 font-mono">API 24+</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <code className="text-slate-300">android.permission.BIND_ACCESSIBILITY_SERVICE</code> delivers instant window switch detection and activates the shield over blocked applications.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">2. UsageStatsManager</span>
                  <span className="text-[10px] text-emerald-400 font-mono">API 21+</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <code className="text-slate-300">android.permission.PACKAGE_USAGE_STATS</code> allows FocusGuard to query usage events to detect when a blocked package resumes.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">3. System Alert Window</span>
                  <span className="text-[10px] text-emerald-400 font-mono">API 23+</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <code className="text-slate-300">android.permission.SYSTEM_ALERT_WINDOW</code> renders the FocusGuard block overlay over distracting apps.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">4. Post Notifications</span>
                  <span className="text-[10px] text-emerald-400 font-mono">API 33+</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  <code className="text-slate-300">android.permission.POST_NOTIFICATIONS</code> displays the persistent timer notification while in the background.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Check / Settings Modal */}
      <PermissionCheckModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onAllPermissionsGranted={() => {
          setShowPermissionModal(false);
          showBanner('✅ All required Android permissions granted!');
          loadAppsAndPermissions();
          checkAccessibility();
        }}
      />
    </div>
  );
};
