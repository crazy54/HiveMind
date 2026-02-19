import { Select, Button, Space, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import { THEME_STYLE_PRESETS, type ThemeStylePreset } from '../../utils/studio/themePresets';

const { Text } = Typography;

interface StylePresetSelectorProps {
  currentStylePreset: string;
  onSelect: (name: string) => void;
}

function StylePreviewPill({ preset }: { preset: ThemeStylePreset }): ReactNode {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: preset.borderRadius,
        fontFamily: preset.fontFamily,
        border: '1px solid currentColor',
        fontSize: 11,
      }}
      data-testid={`style-preview-pill-${preset.name}`}
    >
      Aa
    </span>
  );
}

export function StylePresetSelector({ currentStylePreset, onSelect }: StylePresetSelectorProps): ReactNode {
  const [selected, setSelected] = useState(currentStylePreset);

  const options = Object.values(THEME_STYLE_PRESETS).map((preset) => ({
    value: preset.name,
    label: (
      <Space>
        <span>{preset.label}</span>
        <StylePreviewPill preset={preset} />
      </Space>
    ),
  }));

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>Style Preset</Text>
      <Select
        value={selected}
        onChange={setSelected}
        options={options}
        style={{ width: '100%', marginBottom: 12 }}
        data-testid="style-preset-select"
      />
      <Button
        type="primary"
        onClick={() => onSelect(selected)}
        disabled={selected === currentStylePreset}
        data-testid="apply-style-preset-button"
      >
        Apply
      </Button>
    </div>
  );
}
