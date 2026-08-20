import { AppThemeConfig } from '../types';

export const THEME_PRESETS: AppThemeConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight Blue',
    category: 'dark',
    accentColor: '#3b82f6', // blue-500
    secondaryColor: '#6366f1', // indigo-500
    bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    cardBg: 'bg-slate-900/80',
    borderColor: 'border-blue-800/40',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    category: 'dark',
    accentColor: '#10b981', // emerald-500
    secondaryColor: '#14b8a6', // teal-500
    bgGradient: 'from-zinc-950 via-slate-950 to-emerald-950/80',
    cardBg: 'bg-emerald-950/30',
    borderColor: 'border-emerald-700/40',
    textPrimary: 'text-emerald-50',
    textSecondary: 'text-emerald-200/80',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'sunset',
    name: 'Sunset Twilight',
    category: 'dark',
    accentColor: '#f59e0b', // amber-500
    secondaryColor: '#f43f5e', // rose-500
    bgGradient: 'from-neutral-950 via-stone-950 to-orange-950/70',
    cardBg: 'bg-stone-900/80',
    borderColor: 'border-amber-700/40',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-amber-200/80',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'ocean',
    name: 'Ocean Abyss',
    category: 'dark',
    accentColor: '#06b6d4', // cyan-500
    secondaryColor: '#3b82f6', // blue-500
    bgGradient: 'from-slate-950 via-cyan-950/80 to-blue-950',
    cardBg: 'bg-cyan-950/30',
    borderColor: 'border-cyan-700/40',
    textPrimary: 'text-cyan-50',
    textSecondary: 'text-cyan-200/80',
    glowColor: 'rgba(6, 182, 212, 0.25)',
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    category: 'dark',
    accentColor: '#a855f7', // purple-500
    secondaryColor: '#ec4899', // pink-500
    bgGradient: 'from-slate-950 via-purple-950/80 to-slate-950',
    cardBg: 'bg-purple-950/30',
    borderColor: 'border-purple-700/40',
    textPrimary: 'text-purple-50',
    textSecondary: 'text-purple-200/80',
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'oled',
    name: 'Pure OLED Black',
    category: 'oled',
    accentColor: '#60a5fa', // blue-400
    secondaryColor: '#818cf8', // indigo-400
    bgGradient: 'from-black via-zinc-950 to-black',
    cardBg: 'bg-zinc-950',
    borderColor: 'border-zinc-800',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-400',
    glowColor: 'rgba(255, 255, 255, 0.15)',
  },
  {
    id: 'nordic',
    name: 'Nordic Frost (Light)',
    category: 'light',
    accentColor: '#2563eb', // blue-600
    secondaryColor: '#4f46e5', // indigo-600
    bgGradient: 'from-slate-100 via-blue-50/50 to-slate-200',
    cardBg: 'bg-white/90',
    borderColor: 'border-slate-300',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    glowColor: 'rgba(37, 99, 235, 0.15)',
  },
];

export const ACCENT_SWATCHES = [
  { name: 'Electric Blue', hex: '#3b82f6' },
  { name: 'Cyber Emerald', hex: '#10b981' },
  { name: 'Vibrant Purple', hex: '#a855f7' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Cyan Spark', hex: '#06b6d4' },
  { name: 'Neon Lime', hex: '#84cc16' },
  { name: 'Hot Pink', hex: '#ec4899' },
];

export class ThemeService {
  private static THEME_KEY = 'focusguard_current_theme';
  private static CUSTOM_COLOR_KEY = 'focusguard_custom_accent';

  public static getThemes(): AppThemeConfig[] {
    return THEME_PRESETS;
  }

  public static getTheme(themeId: string): AppThemeConfig {
    if (themeId === 'dark') themeId = 'midnight';
    if (themeId === 'light') themeId = 'nordic';
    const found = THEME_PRESETS.find((t) => t.id === themeId);
    return found || THEME_PRESETS[0];
  }

  public static getCurrentThemeId(): string {
    if (typeof window === 'undefined') return 'midnight';
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) {
      if (saved === 'dark') return 'midnight';
      if (saved === 'light') return 'nordic';
      return saved;
    }
    return 'midnight';
  }

  public static getCustomAccent(): string {
    if (typeof window === 'undefined') return '#3b82f6';
    return localStorage.getItem(this.CUSTOM_COLOR_KEY) || '#3b82f6';
  }

  public static applyTheme(themeId: string, customAccent?: string): void {
    if (typeof window === 'undefined') return;

    let normalized = themeId;
    if (normalized === 'dark') normalized = 'midnight';
    if (normalized === 'light') normalized = 'nordic';

    localStorage.setItem(this.THEME_KEY, normalized);
    if (customAccent) {
      localStorage.setItem(this.CUSTOM_COLOR_KEY, customAccent);
    }

    const theme = this.getTheme(normalized);
    const accent = customAccent || theme.accentColor;

    const root = document.documentElement;
    root.setAttribute('data-theme', normalized);
    if (document.body) {
      document.body.setAttribute('data-theme', normalized);
    }

    root.style.setProperty('--primary-accent', accent);
    root.style.setProperty('--primary-accent-hover', accent);
    root.style.setProperty('--primary-glow', theme.glowColor);

    // If light mode, adjust meta theme-color for mobile status bar
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.category === 'light' ? '#f8fafc' : '#020617');
    }
  }
}
