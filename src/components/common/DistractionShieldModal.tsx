import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
  Settings,
  EyeOff,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Check,
  Filter,
  Play,
  Sparkles,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { BlockedApp, AppBlockerCategory } from '../../types';
import { StorageService, DEFAULT_BLOCKED_APPS } from '../../services/storage';
import { AudioService } from '../../services/audioService';

interface DistractionShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlocklistUpdated?: (count: number) => void;
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
  { name: 'LinkedIn', category: 'Social', icon: '💼', pkg: 'com.linkedin.android' },
  { name: 'Spotify Music', category: 'Entertainment', icon: '🎧', pkg: 'com.spotify.music' },
  { name: 'Telegram Beta', category: 'Messaging', icon: '✈️', pkg: 'org.telegram.messenger' },
  { name: 'Pinterest', category: 'Social', icon: '📌', pkg: 'com.pinterest' },
  { name: 'Subway Surfers', category: 'Gaming', icon: '🛹', pkg: 'com.kiloo.subwaysurf' },
  { name: '8 Ball Pool', category: 'Gaming', icon: '🎱', pkg: 'com.miniclip.eightballpool' },
];

export const DistractionShieldModal: React.FC<DistractionShieldModalProps> = ({
  isOpen,
  onClose,
  onBlocklistUpdated,
}) => {
  const [apps, setApps] = useState<BlockedApp[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'categories' | 'android'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [dndMode, setDndMode] = useState<boolean>(true);
  const [testedApp, setTestedApp] = useState<BlockedApp | null>(null);

  // New Custom App Form State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<AppBlockerCategory>('Social');
  const [customPackage, setCustomPackage] = useState<string>('');
  const [customIcon, setCustomIcon] = useState<string>('📱');
  const [customBlockReason, setCustomBlockReason] = useState<string>('');
  const [addSuccessMessage, setAddSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadApps();
    }
  }, [isOpen]);

  const loadApps = () => {
    const loaded = StorageService.getBlockedApps();
    setApps(loaded);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(loaded.filter((a) => a.isBlocked).length);
    }
  };

  if (!isOpen) return null;

  const totalAppsCount = apps.length;
  const blockedAppsCount = apps.filter((a) => a.isBlocked).length;

  const handleToggleApp = (id: string) => {
    AudioService.playTap();
    const updated = StorageService.toggleAppBlock(id);
    if (updated) {
      const newApps = apps.map((a) => (a.id === id ? updated : a));
      setApps(newApps);
      if (onBlocklistUpdated) {
        onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
      }
    }
  };

  const handleBlockAll = () => {
    AudioService.playTap();
    const newApps = StorageService.blockAllApps();
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(newApps.length);
    }
  };

  const handleUnblockAll = () => {
    AudioService.playTap();
    const newApps = StorageService.unblockAllApps();
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(0);
    }
  };

  const handleResetDefaults = () => {
    AudioService.playTap();
    const newApps = StorageService.resetBlockedAppsToDefault();
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
    }
  };

  const handleCategoryToggle = (category: AppBlockerCategory, blockState: boolean) => {
    AudioService.playTap();
    const newApps = StorageService.setCategoryBlocked(category, blockState);
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
    }
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    AudioService.playTap();
    const success = StorageService.deleteCustomApp(id);
    if (success) {
      const newApps = apps.filter((a) => a.id !== id);
      setApps(newApps);
      if (onBlocklistUpdated) {
        onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
      }
    }
  };

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    AudioService.playSuccess();
    const created = StorageService.addCustomApp({
      name: customName.trim(),
      category: customCategory,
      packageName: customPackage.trim() || `com.custom.${customName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      icon: customIcon,
      isBlocked: true,
      blockReason: customBlockReason.trim() || undefined,
    });

    const newApps = [created, ...apps];
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
    }

    setAddSuccessMessage(`✅ "${customName}" has been added and blocked!`);
    setCustomName('');
    setCustomPackage('');
    setCustomBlockReason('');
    setTimeout(() => {
      setAddSuccessMessage('');
      setActiveTab('list');
    }, 1200);
  };

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    AudioService.playTap();
    const alreadyExists = apps.some(
      (a) => a.name.toLowerCase() === preset.name.toLowerCase() || a.packageName === preset.pkg
    );
    if (alreadyExists) {
      setAddSuccessMessage(`ℹ️ "${preset.name}" is already in your app list!`);
      setTimeout(() => setAddSuccessMessage(''), 2000);
      return;
    }

    const created = StorageService.addCustomApp({
      name: preset.name,
      category: preset.category,
      packageName: preset.pkg,
      icon: preset.icon,
      isBlocked: true,
    });

    const newApps = [created, ...apps];
    setApps(newApps);
    if (onBlocklistUpdated) {
      onBlocklistUpdated(newApps.filter((a) => a.isBlocked).length);
    }
    setAddSuccessMessage(`✅ Preset "${preset.name}" added to blocklist!`);
    setTimeout(() => setAddSuccessMessage(''), 1500);
  };

  // Filtered Apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.packageName && app.packageName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategoryFilter === 'All') return true;
    if (selectedCategoryFilter === 'Blocked') return app.isBlocked;
    if (selectedCategoryFilter === 'Allowed') return !app.isBlocked;
    if (selectedCategoryFilter === 'Custom') return app.isCustom;
    return app.category === selectedCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Simulation Screen if an app was tested */}
      {testedApp && (
        <div className="fixed inset-0 z-60 bg-slate-950/95 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-red-900/40 relative animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500/40 text-3xl flex items-center justify-center mx-auto mb-4">
              {testedApp.icon || '🛑'}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold mb-2">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              App Blocked by FocusGuard
            </span>

            <h3 className="text-xl font-extrabold text-white mb-1">{testedApp.name}</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">{testedApp.packageName || 'com.app.blocked'}</p>

            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 mb-5 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium text-slate-400">Current Mode:</span>
                <span className="font-bold text-blue-400">Active Study Focus</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium text-slate-400">Shield Reason:</span>
                <span className="font-bold text-amber-300">Exam Prep / Deep Study</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                "Stay locked in! You are 1 step closer to achieving your grade target."
              </p>
            </div>

            <button
              onClick={() => {
                AudioService.playSuccess();
                setTestedApp(null);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:opacity-95 transition"
            >
              Return to Study Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Modal Window */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Focus Shield & App Blocker</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                  {blockedAppsCount} / {totalAppsCount} Blocked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Apni marji ke apps select aur block karein (Custom blocklist)
              </p>
            </div>
          </div>
          <button
            id="close-shield-modal-btn"
            onClick={() => {
              AudioService.playTap();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Shield & DND Banner */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Lock className={`w-4 h-4 ${shieldActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-slate-200">Shield Protection</span>
            </div>
            <button
              onClick={() => {
                AudioService.playTap();
                setShieldActive(!shieldActive);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                shieldActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {shieldActive ? 'Active (ON)' : 'Paused (OFF)'}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium">Auto DND</span>
            </div>
            <button
              onClick={() => {
                AudioService.playTap();
                setDndMode(!dndMode);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                dndMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {dndMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 flex items-center space-x-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            id="tab-apps-list"
            onClick={() => {
              AudioService.playTap();
              setActiveTab('list');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'list'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            App List ({apps.length})
          </button>

          <button
            id="tab-add-custom-app"
            onClick={() => {
              AudioService.playTap();
              setActiveTab('add');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'add'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            + Add Custom App
          </button>

          <button
            id="tab-categories-bulk"
            onClick={() => {
              AudioService.playTap();
              setActiveTab('categories');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Categories ({CATEGORIES.length})
          </button>

          <button
            id="tab-android-architecture"
            onClick={() => {
              AudioService.playTap();
              setActiveTab('android');
            }}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'android'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            Android Architecture
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: APPS LIST VIEW */}
          {activeTab === 'list' && (
            <div className="space-y-3.5">
              {/* Search & Bulk Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-apps-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apps by name or package..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
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

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    id="btn-block-all"
                    onClick={handleBlockAll}
                    className="px-2.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition flex items-center gap-1"
                    title="Block All Apps"
                  >
                    <Lock className="w-3 h-3" />
                    Block All
                  </button>
                  <button
                    id="btn-unblock-all"
                    onClick={handleUnblockAll}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition"
                    title="Unblock All Apps"
                  >
                    Unblock All
                  </button>
                  <button
                    id="btn-reset-defaults"
                    onClick={handleResetDefaults}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                    title="Reset to default recommended apps"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Blocked', 'Allowed', 'Custom', 'Social', 'Entertainment', 'Gaming', 'Messaging', 'Shopping'].map(
                  (filter) => {
                    const isSelected = selectedCategoryFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => {
                          AudioService.playTap();
                          setSelectedCategoryFilter(filter);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  }
                )}
              </div>

              {/* App List Items */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredApps.length === 0 ? (
                  <div className="py-10 text-center space-y-3 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-400">No apps found matching your query.</p>
                    <button
                      onClick={() => {
                        setActiveTab('add');
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
                      className={`group p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                        app.isBlocked
                          ? 'bg-slate-800/70 border-slate-700/80 hover:border-blue-500/50'
                          : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 transition ${
                            app.isBlocked
                              ? 'bg-blue-600/20 border border-blue-500/30'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {app.icon || '📱'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{app.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              {app.category}
                            </span>
                            {app.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {app.packageName || 'com.app'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Simulate Test Shield Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            AudioService.playTap();
                            setTestedApp(app);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                          title="Simulate opening this blocked app"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete if custom */}
                        {app.isCustom && (
                          <button
                            onClick={(e) => handleDeleteCustom(app.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                            title="Delete custom app"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Toggle Checkbox Switch */}
                        <div
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                            app.isBlocked ? 'bg-blue-600' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                              app.isBlocked ? 'translate-x-5' : 'translate-x-0'
                            } shadow flex items-center justify-center`}
                          >
                            {app.isBlocked && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADD CUSTOM APP VIEW */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 p-4 rounded-2xl border border-blue-700/40 space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Custom App Blocker (Apni marji se app jodein)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Add any specific installed app, game, or distracting package to your custom focus shield.
                </p>
              </div>

              {addSuccessMessage && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold animate-fadeIn">
                  {addSuccessMessage}
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Add Popular Apps
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-left flex items-center space-x-2.5 transition text-xs group"
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <div className="truncate">
                        <p className="font-bold text-white group-hover:text-blue-300 truncate">{preset.name}</p>
                        <p className="text-[10px] text-slate-400">{preset.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom App Form */}
              <form onSubmit={handleAddCustomApp} className="space-y-3.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      App Name *
                    </label>
                    <input
                      id="custom-app-name-input"
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Candy Crush, Valorant, etc."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      id="custom-app-category-select"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as AppBlockerCategory)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Android Package Name (Optional)
                    </label>
                    <input
                      id="custom-app-pkg-input"
                      type="text"
                      value={customPackage}
                      onChange={(e) => setCustomPackage(e.target.value)}
                      placeholder="e.g. com.game.candycrush"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reason for Blocking (Optional)
                    </label>
                    <input
                      id="custom-app-reason-input"
                      type="text"
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      placeholder="e.g. Causes continuous doom-scrolling"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Emoji Icon Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Icon / Emoji
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          AudioService.playTap();
                          setCustomIcon(emoji);
                        }}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition ${
                          customIcon === emoji
                            ? 'bg-blue-600 text-white scale-110 shadow'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    id="submit-add-custom-app-btn"
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    Save & Block App
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CATEGORY RULES */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Quickly toggle whole categories of apps with a single click.
              </p>

              {CATEGORIES.map((category) => {
                const categoryApps = apps.filter((a) => a.category === category);
                const allBlocked = categoryApps.length > 0 && categoryApps.every((a) => a.isBlocked);
                const someBlocked = categoryApps.some((a) => a.isBlocked);
                const blockedCount = categoryApps.filter((a) => a.isBlocked).length;

                return (
                  <div
                    key={category}
                    className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between transition hover:bg-slate-800/80"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{category}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({blockedCount}/{categoryApps.length} Blocked)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                        {categoryApps.map((a) => a.name).join(', ') || 'No apps configured in this category'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCategoryToggle(category, !allBlocked)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          allBlocked
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                            : someBlocked
                            ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {allBlocked ? 'All Blocked' : someBlocked ? 'Partial' : 'Allow All'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ANDROID ARCHITECTURE */}
          {activeTab === 'android' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Native Android App Blocker Mechanics</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  When built as an Android APK (using Capacitor, Kotlin, or React Native), FocusGuard runs a background Accessibility & Usage Stats service:
                </p>

                <div className="space-y-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-bold">1. android.permission.PACKAGE_USAGE_STATS</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">Detects in real-time whenever a blocked package comes to the foreground.</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-bold">2. android.permission.SYSTEM_ALERT_WINDOW</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">Renders the FocusGuard shield overlay directly over the blocked app, preventing distraction.</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-bold">3. android.permission.ACCESS_NOTIFICATION_POLICY</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">Enables Priority Do-Not-Disturb (DND) automatically during active Pomodoros.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-blue-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Simulated Web Engine: All custom blocklist rules run live in the app preview!</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {blockedAppsCount} of {totalAppsCount} apps shielded
          </span>

          <button
            id="save-shield-settings-btn"
            onClick={() => {
              AudioService.playTap();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30"
          >
            Done & Save Blocklist
          </button>
        </div>
      </div>
    </div>
  );
};
