import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { ThemeProvider, useTheme, buildAntdTheme, STORAGE_KEY_MODE, STORAGE_KEY_PRESET, STORAGE_KEY_STYLE } from './ThemeContext';
import { THEME_PRESETS, THEME_STYLE_PRESETS, DEFAULT_STYLE_PRESET_NAME } from '../utils/studio/themePresets';
import type { ThemeMode } from './ThemeContext';
import type { ReactNode } from 'react';

const defaultStylePreset = THEME_STYLE_PRESETS[DEFAULT_STYLE_PRESET_NAME];

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

const presetNameArb = fc.constantFrom(...Object.keys(THEME_PRESETS));
const modeArb = fc.constantFrom<ThemeMode>('dark', 'light');

beforeEach(() => {
  localStorage.clear();
});

/**
 * Feature: studio-v2-overhaul, Property 5: Theme preset applies correct primary color
 *
 * For any valid theme preset name from the THEME_PRESETS map, applying that preset
 * via the Theme_Engine SHALL result in the Ant Design ConfigProvider receiving a theme
 * configuration where token.colorPrimary equals the preset's defined colorPrimary value.
 *
 * **Validates: Requirements 7.3**
 */
describe('Property 5: Theme preset applies correct primary color', () => {
  it('applying any preset produces antdTheme with matching colorPrimary', () => {
    fc.assert(
      fc.property(presetNameArb, (presetName) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.setPreset(presetName));

        const expectedColor = THEME_PRESETS[presetName].colorPrimary;
        expect(result.current.antdTheme.token?.colorPrimary).toBe(expectedColor);
      }),
      { numRuns: 100 },
    );
  });

  it('buildAntdTheme directly produces correct colorPrimary for any preset and mode', () => {
    fc.assert(
      fc.property(presetNameArb, modeArb, (presetName, mode) => {
        const preset = THEME_PRESETS[presetName];
        const config = buildAntdTheme(mode, preset, defaultStylePreset);
        expect(config.token?.colorPrimary).toBe(preset.colorPrimary);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 6: Theme persistence round-trip
 *
 * For any valid ThemeMode and any valid theme preset name, persisting both to
 * localStorage and then reading them back SHALL produce the same mode and preset
 * name values.
 *
 * **Validates: Requirements 7.4, 7.5, 9.3, 9.4**
 */
describe('Property 6: Theme persistence round-trip', () => {
  it('persisted mode and preset are read back correctly on re-init', () => {
    fc.assert(
      fc.property(presetNameArb, modeArb, (presetName, mode) => {
        localStorage.clear();

        // Directly write to localStorage (simulating persistence)
        localStorage.setItem(STORAGE_KEY_MODE, mode);
        localStorage.setItem(STORAGE_KEY_PRESET, presetName);

        // Verify raw round-trip: what was written can be read back
        expect(localStorage.getItem(STORAGE_KEY_MODE)).toBe(mode);
        expect(localStorage.getItem(STORAGE_KEY_PRESET)).toBe(presetName);

        // Mount context — it should read persisted values
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.mode).toBe(mode);
        expect(result.current.presetName).toBe(presetName);
      }),
      { numRuns: 100 },
    );
  });

  it('setPreset and toggleMode persist values that survive re-mount', () => {
    fc.assert(
      fc.property(presetNameArb, (presetName) => {
        localStorage.clear();

        const { result, unmount } = renderHook(() => useTheme(), { wrapper });

        // Apply preset — always persists
        act(() => result.current.setPreset(presetName));
        // Toggle to light — persists mode
        act(() => result.current.toggleMode());

        expect(localStorage.getItem(STORAGE_KEY_PRESET)).toBe(presetName);
        expect(localStorage.getItem(STORAGE_KEY_MODE)).toBe('light');

        unmount();

        // Re-mount and verify
        const { result: result2 } = renderHook(() => useTheme(), { wrapper });
        expect(result2.current.mode).toBe('light');
        expect(result2.current.presetName).toBe(presetName);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 7: Theme preset is independent of dark/light mode
 *
 * For any theme preset and either mode, changing the mode SHALL NOT change the
 * active preset name, and changing the preset SHALL NOT change the active mode.
 *
 * **Validates: Requirements 7.6**
 */
describe('Property 7: Theme preset is independent of dark/light mode', () => {
  it('toggling mode does not change preset', () => {
    fc.assert(
      fc.property(presetNameArb, (presetName) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.setPreset(presetName));
        const presetBefore = result.current.presetName;

        act(() => result.current.toggleMode());
        expect(result.current.presetName).toBe(presetBefore);

        act(() => result.current.toggleMode());
        expect(result.current.presetName).toBe(presetBefore);
      }),
      { numRuns: 100 },
    );
  });

  it('changing preset does not change mode', () => {
    fc.assert(
      fc.property(presetNameArb, modeArb, (presetName, startMode) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        // Set initial mode
        if (result.current.mode !== startMode) {
          act(() => result.current.toggleMode());
        }
        expect(result.current.mode).toBe(startMode);

        // Change preset — mode should remain unchanged
        act(() => result.current.setPreset(presetName));
        expect(result.current.mode).toBe(startMode);
      }),
      { numRuns: 100 },
    );
  });
});

const stylePresetNameArb = fc.constantFrom(...Object.keys(THEME_STYLE_PRESETS));

/**
 * Feature: webapp-overhaul, Property A: Style preset token application
 *
 * For any valid style preset name in THEME_STYLE_PRESETS, calling setStylePreset(name)
 * SHALL result in antdTheme.token.borderRadius equaling the preset's borderRadius value,
 * and antdTheme.token.fontFamily equaling the preset's fontFamily.
 *
 * **Validates: Requirements 15.4**
 */
describe('Property A: Style preset token application', () => {
  it('setStylePreset produces antdTheme tokens matching the preset definition', () => {
    fc.assert(
      fc.property(stylePresetNameArb, (stylePresetName) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.setStylePreset(stylePresetName));

        const expectedPreset = THEME_STYLE_PRESETS[stylePresetName];
        expect(result.current.antdTheme.token?.borderRadius).toBe(expectedPreset.borderRadius);
        expect(result.current.antdTheme.token?.fontFamily).toBe(expectedPreset.fontFamily);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: webapp-overhaul, Property B: Style preset persistence round-trip
 *
 * For any valid style preset name, writing it to localStorage under hivemind-theme-style
 * and then mounting ThemeProvider SHALL produce a context where stylePresetName equals
 * the written value.
 *
 * **Validates: Requirements 15.5, 15.6**
 */
describe('Property B: Style preset persistence round-trip', () => {
  it('persisted style preset name is restored on mount', () => {
    fc.assert(
      fc.property(stylePresetNameArb, (stylePresetName) => {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY_STYLE, stylePresetName);

        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.stylePresetName).toBe(stylePresetName);
      }),
      { numRuns: 100 },
    );
  });

  it('setStylePreset persists value that survives re-mount', () => {
    fc.assert(
      fc.property(stylePresetNameArb, (stylePresetName) => {
        localStorage.clear();
        const { result, unmount } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.setStylePreset(stylePresetName));
        expect(localStorage.getItem(STORAGE_KEY_STYLE)).toBe(stylePresetName);

        unmount();

        const { result: result2 } = renderHook(() => useTheme(), { wrapper });
        expect(result2.current.stylePresetName).toBe(stylePresetName);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: webapp-overhaul, Property C: Style preset independence from color preset and mode
 *
 * For any combination of style preset name, color preset name, and theme mode, changing
 * the style preset SHALL NOT change presetName or mode, and changing the color preset
 * SHALL NOT change stylePresetName.
 *
 * **Validates: Requirements 15.7**
 */
describe('Property C: Style preset independence from color preset and mode', () => {
  it('changing style preset does not affect presetName or mode', () => {
    fc.assert(
      fc.property(stylePresetNameArb, presetNameArb, modeArb, (stylePresetName, colorPresetName, startMode) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        // Set initial mode
        if (result.current.mode !== startMode) {
          act(() => result.current.toggleMode());
        }
        act(() => result.current.setPreset(colorPresetName));

        const modeBefore = result.current.mode;
        const colorPresetBefore = result.current.presetName;

        act(() => result.current.setStylePreset(stylePresetName));

        expect(result.current.mode).toBe(modeBefore);
        expect(result.current.presetName).toBe(colorPresetBefore);
      }),
      { numRuns: 100 },
    );
  });

  it('changing color preset does not affect stylePresetName', () => {
    fc.assert(
      fc.property(stylePresetNameArb, presetNameArb, (stylePresetName, colorPresetName) => {
        localStorage.clear();
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.setStylePreset(stylePresetName));
        const stylePresetBefore = result.current.stylePresetName;

        act(() => result.current.setPreset(colorPresetName));

        expect(result.current.stylePresetName).toBe(stylePresetBefore);
      }),
      { numRuns: 100 },
    );
  });
});
