import React from 'react';
import { Home, Zap, Calendar, Sparkles, CheckSquare } from 'lucide-react';
import { AudioService } from '../../services/audioService';

export type BottomNavTab = 'dashboard' | 'focus' | 'planner' | 'assistant' | 'tasks' | 'profile';

interface BottomNavProps {
  activeTab: string;
  onTabChange?: (tab: any) => void;
  onTabSelect?: (tab: string) => void;
  isFocusActive?: boolean;
  pendingTasksCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onTabSelect,
  isFocusActive = false,
  pendingTasksCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'focus', label: 'Focus', icon: Zap },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'assistant', label: 'AI Tutor', icon: Sparkles },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  const handleSelect = (tabId: string) => {
    AudioService.playTap();
    if (onTabSelect) {
      onTabSelect(tabId);
    } else if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <nav className="w-full bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 text-slate-400 select-none z-30 sticky bottom-0 py-1.5 px-2">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'focus' && activeTab === 'pomodoro') ||
            (tab.id === 'planner' && activeTab === 'planner') ||
            (tab.id === 'assistant' && activeTab === 'assistant');
          const isFocusTab = tab.id === 'focus';
          const isTaskTab = tab.id === 'tasks';

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => handleSelect(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span
                  className="absolute -top-1 w-8 h-1 rounded-full shadow-sm bg-blue-500 shadow-blue-500/50"
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-400' : ''
                  }`}
                />
                {isFocusTab && isFocusActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping ring-2 ring-slate-900"></span>
                )}
                {isTaskTab && pendingTasksCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                    {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


