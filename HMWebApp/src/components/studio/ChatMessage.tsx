import type { ReactNode } from 'react';
import { Typography } from 'antd';
import { RobotOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChatMessage as ChatMessageType } from '../../utils/studio/studioTypes';

const { Text } = Typography;

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isSystem = message.role === 'system';

  const bgColor = isError
    ? (isDark ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.06)')
    : isUser
      ? (isDark ? 'rgba(212, 175, 55, 0.08)' : 'rgba(22, 119, 255, 0.04)')
      : isSystem
        ? 'transparent'
        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)');

  const borderColor = isError
    ? '#ff4d4f'
    : (isDark ? '#2a2a2a' : '#e8e8e8');

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 8,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        marginBottom: 8,
        animation: 'msgSlideIn 200ms ease-out',
      }}
      role="article"
      aria-label={`${message.role} message`}
    >
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {isError ? (
          <WarningOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
        ) : isUser ? (
          <UserOutlined style={{ fontSize: 18, color: isDark ? '#D4AF37' : '#1677ff' }} />
        ) : (
          <RobotOutlined style={{ fontSize: 18, color: isDark ? '#52c41a' : '#389e0d' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {message.agentName && !isUser && (
          <Text
            strong
            style={{
              fontSize: 12,
              color: isDark ? '#a0a0a0' : '#595959',
              display: 'block',
              marginBottom: 4,
            }}
          >
            {message.agentName}
          </Text>
        )}
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: isDark ? '#e0e0e0' : '#1a1a1a',
            lineHeight: 1.6,
          }}
        >
          {message.content}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 16,
                background: isDark ? '#D4AF37' : '#1677ff',
                marginLeft: 2,
                animation: 'cursorBlink 0.7s step-end infinite',
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
