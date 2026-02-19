import { Modal, Divider, Button, Typography, Switch, Space, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemePresetSelector } from './ThemePresetSelector';
import { StylePresetSelector } from './StylePresetSelector';
import { BedrockAuthPanel } from './BedrockAuthPanel';

const { Title, Text } = Typography;

interface UserSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const TUTORIAL_STORAGE_KEY = 'hivemind-tutorial-completed';

function handleResetTutorial(): void {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch { /* noop */ }
}

function HelpLink({ href, title }: { href: string; title: string }): ReactNode {
  return (
    <Tooltip title={`Docs: ${title}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginLeft: 6, opacity: 0.5, fontSize: 13 }}
        aria-label={`Help: ${title}`}
      >
        <QuestionCircleOutlined />
      </a>
    </Tooltip>
  );
}

export function UserSettingsPanel({ visible, onClose }: UserSettingsPanelProps): ReactNode {
  const { mode, toggleMode, presetName, setPreset, stylePresetName, setStylePreset } = useTheme();

  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Done
        </Button>
      }
      width={480}
      centered
      data-testid="user-settings-panel"
      styles={{
        mask: {
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(0, 0, 0, 0.45)',
        },
      }}
    >
      {/* Appearance */}
      <Title level={5} style={{ marginTop: 8 }}>
        Appearance
        <HelpLink href="/docs/theme-customization" title="Theme Customization" />
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Text>Dark Mode</Text>
        <Switch
          checked={mode === 'dark'}
          onChange={toggleMode}
          data-testid="dark-mode-switch"
        />
        <HelpLink href="/docs/theme-customization#dark-mode" title="Dark Mode" />
      </Space>

      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ fontSize: 13 }}>
          Color Theme
          <HelpLink href="/docs/theme-customization#color-presets" title="Color Presets" />
        </Text>
      </div>
      <ThemePresetSelector currentPreset={presetName} onSelect={setPreset} />

      <div style={{ marginTop: 16, marginBottom: 4 }}>
        <Text strong style={{ fontSize: 13 }}>
          Style Preset
          <HelpLink href="/docs/theme-customization#style-presets" title="Style Presets" />
        </Text>
      </div>
      <StylePresetSelector currentStylePreset={stylePresetName} onSelect={setStylePreset} />

      <Divider />

      {/* API Configuration */}
      <Title level={5}>
        Bedrock Connection
        <HelpLink href="/docs/bedrock-auth" title="Bedrock Authentication" />
      </Title>
      <BedrockAuthPanel />

      <Divider />

      {/* Tutorial Reset */}
      <Title level={5}>
        Tutorial
        <HelpLink href="/docs/getting-started" title="Getting Started" />
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        Replay the introduction walkthrough on next visit.
      </Text>
      <Button
        onClick={handleResetTutorial}
        data-testid="reset-tutorial-button"
      >
        Reset Tutorial
      </Button>
    </Modal>
  );
}
