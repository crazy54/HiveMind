import { useState, useCallback, type ReactNode } from 'react';
import { Input, Button, Select, Space, Tooltip } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { TextArea } = Input;

const AGENTS = [
  { value: 'conductor', label: '🎼 Conductor' },
  { value: 'recon', label: '🔍 Recon' },
  { value: 'provisioner', label: '🏗️ Provisioner' },
  { value: 'deployer', label: '🚀 Deployer' },
  { value: 'sheriff', label: '🔒 Sheriff' },
  { value: 'qa', label: '🧪 QA' },
  { value: 'ops', label: '📊 Ops' },
  { value: 'medic', label: '🩺 Medic' },
  { value: 'janitor', label: '🧹 Janitor' },
  { value: 'compiler', label: '⚙️ Compiler' },
];

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  wsConnected: boolean;
  activeAgentId: string;
  onSwitchAgent: (agentId: string) => void;
}

export function ChatInput({ onSend, disabled, wsConnected, activeAgentId, onSwitchAgent }: ChatInputProps): ReactNode {
  const [value, setValue] = useState('');
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        padding: '12px 16px',
        borderTop: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        background: isDark ? '#141414' : '#fafafa',
      }}
    >
      <Select
        value={activeAgentId}
        onChange={onSwitchAgent}
        options={AGENTS}
        style={{ width: 160 }}
        size="small"
        aria-label="Select agent"
      />
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={wsConnected ? 'Ask an agent...' : 'Offline mode — responses are simulated'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={disabled}
        style={{ flex: 1 }}
        aria-label="Chat message input"
      />

      <Space direction="vertical" align="center" size={4}>
        <Tooltip title={disabled ? 'Waiting for response...' : 'Send message'}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          />
        </Tooltip>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: wsConnected ? '#52c41a' : '#ff4d4f',
          }}
          title={wsConnected ? 'Connected' : 'Disconnected'}
          role="status"
          aria-label={wsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
        />
      </Space>
    </div>
  );
}
