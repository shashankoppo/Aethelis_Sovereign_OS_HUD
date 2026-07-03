import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';

// ── OS Theme Definitions ───────────────────────────────────────────────────────

export type OSThemeId =
  | 'aethelis'
  | 'windows11'
  | 'macos'
  | 'ios'
  | 'android'
  | 'samsung';

export type AccentColor =
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'green'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'teal'
  | 'sky'
  | 'white';

export type FontFamily = 'inter' | 'mono' | 'rounded' | 'serif' | 'system';
export type DockPosition = 'bottom' | 'left' | 'right';
export type BorderRadius = 'sharp' | 'default' | 'rounded' | 'pill';
export type AnimationSpeed = 'off' | 'slow' | 'normal' | 'fast';
export type IconSize = 'small' | 'medium' | 'large';

export type WallpaperId =
  | 'default'
  | 'win11_bloom'
  | 'win11_sunrise'
  | 'win11_glow'
  | 'mac_sonoma'
  | 'mac_monterey'
  | 'mac_bigsur'
  | 'ios_dark'
  | 'ios_light'
  | 'ios_aurora'
  | 'android_you'
  | 'android_space'
  | 'samsung_aurora'
  | 'deep_space'
  | 'nebula'
  | 'void'
  | 'custom';

export interface OSThemeDef {
  id: OSThemeId;
  name: string;
  platform: string;
  preview: string; // CSS gradient for preview swatch
  wallpaper: WallpaperId; // default wallpaper
  accent: AccentColor;
  font: FontFamily;
  radius: BorderRadius;
  glassBlur: number;
  vars: Record<string, string>;
}

