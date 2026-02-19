import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { THEME_PRESETS, THEME_STYLE_PRESETS, DEFAULT_STYLE_PRESET_NAME, type ThemePreset } from './themePresets';
import { buildAntdTheme, LIGHT_TOKENS, type ThemeMode } from '../../contexts/ThemeContext';

const defaultStylePreset = THEME_STYLE_PRESETS[DEFAULT_STYLE_PRESET_NAME];

/**
 * Compute relative luminance of a hex color per WCAG 2.0.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const presetNameArb = fc.constantFrom(...Object.keys(THEME_PRESETS));
const modeArb = fc.constantFrom<ThemeMode>('dark', 'light');

/**
 * Feature: studio-v2-overhaul, Property 1: Light theme contrast ratios meet accessibility standards
 *
 * For any text/background token pair in the light theme configuration,
 * the computed WCAG contrast ratio SHALL be >= 4.5:1.
 *
 * **Validates: Requirements 2.1, 2.2, 2.8, 13.6**
 */
describe('Property 1: Light theme contrast ratios meet accessibility standards', () => {
  const textBgPairs: Array<{ text: string; bg: string; label: string }> = [
    { text: LIGHT_TOKENS.colorText, bg: LIGHT_TOKENS.colorBgContainer, label: 'colorText on colorBgContainer' },
    { text: LIGHT_TOKENS.colorTextSecondary, bg: LIGHT_TOKENS.colorBgContainer, label: 'colorTextSecondary on colorBgContainer' },
    { text: LIGHT_TOKENS.colorText, bg: LIGHT_TOKENS.colorBgLayout, label: 'colorText on colorBgLayout' },
    { text: LIGHT_TOKENS.colorText, bg: LIGHT_TOKENS.colorBgElevated, label: 'colorText on colorBgElevated' },
  ];

  it('all light theme text/background pairs have >= 4.5:1 contrast ratio for every preset', () => {
    fc.assert(
      fc.property(presetNameArb, (presetName) => {
        const preset = THEME_PRESETS[presetName];
        const themeConfig = buildAntdTheme('light', preset, defaultStylePreset);

        // The light tokens are always the same regardless of preset
        // Verify the theme config actually uses light tokens
        expect(themeConfig.token?.colorText).toBe(LIGHT_TOKENS.colorText);
        expect(themeConfig.token?.colorBgContainer).toBe(LIGHT_TOKENS.colorBgContainer);

        for (const pair of textBgPairs) {
          const ratio = contrastRatio(pair.text, pair.bg);
          expect(ratio, `${pair.label} contrast ratio ${ratio.toFixed(2)} < 4.5`).toBeGreaterThanOrEqual(4.5);
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 8: Theme config validity for all preset and mode combinations
 *
 * For any theme preset in THEME_PRESETS and for both dark and light modes,
 * the Theme_Engine SHALL produce a valid Ant Design ThemeConfig object that includes
 * the correct algorithm and contains token.colorPrimary matching the preset's colorPrimary.
 * The resulting config SHALL contain all required token fields.
 *
 * **Validates: Requirements 9.2, 9.5, 9.6**
 */
describe('Property 8: Theme config validity for all preset and mode combinations', () => {
  it('produces valid ThemeConfig with correct algorithm and all required tokens', () => {
    fc.assert(
      fc.property(presetNameArb, modeArb, (presetName, mode) => {
        const preset = THEME_PRESETS[presetName];
        const config = buildAntdTheme(mode, preset, defaultStylePreset);

        // Must have an algorithm
        expect(config.algorithm).toBeDefined();

        // colorPrimary must match the preset
        expect(config.token?.colorPrimary).toBe(preset.colorPrimary);

        // All required color tokens from the preset must be present
        expect(config.token?.colorSuccess).toBe(preset.colorSuccess);
        expect(config.token?.colorWarning).toBe(preset.colorWarning);
        expect(config.token?.colorError).toBe(preset.colorError);
        expect(config.token?.colorInfo).toBe(preset.colorInfo);

        // Must have font family
        expect(config.token?.fontFamily).toBeDefined();

        // Must have mode-specific tokens
        expect(config.token?.colorText).toBeDefined();
        expect(config.token?.colorBgContainer).toBeDefined();
        expect(config.token?.colorBgLayout).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
