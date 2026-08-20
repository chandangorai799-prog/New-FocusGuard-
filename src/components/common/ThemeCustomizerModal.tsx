import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Sparkles, X, Sun, Moon, Zap, RefreshCw, Smartphone } from 'lucide-react';
import { THEME_PRESETS, ACCENT_SWATCHES, ThemeService } from '../../services/themeService';
import { AudioService } from '../../services/audioService';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string, customAccent?: string) => void;
  customAccentColor?: string;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  customAccentColor = '#3b82f6',
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentThemeId || 'midnight');
  const [selectedAccent, setSelectedAccent] = useState<string>(customAccentColor);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTheme(currentThemeId || 'midnight');
      setSelectedAccent(customAccentColor || '#3b82f6');
    }
  }, [isOpen, currentThemeId, customAccentColor]);

  if (!isOpen) return null;

  const handleApplyPreset = (themeId: string) => {
    AudioService.playTap();
    setSelectedTheme(themeId);
    const themeObj = THEME_PRESETS.find((t) => t.id === themeId);
    if (themeObj) {
      setSelectedAccent(themeObj.accentColor);
      onSelectTheme(themeId, themeObj.accentColor);
    }
  };

  const handleApplyCustomAccent = (hex: string) => {
    AudioService.playTap();
    setSelectedAccent(hex);
    onSelectTheme(selectedTheme, hex);
  };

  const currentConfig = THEME_PRESETS.find((t) => t.id === selectedTheme) || THEME_PRESETS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors"
                style={{ backgroundColor: selectedAccent }}
              >
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Theme & Appearance
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Personalize dashboard vibe, colors & dark mode</p>
              </div>
            </div>
            <button
              onClick={() => {
                AudioService.playTap();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="px-5 pt-3 flex gap-2 border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => {
                AudioService.playTap();
                setActiveTab('presets');
              }}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'presets'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme Presets ({THEME_PRESETS.length})</span>
            </button>
            <button
              onClick={() => {
                AudioService.playTap();
                setActiveTab('custom');
              }}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Custom Accent Color</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Live Mini Preview Box */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 relative overflow-hidden transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse shadow-sm"
                    style={{ backgroundColor: selectedAccent }}
                  />
                  <span className="text-xs font-bold text-white">{currentConfig.name} Accent</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                  Accent Color
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between gap-2 backdrop-blur-sm">
                <div>
                  <p className="text-xs font-semibold text-white">Focus Session Active</p>
                  <p className="text-[11px] text-slate-300">Productivity Score: 94%</p>
                </div>
                <button
                  type="button"
                  style={{ backgroundColor: selectedAccent }}
                  className="px-3 py-1 rounded-lg text-white font-bold text-xs shadow-md"
                >
                  Start
                </button>
              </div>
            </div>

            {activeTab === 'presets' ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Theme Atmosphere
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = selectedTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2.5">
                            {/* Theme Swatch Ring */}
                            <div
                              className="w-6 h-6 rounded-full border-2 border-white/20 shadow-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: preset.accentColor }}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </div>
                            <span className="font-semibold text-xs text-white">{preset.name}</span>
                          </div>
                          {preset.category === 'light' ? (
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Moon className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>

                        {/* Visual Palette Strip */}
                        <div className="flex items-center space-x-1.5 w-full">
                          <div
                            className="h-2 flex-1 rounded-full"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <div
                            className="h-2 flex-1 rounded-full"
                            style={{ backgroundColor: preset.secondaryColor }}
                          />
                          <div className="h-2 flex-1 rounded-full bg-slate-800 border border-slate-700" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Choose Custom Accent Glow
                </label>

                <div className="grid grid-cols-4 gap-3">
                  {ACCENT_SWATCHES.map((swatch) => {
                    const isSelected = selectedAccent.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => handleApplyCustomAccent(swatch.hex)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-white ring-2 ring-blue-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full shadow-md flex items-center justify-center"
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[10px] text-slate-300 text-center font-medium truncate w-full">
                          {swatch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Custom Hex Code</span>
                    <span className="text-xs font-mono text-blue-400">{selectedAccent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedAccent}
                      onChange={(e) => handleApplyCustomAccent(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={selectedAccent}
                      onChange={(e) => handleApplyCustomAccent(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                AudioService.playTap();
                handleApplyPreset('midnight');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={() => {
                AudioService.playSuccess();
                onClose();
              }}
              style={{ backgroundColor: selectedAccent }}
              className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