export const OS_THEMES: Record<OSThemeId, OSThemeDef> = {
  aethelis: {
    id: 'aethelis',
    name: 'Aethelis Sovereign',
    platform: 'Sovereign OS',
    preview: 'linear-gradient(135deg, #030712 0%, #0a1628 40%, #051520 70%, #030712 100%)',
    wallpaper: 'default',
    accent: 'cyan',
    font: 'inter',
    radius: 'default',
    glassBlur: 12,
    vars: {
      '--theme-bg':          'rgba(5, 8, 17, 0.92)',
      '--theme-glass':       'rgba(255,255,255,0.05)',
      '--theme-glass-hover': 'rgba(255,255,255,0.08)',
      '--theme-border':      'rgba(255,255,255,0.08)',
      '--theme-text':        'rgba(255,255,255,0.85)',
      '--theme-text-dim':    'rgba(255,255,255,0.40)',
      '--theme-titlebar':    'rgba(5,8,17,0.72)',
      '--theme-sidebar':     'rgba(255,255,255,0.025)',
      '--theme-card':        'rgba(255,255,255,0.04)',
      '--theme-input':       'rgba(255,255,255,0.07)',
      '--theme-radius-sm':   '10px',
      '--theme-radius-md':   '16px',
      '--theme-radius-lg':   '22px',
      '--theme-radius-xl':   '28px',
      '--theme-blur':        'blur(12px)',
      '--theme-shadow':      '0 25px 50px rgba(0,0,0,0.6)',
    },
  },
  windows11: {
    id: 'windows11',
    name: 'Windows 11',
    platform: 'Microsoft Windows',
    preview: 'linear-gradient(135deg, #001f4d 0%, #0052cc 35%, #006eff 60%, #0091ff 100%)',
    wallpaper: 'win11_bloom',
    accent: 'blue',
    font: 'system',
    radius: 'sharp',
    glassBlur: 20,
    vars: {
      '--theme-bg':          'rgba(0,16,36,0.88)',
      '--theme-glass':       'rgba(255,255,255,0.08)',
      '--theme-glass-hover': 'rgba(255,255,255,0.12)',
      '--theme-border':      'rgba(255,255,255,0.12)',
      '--theme-text':        'rgba(255,255,255,0.90)',
      '--theme-text-dim':    'rgba(255,255,255,0.50)',
      '--theme-titlebar':    'rgba(0,20,50,0.80)',
      '--theme-sidebar':     'rgba(255,255,255,0.06)',
      '--theme-card':        'rgba(255,255,255,0.06)',
      '--theme-input':       'rgba(255,255,255,0.08)',
      '--theme-radius-sm':   '6px',
      '--theme-radius-md':   '8px',
      '--theme-radius-lg':   '10px',
      '--theme-radius-xl':   '12px',
      '--theme-blur':        'blur(20px)',
      '--theme-shadow':      '0 16px 40px rgba(0,0,0,0.5)',
    },
  },
  macos: {
    id: 'macos',
    name: 'macOS Sonoma',
    platform: 'Apple macOS',
    preview: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 30%, #0c4a6e 60%, #164e63 100%)',
    wallpaper: 'mac_sonoma',
    accent: 'sky',
    font: 'system',
    radius: 'default',
    glassBlur: 16,
    vars: {
      '--theme-bg':          'rgba(0,0,0,0.78)',
      '--theme-glass':       'rgba(255,255,255,0.10)',
      '--theme-glass-hover': 'rgba(255,255,255,0.16)',
      '--theme-border':      'rgba(255,255,255,0.14)',
      '--theme-text':        'rgba(255,255,255,0.92)',
      '--theme-text-dim':    'rgba(255,255,255,0.45)',
      '--theme-titlebar':    'rgba(15,15,25,0.68)',
      '--theme-sidebar':     'rgba(255,255,255,0.06)',
      '--theme-card':        'rgba(255,255,255,0.07)',
      '--theme-input':       'rgba(255,255,255,0.10)',
      '--theme-radius-sm':   '8px',
      '--theme-radius-md':   '12px',
      '--theme-radius-lg':   '16px',
      '--theme-radius-xl':   '22px',
      '--theme-blur':        'blur(16px)',
      '--theme-shadow':      '0 20px 60px rgba(0,0,0,0.55)',
    },
  },
  ios: {
    id: 'ios',
    name: 'iOS 18',
    platform: 'Apple iPhone',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 35%, #155e75 60%, #0f4c6b 100%)',
    wallpaper: 'ios_aurora',
    accent: 'blue',
    font: 'rounded',
    radius: 'rounded',
    glassBlur: 22,
    vars: {
      '--theme-bg':          'rgba(2,8,23,0.85)',
      '--theme-glass':       'rgba(255,255,255,0.12)',
      '--theme-glass-hover': 'rgba(255,255,255,0.18)',
      '--theme-border':      'rgba(255,255,255,0.15)',
      '--theme-text':        'rgba(255,255,255,0.92)',
      '--theme-text-dim':    'rgba(255,255,255,0.45)',
      '--theme-titlebar':    'rgba(5,12,30,0.72)',
      '--theme-sidebar':     'rgba(255,255,255,0.07)',
      '--theme-card':        'rgba(255,255,255,0.09)',
      '--theme-input':       'rgba(255,255,255,0.12)',
      '--theme-radius-sm':   '14px',
      '--theme-radius-md':   '20px',
      '--theme-radius-lg':   '26px',
      '--theme-radius-xl':   '32px',
      '--theme-blur':        'blur(22px)',
      '--theme-shadow':      '0 20px 50px rgba(0,0,0,0.5)',
    },
  },
  android: {
    id: 'android',
    name: 'Android Material You',
    platform: 'Google Android',
    preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 35%, #0d3b4a 60%, #0a2e3d 100%)',
    wallpaper: 'android_you',
    accent: 'teal',
    font: 'rounded',
    radius: 'pill',
    glassBlur: 10,
    vars: {
      '--theme-bg':          'rgba(10,10,20,0.90)',
      '--theme-glass':       'rgba(255,255,255,0.06)',
      '--theme-glass-hover': 'rgba(255,255,255,0.10)',
      '--theme-border':      'rgba(255,255,255,0.09)',
      '--theme-text':        'rgba(255,255,255,0.90)',
      '--theme-text-dim':    'rgba(255,255,255,0.42)',
      '--theme-titlebar':    'rgba(10,12,22,0.80)',
      '--theme-sidebar':     'rgba(255,255,255,0.04)',
      '--theme-card':        'rgba(255,255,255,0.05)',
      '--theme-input':       'rgba(255,255,255,0.08)',
      '--theme-radius-sm':   '16px',
      '--theme-radius-md':   '24px',
      '--theme-radius-lg':   '32px',
      '--theme-radius-xl':   '48px',
      '--theme-blur':        'blur(10px)',
      '--theme-shadow':      '0 12px 36px rgba(0,0,0,0.45)',
    },
  },
  samsung: {
    id: 'samsung',
    name: 'Samsung One UI',
    platform: 'Samsung Galaxy',
    preview: 'linear-gradient(135deg, #050510 0%, #0a1040 35%, #0d1a55 60%, #091545 100%)',
    wallpaper: 'samsung_aurora',
    accent: 'blue',
    font: 'system',
    radius: 'rounded',
    glassBlur: 14,
    vars: {
      '--theme-bg':          'rgba(5,5,18,0.91)',
      '--theme-glass':       'rgba(255,255,255,0.07)',
      '--theme-glass-hover': 'rgba(255,255,255,0.12)',
      '--theme-border':      'rgba(255,255,255,0.10)',
      '--theme-text':        'rgba(255,255,255,0.90)',
      '--theme-text-dim':    'rgba(255,255,255,0.42)',
      '--theme-titlebar':    'rgba(5,8,22,0.76)',
      '--theme-sidebar':     'rgba(255,255,255,0.05)',
      '--theme-card':        'rgba(255,255,255,0.05)',
      '--theme-input':       'rgba(255,255,255,0.09)',
      '--theme-radius-sm':   '12px',
      '--theme-radius-md':   '18px',
      '--theme-radius-lg':   '24px',
      '--theme-radius-xl':   '30px',
      '--theme-blur':        'blur(14px)',
      '--theme-shadow':      '0 18px 45px rgba(0,0,0,0.52)',
    },
  },
};

