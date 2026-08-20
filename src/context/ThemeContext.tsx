import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppThemeConfig } from '../types';
import { THEME_PRESETS, ACCENT_SWATCHES, ThemeService } from '../services/themeService';
import { StorageService } from '../services/storage';

interface ThemeContextType {
  currentTheme: string;
  customAccent: string;
  themeConfig: AppThemeConfig;
  isLight: boolean;
  isOled: boolean;
  setTheme: (themeId: string, customAccent?: string) => void;
  setCustomAccent: (hex: string) => void;
  resetTheme: () => void;
  availableThemes: AppThemeConfig[];
  availableSwatches: { name: string; hex: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from storage or profile
  const [currentTheme, setCurrentThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'midnight';
    const saved = localStorage.getItem('focusguard_current_theme');
    if (saved) return saved;
    try {
      const profile = StorageService.getProfile();
      if (profile.theme) {
        if (profile.theme === 'dark') return 'midnight';
        if (profile.theme === 'light') return 'nordic';
        return profile.theme;
      }
    } catch {
      // ignore
    }
    return 'midnight';
  });

  const [customAccent, setCustomAccentState] = useState<string>(() => {
    if (typeof window === 'undefined') return '#3b82f6';
    const saved = localStorage.getItem('focusguard_custom_accent');
    if (saved) return saved;
    try {
      const profile = StorageService.getProfile();
      if (profile.customThemeColor) return profile.customThemeColor;
    } catch {
      // ignore
    }
    return '#3b82f6';
  });

  const themeConfig = ThemeService.getTheme(currentTheme);
  const isLight = themeConfig.category === 'light';
  const isOled = themeConfig.category === 'oled';

  // Apply theme to DOM and CSS engine whenever theme or customAccent changes
  useEffect(() => {
    ThemeService.applyTheme(currentTheme, customAccent);
  }, [currentTheme, customAccent]);

  const setTheme = useCallback((themeId: string, accentHex?: string) => {
    let normalized = themeId;
    if (themeId === 'dark') normalized = 'midnight';
    if (themeId === 'light') normalized = 'nordic';

    const targetTheme = ThemeService.getTheme(normalized);
    const accent = accentHex || targetTheme.accentColor;

    setCurrentThemeState(normalized);
    setCustomAccentState(accent);

    localStorage.setItem('focusguard_current_theme', normalized);
    localStorage.setItem('focusguard_custom_accent', accent);

    // Sync with user profile storage
    try {
      const profile = StorageService.getProfile();
      StorageService.saveProfile({
        ...profile,
        theme: normalized,
        customThemeColor: accent,
      });
    } catch (e) {
      console.error('Failed to sync theme with profile:', e);
    }

    ThemeService.applyTheme(normalized, accent);
  }, []);

  const setCustomAccent = useCallback((hex: string) => {
    setCustomAccentState(hex);
    localStorage.setItem('focusguard_custom_accent', hex);

    try {
      const profile = StorageService.getProfile();
      StorageService.saveProfile({
        ...profile,
        customThemeColor: hex,
      });
    } catch (e) {
      console.error('Failed to sync custom accent with profile:', e);
    }

    ThemeService.applyTheme(currentTheme, hex);
  }, [currentTheme]);

  const resetTheme = useCallback(() => {
    setTheme('midnight', '#3b82f6');
  }, [setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        customAccent,
        themeConfig,
        isLight,
        isOled,
        setTheme,
        setCustomAccent,
        resetTheme,
        availableThemes: THEME_PRESETS,
        availableSwatches: ACCENT_SWATCHES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
