import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { theme as antdTheme, type ThemeConfig } from 'antd';
import {
  THEME_PRESETS,
  DEFAULT_PRESET_NAME,
  THEME_STYLE_PRESETS,
  DEFAULT_STYLE_PRESET_NAME,
  type ThemePreset,
  type ThemeStylePreset,
} from '../utils/studio/themePresets';

export type ThemeMode = 'dark' | 'light';

export interface ThemeContextValue {
  mode: ThemeMode;
  presetName: string;
  preset: ThemePreset;
  stylePresetName: string;
  stylePreset: ThemeStylePreset;
  antdTheme: ThemeConfig;
  toggleMode: () => void;
  setPreset: (presetName: string) => void;
  setStylePreset: (name: string) => void;
}

const STORAGE_KEY_MODE = 'hivemind-theme-mode';
const STORAGE_KEY_PRESET = 'hivemind-theme-preset';
const STORAGE_KEY_STYLE = 'hivemind-theme-style';

const LIGHT_TOKENS = {
  colorText: '#1a1a1a',
  colorTextSecondary: '#595959',
  colorTextTertiary: '#8c8c8c',
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f0f2f5',
  colorBgElevated: '#ffffff',
  colorBorder: '#d9d9d9',
  colorBorderSecondary: '#e8e8e8',
  colorFill: '#f0f0f0',
  colorFillSecondary: '#fafafa',
};

const DARK_TOKENS = {
  colorText: '#e0e0e0',
  colorTextSecondary: '#a0a0a0',
  colorTextTertiary: '#6b6b6b',
  colorBgContainer: '#1a1a1a',
  colorBgLayout: '#0a0a0a',
  colorBgElevated: '#2a2a2a',
  colorBorder: '#2a2a2a',
  colorBorderSecondary: '#333333',
  colorFill: '#2a2a2a',
  colorFillSecondary: '#1f1f1f',
};

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* localStorage unavailable */ }
  return 'dark';
}

function readStoredPreset(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PRESET);
    if (stored && stored in THEME_PRESETS) return stored;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_PRESET_NAME;
}

function readStoredStylePreset(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STYLE);
    if (stored && stored in THEME_STYLE_PRESETS) return stored;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_STYLE_PRESET_NAME;
}

function persistMode(mode: ThemeMode): void {
  try { localStorage.setItem(STORAGE_KEY_MODE, mode); } catch { /* noop */ }
}

function persistPreset(name: string): void {
  try { localStorage.setItem(STORAGE_KEY_PRESET, name); } catch { /* noop */ }
}

function persistStylePreset(name: string): void {
  try { localStorage.setItem(STORAGE_KEY_STYLE, name); } catch { /* noop */ }
}

export function buildAntdTheme(
  mode: ThemeMode,
  preset: ThemePreset,
  stylePreset: ThemeStylePreset,
): ThemeConfig {
  const algorithm = mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
  const modeTokens = mode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;

  return {
    algorithm,
    token: {
      colorPrimary: preset.colorPrimary,
      colorSuccess: preset.colorSuccess,
      colorWarning: preset.colorWarning,
      colorError: preset.colorError,
      colorInfo: preset.colorInfo,
      borderRadius: stylePreset.borderRadius,
      borderRadiusLG: stylePreset.borderRadiusLG,
      borderRadiusSM: stylePreset.borderRadiusSM,
      fontFamily: stylePreset.fontFamily,
      fontSize: stylePreset.fontSize,
      fontWeightStrong: stylePreset.fontWeightStrong,
      controlHeight: stylePreset.controlHeight,
      wireframe: stylePreset.wireframe,
      ...modeTokens,
    },
    components: stylePreset.componentOverrides,
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [presetName, setPresetName] = useState<string>(readStoredPreset);
  const [stylePresetName, setStylePresetName] = useState<string>(readStoredStylePreset);

  const preset = THEME_PRESETS[presetName] ?? THEME_PRESETS[DEFAULT_PRESET_NAME];
  const stylePreset = THEME_STYLE_PRESETS[stylePresetName] ?? THEME_STYLE_PRESETS[DEFAULT_STYLE_PRESET_NAME];

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistMode(next);
      return next;
    });
  }, []);

  const handleSetPreset = useCallback((name: string) => {
    const validName = name in THEME_PRESETS ? name : DEFAULT_PRESET_NAME;
    setPresetName(validName);
    persistPreset(validName);
  }, []);

  const handleSetStylePreset = useCallback((name: string) => {
    const validName = name in THEME_STYLE_PRESETS ? name : DEFAULT_STYLE_PRESET_NAME;
    setStylePresetName(validName);
    persistStylePreset(validName);
  }, []);

  const themeConfig = useMemo(
    () => buildAntdTheme(mode, preset, stylePreset),
    [mode, preset, stylePreset],
  );

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    presetName,
    preset,
    stylePresetName,
    stylePreset,
    antdTheme: themeConfig,
    toggleMode,
    setPreset: handleSetPreset,
    setStylePreset: handleSetStylePreset,
  }), [mode, presetName, preset, stylePresetName, stylePreset, themeConfig, toggleMode, handleSetPreset, handleSetStylePreset]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export { LIGHT_TOKENS, DARK_TOKENS, STORAGE_KEY_MODE, STORAGE_KEY_PRESET, STORAGE_KEY_STYLE };