// ── Wallpaper Definitions ────────────────────────────────────────────────────

export interface WallpaperDef {
  id: WallpaperId;
  name: string;
  theme: OSThemeId | 'universal';
  gradient: string; // Full CSS background string
}

export const WALLPAPERS: Record<WallpaperId, WallpaperDef> = {
  default: {
    id: 'default', name: 'Aethelis Void', theme: 'aethelis',
    gradient: 'linear-gradient(180deg, #010308 0%, #040d1a 40%, #060e20 70%, #020711 100%)',
  },
  win11_bloom: {
    id: 'win11_bloom', name: 'Windows 11 Bloom', theme: 'windows11',
    gradient: 'linear-gradient(160deg, #001533 0%, #002766 25%, #004299 50%, #003380 75%, #001533 100%)',
  },
  win11_sunrise: {
    id: 'win11_sunrise', name: 'Win11 Sunrise', theme: 'windows11',
    gradient: 'linear-gradient(160deg, #1a0533 0%, #4a0e6b 25%, #7b1fa2 45%, #e91e63 70%, #ff5722 90%, #ff9800 100%)',
  },
  win11_glow: {
    id: 'win11_glow', name: 'Win11 Glow', theme: 'windows11',
    gradient: 'linear-gradient(180deg, #001122 0%, #002244 30%, #003366 55%, #001e44 80%, #000e22 100%)',
  },
  mac_sonoma: {
    id: 'mac_sonoma', name: 'macOS Sonoma', theme: 'macos',
    gradient: 'linear-gradient(160deg, #0a001f 0%, #1a0050 20%, #2d1b69 40%, #1a3a6b 60%, #0c3a5e 80%, #051c2e 100%)',
  },
  mac_monterey: {
    id: 'mac_monterey', name: 'macOS Monterey', theme: 'macos',
    gradient: 'linear-gradient(150deg, #0d1b2a 0%, #1b263b 20%, #415a77 40%, #778da9 60%, #415a77 80%, #1b263b 100%)',
  },
  mac_bigsur: {
    id: 'mac_bigsur', name: 'macOS Big Sur', theme: 'macos',
    gradient: 'linear-gradient(170deg, #1a0040 0%, #2d0070 20%, #1a4080 40%, #0080b0 60%, #00b0c0 80%, #40d0a0 100%)',
  },
  ios_dark: {
    id: 'ios_dark', name: 'iOS Dark', theme: 'ios',
    gradient: 'linear-gradient(170deg, #000000 0%, #0a0a0a 40%, #111111 70%, #0a0a0a 100%)',
  },
  ios_light: {
    id: 'ios_light', name: 'iOS Dusk', theme: 'ios',
    gradient: 'linear-gradient(160deg, #0a0e2a 0%, #141f4d 25%, #1a2e6b 50%, #162548 75%, #0d1633 100%)',
  },
  ios_aurora: {
    id: 'ios_aurora', name: 'iOS Aurora', theme: 'ios',
    gradient: 'linear-gradient(160deg, #050020 0%, #0a0040 20%, #001a4d 40%, #003366 60%, #006680 80%, #004466 100%)',
  },
  android_you: {
    id: 'android_you', name: 'Material You', theme: 'android',
    gradient: 'linear-gradient(160deg, #001a2c 0%, #002244 25%, #003355 50%, #002244 75%, #001122 100%)',
  },
  android_space: {
    id: 'android_space', name: 'Android Space', theme: 'android',
    gradient: 'linear-gradient(180deg, #000005 0%, #05000f 30%, #0a0018 60%, #050010 100%)',
  },
  samsung_aurora: {
    id: 'samsung_aurora', name: 'Galaxy Aurora', theme: 'samsung',
    gradient: 'linear-gradient(160deg, #000033 0%, #000066 25%, #000099 50%, #0000cc 75%, #000055 100%)',
  },
  deep_space: {
    id: 'deep_space', name: 'Deep Space', theme: 'universal',
    gradient: 'linear-gradient(180deg, #010105 0%, #030815 30%, #040c1e 60%, #020710 100%)',
  },
  nebula: {
    id: 'nebula', name: 'Nebula Storm', theme: 'universal',
    gradient: 'linear-gradient(135deg, #050010 0%, #150030 25%, #200050 50%, #100030 75%, #050010 100%)',
  },
  void: {
    id: 'void', name: 'Pure Void', theme: 'universal',
    gradient: 'linear-gradient(180deg, #000000 0%, #050505 100%)',
  },
  custom: {
    id: 'custom', name: 'Custom', theme: 'universal',
    gradient: '',
  },
};

