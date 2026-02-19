import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { Typography, Empty } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import { formatLogTimestamp } from '../../services/logService';
import type { LogEvent } from '../../utils/studio/studioTypes';

const { Text } = Typography;

interface LogViewerProps {
  events: LogEvent[];
  isStreaming: boolean;
}

export function LogViewer({ events, isStreaming }: LogViewerProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  // Auto-scroll when new events arrive and user is at bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  if (events.length === 0) {
    return (
      <Empty
        description="No log events to display"
        style={{ padding: 48 }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Log events"
      style={{
        flex: 1,
        overflow: 'auto',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 12,
        lineHeight: 1.6,
        padding: 12,
        borderRadius: 6,
        background: isDark ? '#0d0d0d' : '#f5f5f5',
        border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        minHeight: 200,
        maxHeight: 'calc(100vh - 360px)',
      }}
    >
      {events.map((event, idx) => (
        <div
          key={`${event.timestamp}-${event.logStreamName}-${idx}`}
          style={{
            padding: '2px 0',
            borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}`,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          <Text
            style={{
              color: isDark ? '#8c8c8c' : '#595959',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {formatLogTimestamp(event.timestamp)}
          </Text>
          {' '}
          <Text
            style={{
              color: isDark ? '#d4af37' : '#ad6800',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            [{event.logStreamName}]
          </Text>
          {' '}
          <Text
            style={{
              color: isDark ? '#e0e0e0' : '#1a1a1a',
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {event.message}
          </Text>
        </div>
      ))}
      {isStreaming && (
        <div style={{ padding: '4px 0', opacity: 0.6 }}>
          <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
            ● Streaming live events...
          </Text>
        </div>
      )}
    </div>
  );
}
