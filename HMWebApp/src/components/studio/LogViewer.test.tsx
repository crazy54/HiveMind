import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { LogViewer } from './LogViewer';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { LogEvent } from '../../utils/studio/studioTypes';

vi.stubGlobal('WebSocket', class { close = vi.fn(); });

function renderLogViewer(events: LogEvent[], isStreaming = false) {
  return render(
    <ThemeProvider>
      <ConfigProvider>
        <LogViewer events={events} isStreaming={isStreaming} />
      </ConfigProvider>
    </ThemeProvider>,
  );
}

const sampleEvents: LogEvent[] = [
  { timestamp: 1705312200000, message: 'Starting Lambda function', logStreamName: 'stream-abc', ingestionTime: 1705312201000 },
  { timestamp: 1705312260000, message: 'Processing request', logStreamName: 'stream-abc', ingestionTime: 1705312261000 },
  { timestamp: 1705312320000, message: 'Request completed', logStreamName: 'stream-def', ingestionTime: 1705312321000 },
];

describe('LogViewer', () => {
  it('shows empty state when no events', () => {
    renderLogViewer([]);
    expect(screen.getByText('No log events to display')).toBeInTheDocument();
  });

  it('renders log events with messages', () => {
    renderLogViewer(sampleEvents);
    expect(screen.getByText('Starting Lambda function')).toBeInTheDocument();
    expect(screen.getByText('Processing request')).toBeInTheDocument();
    expect(screen.getByText('Request completed')).toBeInTheDocument();
  });

  it('renders log stream names', () => {
    renderLogViewer(sampleEvents);
    const abcStreams = screen.getAllByText('[stream-abc]');
    expect(abcStreams.length).toBe(2);
    expect(screen.getByText('[stream-def]')).toBeInTheDocument();
  });

  it('shows streaming indicator when isStreaming is true', () => {
    renderLogViewer(sampleEvents, true);
    expect(screen.getByText('● Streaming live events...')).toBeInTheDocument();
  });

  it('does not show streaming indicator when isStreaming is false', () => {
    renderLogViewer(sampleEvents, false);
    expect(screen.queryByText('● Streaming live events...')).not.toBeInTheDocument();
  });

  it('has role="log" for accessibility', () => {
    renderLogViewer(sampleEvents);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('has aria-label on the log container', () => {
    renderLogViewer(sampleEvents);
    expect(screen.getByLabelText('Log events')).toBeInTheDocument();
  });
});
