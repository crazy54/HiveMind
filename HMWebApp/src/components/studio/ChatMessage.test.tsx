import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { ChatMessage } from './ChatMessage';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { ChatMessage as ChatMessageType } from '../../utils/studio/studioTypes';

function renderMsg(message: ChatMessageType, isStreaming = false) {
  return render(
    <ThemeProvider>
      <ConfigProvider>
        <ChatMessage message={message} isStreaming={isStreaming} />
      </ConfigProvider>
    </ThemeProvider>,
  );
}

function makeMsg(overrides: Partial<ChatMessageType> = {}): ChatMessageType {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Hello world',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('ChatMessage', () => {
  it('renders user message content', () => {
    renderMsg(makeMsg({ content: 'Test user message' }));
    expect(screen.getByText('Test user message')).toBeInTheDocument();
  });

  it('renders assistant message with agent name', () => {
    renderMsg(makeMsg({ role: 'assistant', agentName: 'Conductor', content: 'I can help' }));
    expect(screen.getByText('Conductor')).toBeInTheDocument();
    expect(screen.getByText('I can help')).toBeInTheDocument();
  });

  it('does not show agent name for user messages', () => {
    renderMsg(makeMsg({ role: 'user', agentName: 'Conductor', content: 'Hi' }));
    expect(screen.queryByText('Conductor')).not.toBeInTheDocument();
  });

  it('renders error message with warning icon', () => {
    const { container } = renderMsg(makeMsg({ role: 'system', isError: true, content: 'API key invalid' }));
    expect(screen.getByText('API key invalid')).toBeInTheDocument();
    // Error messages get a red border (rendered as rgb in jsdom)
    const article = container.querySelector('[role="article"]') as HTMLElement;
    expect(article.style.border).toContain('rgb(255, 77, 79)');
  });

  it('shows streaming cursor when isStreaming is true', () => {
    const { container } = renderMsg(makeMsg({ role: 'assistant', content: 'Partial...' }), true);
    // The streaming cursor is a span with cursorBlink animation
    const cursor = container.querySelector('span[style*="cursorBlink"]');
    expect(cursor).toBeInTheDocument();
  });

  it('does not show streaming cursor when isStreaming is false', () => {
    const { container } = renderMsg(makeMsg({ role: 'assistant', content: 'Complete.' }), false);
    const cursor = container.querySelector('span[style*="cursorBlink"]');
    expect(cursor).not.toBeInTheDocument();
  });

  it('has correct aria-label for message role', () => {
    renderMsg(makeMsg({ role: 'assistant' }));
    expect(screen.getByRole('article', { name: 'assistant message' })).toBeInTheDocument();
  });

  it('has correct aria-label for user role', () => {
    renderMsg(makeMsg({ role: 'user' }));
    expect(screen.getByRole('article', { name: 'user message' })).toBeInTheDocument();
  });
});
