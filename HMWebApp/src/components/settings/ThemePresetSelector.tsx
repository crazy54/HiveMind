import { Select, Button, Space, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { THEME_PRESETS, type ThemePreset } from '../../utils/studio/themePresets';

const { Text } = Typography;

interface ThemePresetSelectorProps {
  currentPreset: string;
  onSelect: (presetName: string) => void;
}

function PreviewSwatches({ preset }: { preset: ThemePreset }): ReactNode {
  const colors = [
    { color: preset.colorPrimary, label: 'Primary' },
    { color: preset.colorSuccess, label: 'Success' },
    { color: preset.colorWarning, label: 'Warning' },
    { color: preset.colorError, label: 'Error' },
  ];

  return (
    <Space size={6}>
      {colors.map(({ color, label }) => (
        <div
          key={label}
          title={label}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: color,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </Space>
  );
}

export function ThemePresetSelector({ currentPreset, onSelect }: ThemePresetSelectorProps): ReactNode {
  const [selected, setSelected] = useState(currentPreset);
  const selectedPreset = THEME_PRESETS[selected] ?? THEME_PRESETS['default-gold'];

  const options = Object.values(THEME_PRESETS).map((preset) => ({
    value: preset.name,
    label: (
      <Space>
        <span>{preset.label}</span>
        <PreviewSwatches preset={preset} />
      </Space>
    ),
  }));

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>Theme Preset</Text>
      <Select
        value={selected}
        onChange={setSelected}
        options={options}
        style={{ width: '100%', marginBottom: 12 }}
        data-testid="theme-preset-select"
      />
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Preview</Text>
        <PreviewSwatches preset={selectedPreset} />
      </div>
      <Button
        type="primary"
        onClick={() => onSelect(selected)}
        disabled={selected === currentPreset}
        data-testid="apply-preset-button"
      >
        Apply
      </Button>
    </div>
  );
}
