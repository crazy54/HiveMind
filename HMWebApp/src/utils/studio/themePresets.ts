export interface ThemePreset {
  name: string;
  label: string;
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  'default-gold': {
    name: 'default-gold',
    label: 'Default Gold',
    colorPrimary: '#D4AF37',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#D4AF37',
  },
  'geek-blue': {
    name: 'geek-blue',
    label: 'Geek Blue',
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
  },
  'sunset-orange': {
    name: 'sunset-orange',
    label: 'Sunset Orange',
    colorPrimary: '#fa541c',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#fa541c',
  },
  'nature-green': {
    name: 'nature-green',
    label: 'Nature Green',
    colorPrimary: '#389e0d',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#389e0d',
  },
  'cyber-purple': {
    name: 'cyber-purple',
    label: 'Cyber Purple',
    colorPrimary: '#722ed1',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#722ed1',
  },
  'midnight-teal': {
    name: 'midnight-teal',
    label: 'Midnight Teal',
    colorPrimary: '#13c2c2',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#13c2c2',
  },
};

export const DEFAULT_PRESET_NAME = 'default-gold';

export interface ThemeStylePreset {
  name: string;
  label: string;
  description: string;
  // Shape
  borderRadius: number;
  borderRadiusLG: number;
  borderRadiusSM: number;
  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeightStrong: number;
  // Layout density
  controlHeight: number;
  // Wireframe mode (outline-only components)
  wireframe: boolean;
  // Optional per-component token overrides
  componentOverrides?: Record<string, Record<string, unknown>>;
}

export const THEME_STYLE_PRESETS: Record<string, ThemeStylePreset> = {
  default: {
    name: 'default',
    label: 'Default',
    description: 'Current HiveMind Studio look — balanced and clean.',
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontWeightStrong: 600,
    controlHeight: 32,
    wireframe: false,
  },
  geek: {
    name: 'geek',
    label: 'Geek',
    description: 'Dense, monospaced, wireframe — for the terminal-minded.',
    borderRadius: 2,
    borderRadiusLG: 4,
    borderRadiusSM: 1,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 13,
    fontWeightStrong: 700,
    controlHeight: 28,
    wireframe: true,
  },
  mui: {
    name: 'mui',
    label: 'MUI',
    description: 'Rounded, Material Design-inspired — familiar and polished.',
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontWeightStrong: 500,
    controlHeight: 36,
    wireframe: false,
  },
  cartoon: {
    name: 'cartoon',
    label: 'Cartoon',
    description: 'Playful, large radius, chunky — fun and expressive.',
    borderRadius: 20,
    borderRadiusLG: 28,
    borderRadiusSM: 12,
    fontFamily: "'Nunito', 'Comic Sans MS', cursive",
    fontSize: 15,
    fontWeightStrong: 800,
    controlHeight: 40,
    wireframe: false,
  },
};

export const DEFAULT_STYLE_PRESET_NAME = 'default';