// ── Accent Color Definitions ─────────────────────────────────────────────────

export const ACCENT_COLORS: Record<AccentColor, { name: string; value: string; tw: string; glow: string }> = {
  cyan:   { name: 'Cyan',    value: '#22d3ee', tw: 'text-cyan-400',   glow: 'rgba(34,211,238,0.3)' },
  blue:   { name: 'Blue',    value: '#3b82f6', tw: 'text-blue-400',   glow: 'rgba(59,130,246,0.3)' },
  sky:    { name: 'Sky',     value: '#0ea5e9', tw: 'text-sky-400',    glow: 'rgba(14,165,233,0.3)' },
  violet: { name: 'Violet',  value: '#8b5cf6', tw: 'text-violet-400', glow: 'rgba(139,92,246,0.3)' },
  green:  { name: 'Green',   value: '#22c55e', tw: 'text-green-400',  glow: 'rgba(34,197,94,0.3)'  },
  teal:   { name: 'Teal',    value: '#2dd4bf', tw: 'text-teal-400',   glow: 'rgba(45,212,191,0.3)' },
  amber:  { name: 'Amber',   value: '#f59e0b', tw: 'text-amber-400',  glow: 'rgba(245,158,11,0.3)' },
  orange: { name: 'Orange',  value: '#f97316', tw: 'text-orange-400', glow: 'rgba(249,115,22,0.3)' },
  rose:   { name: 'Rose',    value: '#f43f5e', tw: 'text-rose-400',   glow: 'rgba(244,63,94,0.3)'  },
  white:  { name: 'Neutral', value: '#e2e8f0', tw: 'text-slate-200',  glow: 'rgba(226,232,240,0.2)' },
};

