import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme, STORAGE_KEY_STYLE } from './ThemeContext';
import { THEME_PRESETS, DEFAULT_PRESET_NAME } from '../utils/studio/themePresets';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('ThemeContext', () => {
  it('provides default dark mode and default-gold preset', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
    expect(result.current.presetName).toBe('default-gold');
    expect(result.current.preset).toEqual(THEME_PRESETS[DEFAULT_PRESET_NAME]);
  });

  it('toggles between dark and light mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('light');
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('dark');
  });

  it('persists mode to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleMode());
    expect(localStorage.getItem('hivemind-theme-mode')).toBe('light');
  });

  it('changes preset and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setPreset('cyber-purple'));
    expect(result.current.presetName).toBe('cyber-purple');
    expect(result.current.preset.colorPrimary).toBe('#722ed1');
    expect(localStorage.getItem('hivemind-theme-preset')).toBe('cyber-purple');
  });

  it('falls back to default for invalid preset name', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setPreset('nonexistent'));
    expect(result.current.presetName).toBe(DEFAULT_PRESET_NAME);
  });

  it('reads persisted values from localStorage on init', () => {
    localStorage.setItem('hivemind-theme-mode', 'light');
    localStorage.setItem('hivemind-theme-preset', 'geek-blue');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('light');
    expect(result.current.presetName).toBe('geek-blue');
  });

  it('produces antd theme config with correct primary color for dark mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.antdTheme.algorithm).toBeDefined();
    expect(result.current.antdTheme.token?.colorPrimary).toBe('#D4AF37');
  });

  it('produces antd theme config with correct tokens for light mode', () => {
    localStorage.setItem('hivemind-theme-mode', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.antdTheme.token?.colorBgContainer).toBe('#ffffff');
    expect(result.current.antdTheme.token?.colorText).toBe('#1a1a1a');
  });

  it('mode and preset are independently mutable', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setPreset('sunset-orange'));
    expect(result.current.presetName).toBe('sunset-orange');
    expect(result.current.mode).toBe('dark');
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('light');
    expect(result.current.presetName).toBe('sunset-orange');
  });
});

describe('ThemeContext — style preset', () => {
  it('defaults to "default" style preset when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.stylePresetName).toBe('default');
  });

  it('invalid localStorage value for hivemind-theme-style falls back to "default"', () => {
    localStorage.setItem(STORAGE_KEY_STYLE, 'not-a-real-preset');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.stylePresetName).toBe('default');
  });

  it('setStylePreset updates stylePresetName and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setStylePreset('geek'));
    expect(result.current.stylePresetName).toBe('geek');
    expect(localStorage.getItem(STORAGE_KEY_STYLE)).toBe('geek');
  });

  it('setStylePreset with invalid name falls back to "default"', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setStylePreset('nonexistent'));
    expect(result.current.stylePresetName).toBe('default');
  });

  it('style preset and color preset are independently mutable', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setStylePreset('cartoon'));
    act(() => result.current.setPreset('cyber-purple'));
    expect(result.current.stylePresetName).toBe('cartoon');
    expect(result.current.presetName).toBe('cyber-purple');
  });
});
