import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  THEME_PRESETS,
  DEFAULT_PRESET_NAME,
  THEME_STYLE_PRESETS,
  DEFAULT_STYLE_PRESET_NAME,
  type ThemePreset,
  type ThemeStylePreset,
} from './themePresets';

describe('themePresets', () => {
  it('defines exactly 6 presets', () => {
    expect(Object.keys(THEME_PRESETS)).toHaveLength(6);
  });

  it('default preset name exists in presets map', () => {
    expect(THEME_PRESETS[DEFAULT_PRESET_NAME]).toBeDefined();
  });

  it('each preset has all required color fields', () => {
    const requiredFields: (keyof ThemePreset)[] = [
      'name', 'label', 'colorPrimary', 'colorSuccess', 'colorWarning', 'colorError', 'colorInfo',
    ];
    for (const [key, preset] of Object.entries(THEME_PRESETS)) {
      for (const field of requiredFields) {
        expect(preset[field], `${key}.${field}`).toBeDefined();
        expect(typeof preset[field]).toBe('string');
      }
    }
  });

  it('each preset name matches its key', () => {
    for (const [key, preset] of Object.entries(THEME_PRESETS)) {
      expect(preset.name).toBe(key);
    }
  });

  it('all colorPrimary values are valid hex colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const preset of Object.values(THEME_PRESETS)) {
      expect(preset.colorPrimary).toMatch(hexRegex);
    }
  });
});

// Feature: webapp-overhaul, Property D
describe('ThemeStylePreset — property tests', () => {
  /**
   * Property D: All defined style presets satisfy the ThemeStylePreset interface
   * Validates: Requirements 15.1
   */
  it('Property D: all entries in THEME_STYLE_PRESETS have required fields with correct types', () => {
    const requiredNumberFields: (keyof ThemeStylePreset)[] = [
      'borderRadius',
      'borderRadiusLG',
      'borderRadiusSM',
      'fontSize',
      'fontWeightStrong',
      'controlHeight',
    ];
    const requiredStringFields: (keyof ThemeStylePreset)[] = [
      'name',
      'label',
      'description',
      'fontFamily',
    ];

    const presetEntries = Object.entries(THEME_STYLE_PRESETS);

    // Use fast-check to sample indices into the preset entries array, ensuring
    // the property holds for all entries across many runs.
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: presetEntries.length - 1 }),
        (index) => {
          const [key, preset] = presetEntries[index];

          // name must match its map key
          expect(preset.name).toBe(key);

          // required string fields
          for (const field of requiredStringFields) {
            expect(typeof preset[field], `${key}.${field} should be string`).toBe('string');
            expect((preset[field] as string).length, `${key}.${field} should be non-empty`).toBeGreaterThan(0);
          }

          // required number fields
          for (const field of requiredNumberFields) {
            expect(typeof preset[field], `${key}.${field} should be number`).toBe('number');
            expect(isFinite(preset[field] as number), `${key}.${field} should be finite`).toBe(true);
          }

          // wireframe must be boolean
          expect(typeof preset.wireframe, `${key}.wireframe should be boolean`).toBe('boolean');

          // componentOverrides, if present, must be an object
          if (preset.componentOverrides !== undefined) {
            expect(typeof preset.componentOverrides).toBe('object');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: webapp-overhaul — Unit tests
describe('THEME_STYLE_PRESETS — unit tests', () => {
  /**
   * Validates: Requirements 15.2
   */
  it('contains exactly the keys: default, geek, mui, cartoon', () => {
    const keys = Object.keys(THEME_STYLE_PRESETS).sort();
    expect(keys).toEqual(['cartoon', 'default', 'geek', 'mui']);
  });

  it('DEFAULT_STYLE_PRESET_NAME exists in THEME_STYLE_PRESETS', () => {
    expect(THEME_STYLE_PRESETS[DEFAULT_STYLE_PRESET_NAME]).toBeDefined();
  });
});