export const FONT_FAMILIES: Record<FontFamily, { name: string; css: string; preview: string }> = {
  inter:   { name: 'Inter',          css: "'Inter', sans-serif",                         preview: 'The quick brown fox' },
  mono:    { name: 'Mono',           css: "'JetBrains Mono', 'Fira Code', monospace",    preview: 'The quick brown fox' },
  rounded: { name: 'Rounded',        css: "'Nunito', 'Poppins', sans-serif",             preview: 'The quick brown fox' },
  serif:   { name: 'Serif',          css: "'Georgia', 'Times New Roman', serif",         preview: 'The quick brown fox' },
  system:  { name: 'System Default', css: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", preview: 'The quick brown fox' },
};

// ── Theme Settings Interface ─────────────────────────────────────────────────

export interface ThemeSettings {
  osTheme: OSThemeId;
  wallpaperId: WallpaperId;
  wallpaperCustomUrl: string;
  accentColor: AccentColor;
  fontFamily: FontFamily;
  dockPosition: DockPosition;
  glassBlur: number;
  borderRadius: BorderRadius;
  animationSpeed: AnimationSpeed;
  iconSize: IconSize;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  osTheme: 'aethelis',
  wallpaperId: 'default',
  wallpaperCustomUrl: '',
  accentColor: 'cyan',
  fontFamily: 'inter',
  dockPosition: 'bottom',
  glassBlur: 12,
  borderRadius: 'default',
  animationSpeed: 'normal',
  iconSize: 'medium',
};

// ── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeSettings;
  isLoading: boolean;
  currentThemeDef: OSThemeDef;
  currentWallpaper: WallpaperDef;
  currentAccent: { name: string; value: string; tw: string; glow: string };
  setOSTheme: (id: OSThemeId) => void;
  setWallpaper: (id: WallpaperId, customUrl?: string) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontFamily: (font: FontFamily) => void;
  setDockPosition: (pos: DockPosition) => void;
  setGlassBlur: (blur: number) => void;
  setBorderRadius: (r: BorderRadius) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setIconSize: (size: IconSize) => void;
  applyThemePreset: (id: OSThemeId) => void;
  resetToDefaults: () => void;
  getWallpaperStyle: () => React.CSSProperties;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── CSS Variable Application ─────────────────────────────────────────────────

function applyThemeVars(settings: ThemeSettings): void {
  const root = document.documentElement;
  const themeDef = OS_THEMES[settings.osTheme];
  const accent = ACCENT_COLORS[settings.accentColor];
  const font = FONT_FAMILIES[settings.fontFamily];

  // Apply theme-level CSS vars
  Object.entries(themeDef.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Override glass blur with user preference
  root.style.setProperty('--theme-blur', `blur(${settings.glassBlur}px)`);

  // Apply border radius overrides if not default
  if (settings.borderRadius !== 'default') {
    const radiusMap: Record<BorderRadius, [string, string, string, string]> = {
      sharp:   ['4px',  '6px',  '8px',  '10px'],
      default: themeDef.vars['--theme-radius-sm'].split(' ').concat(['']) as any,
      rounded: ['14px', '20px', '28px', '36px'],
      pill:    ['20px', '32px', '48px', '64px'],
    };
    const [sm, md, lg, xl] = radiusMap[settings.borderRadius];
    if (sm) root.style.setProperty('--theme-radius-sm', sm);
    if (md) root.style.setProperty('--theme-radius-md', md);
    if (lg) root.style.setProperty('--theme-radius-lg', lg);
    if (xl) root.style.setProperty('--theme-radius-xl', xl);
  }

  // Apply accent color
  root.style.setProperty('--theme-accent', accent.value);
  root.style.setProperty('--theme-accent-glow', accent.glow);

  // Apply font
  root.style.setProperty('--theme-font', font.css);

  // Apply animation speed multiplier
  const speedMap: Record<AnimationSpeed, string> = {
    off: '0.001', slow: '2', normal: '1', fast: '0.5',
  };
  root.style.setProperty('--theme-anim-speed', speedMap[settings.animationSpeed]);

  // Apply icon size var
  const iconSizeMap: Record<IconSize, string> = { small: '14px', medium: '18px', large: '24px' };
  root.style.setProperty('--theme-icon-size', iconSizeMap[settings.iconSize]);

  // Apply os theme class to body for platform-specific overrides
  document.body.setAttribute('data-theme', settings.osTheme);
}

// ── Supabase Persistence ─────────────────────────────────────────────────────

async function loadPreferences(): Promise<Partial<ThemeSettings>> {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('preference_key, preference_value');

    if (!data) return {};

    const map: Partial<ThemeSettings> = {};
    for (const row of data) {
      const val = row.preference_value;
      switch (row.preference_key) {
        case 'os_theme':         map.osTheme = val as OSThemeId; break;
        case 'wallpaper_id':     map.wallpaperId = val as WallpaperId; break;
        case 'wallpaper_custom': map.wallpaperCustomUrl = val || ''; break;
        case 'accent_color':     map.accentColor = val as AccentColor; break;
        case 'font_family':      map.fontFamily = val as FontFamily; break;
        case 'dock_position':    map.dockPosition = val as DockPosition; break;
        case 'glass_blur':       map.glassBlur = Number(val) || 12; break;
        case 'border_radius':    map.borderRadius = val as BorderRadius; break;
        case 'animation_speed':  map.animationSpeed = val as AnimationSpeed; break;
        case 'icon_size':        map.iconSize = val as IconSize; break;
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function savePref(key: string, value: unknown): Promise<void> {
  try {
    await supabase
      .from('user_preferences')
      .upsert({ preference_key: key, preference_value: value }, { onConflict: 'preference_key' });
  } catch {
    // Non-fatal — preferences are a UX enhancement
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences().then(prefs => {
      const merged = { ...DEFAULT_THEME_SETTINGS, ...prefs };
      setTheme(merged);
      applyThemeVars(merged);
      setIsLoading(false);
    });
  }, []);

  // Debounced save to Supabase
  const debouncedSave = useCallback((key: string, value: unknown) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => savePref(key, value), 800);
  }, []);

  const updateTheme = useCallback((updates: Partial<ThemeSettings>) => {
    setTheme(prev => {
      const next = { ...prev, ...updates };
      applyThemeVars(next);
      return next;
    });
  }, []);

  const setOSTheme = useCallback((id: OSThemeId) => {
    updateTheme({ osTheme: id });
    debouncedSave('os_theme', id);
  }, [updateTheme, debouncedSave]);

  const setWallpaper = useCallback((id: WallpaperId, customUrl?: string) => {
    updateTheme({ wallpaperId: id, wallpaperCustomUrl: customUrl ?? '' });
    debouncedSave('wallpaper_id', id);
    if (customUrl !== undefined) debouncedSave('wallpaper_custom', customUrl);
  }, [updateTheme, debouncedSave]);

  const setAccentColor = useCallback((color: AccentColor) => {
    updateTheme({ accentColor: color });
    debouncedSave('accent_color', color);
  }, [updateTheme, debouncedSave]);

  const setFontFamily = useCallback((font: FontFamily) => {
    updateTheme({ fontFamily: font });
    debouncedSave('font_family', font);
  }, [updateTheme, debouncedSave]);

  const setDockPosition = useCallback((pos: DockPosition) => {
    updateTheme({ dockPosition: pos });
    debouncedSave('dock_position', pos);
  }, [updateTheme, debouncedSave]);

  const setGlassBlur = useCallback((blur: number) => {
    updateTheme({ glassBlur: blur });
    debouncedSave('glass_blur', blur);
  }, [updateTheme, debouncedSave]);

  const setBorderRadius = useCallback((r: BorderRadius) => {
    updateTheme({ borderRadius: r });
    debouncedSave('border_radius', r);
  }, [updateTheme, debouncedSave]);

  const setAnimationSpeed = useCallback((speed: AnimationSpeed) => {
    updateTheme({ animationSpeed: speed });
    debouncedSave('animation_speed', speed);
  }, [updateTheme, debouncedSave]);

  const setIconSize = useCallback((size: IconSize) => {
    updateTheme({ iconSize: size });
    debouncedSave('icon_size', size);
  }, [updateTheme, debouncedSave]);

  const applyThemePreset = useCallback((id: OSThemeId) => {
    const def = OS_THEMES[id];
    const next: Partial<ThemeSettings> = {
      osTheme: id,
      wallpaperId: def.wallpaper,
      accentColor: def.accent,
      fontFamily: def.font,
      borderRadius: def.radius,
      glassBlur: def.glassBlur,
    };
    updateTheme(next);
    debouncedSave('os_theme', id);
    debouncedSave('wallpaper_id', def.wallpaper);
    debouncedSave('accent_color', def.accent);
    debouncedSave('font_family', def.font);
    debouncedSave('border_radius', def.radius);
    debouncedSave('glass_blur', def.glassBlur);
  }, [updateTheme, debouncedSave]);

  const resetToDefaults = useCallback(() => {
    setTheme(DEFAULT_THEME_SETTINGS);
    applyThemeVars(DEFAULT_THEME_SETTINGS);
    Object.entries({
      os_theme: DEFAULT_THEME_SETTINGS.osTheme,
      wallpaper_id: DEFAULT_THEME_SETTINGS.wallpaperId,
      accent_color: DEFAULT_THEME_SETTINGS.accentColor,
      font_family: DEFAULT_THEME_SETTINGS.fontFamily,
      dock_position: DEFAULT_THEME_SETTINGS.dockPosition,
      glass_blur: DEFAULT_THEME_SETTINGS.glassBlur,
      border_radius: DEFAULT_THEME_SETTINGS.borderRadius,
      animation_speed: DEFAULT_THEME_SETTINGS.animationSpeed,
      icon_size: DEFAULT_THEME_SETTINGS.iconSize,
    }).forEach(([k, v]) => savePref(k, v));
  }, []);

  const getWallpaperStyle = useCallback((): React.CSSProperties => {
    if (theme.wallpaperId === 'custom' && theme.wallpaperCustomUrl) {
      return {
        backgroundImage: `url(${theme.wallpaperCustomUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    const wp = WALLPAPERS[theme.wallpaperId];
    if (!wp || !wp.gradient) return {};
    return { background: wp.gradient };
  }, [theme.wallpaperId, theme.wallpaperCustomUrl]);

  const currentThemeDef = OS_THEMES[theme.osTheme];
  const currentWallpaper = WALLPAPERS[theme.wallpaperId];
  const currentAccent = ACCENT_COLORS[theme.accentColor];

  return (
    <ThemeContext.Provider value={{
      theme,
      isLoading,
      currentThemeDef,
      currentWallpaper,
      currentAccent,
      setOSTheme,
      setWallpaper,
      setAccentColor,
      setFontFamily,
      setDockPosition,
      setGlassBlur,
      setBorderRadius,
      setAnimationSpeed,
      setIconSize,
      applyThemePreset,
      resetToDefaults,
      getWallpaperStyle,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
