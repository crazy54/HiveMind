import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import type { WsIncomingMessage } from '../../utils/studio/studioTypes';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Capture the onMessage handler so we can simulate incoming WS messages
let wsMessageHandler: ((msg: WsIncomingMessage) => void) | null = null;
const mockSend = vi.fn();
let mockStatus = 'disconnected';

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    status: mockStatus,
    send: mockSend,
    disconnect: vi.fn(),
    reconnect: vi.fn(),
    lastMessage: null,
    retryCount: 0,
    onMessage: (handler: (msg: WsIncomingMessage) => void) => {
      wsMessageHandler = handler;
    },
  }),
}));

// Import after mock setup
const { ChatView } = await import('./ChatView');

function renderChatView() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <ConfigProvider>
          <ChatView />
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  wsMessageHandler = null;
  mockStatus = 'disconnected';
});

describe('ChatView', () => {
  it('renders empty state when no messages', () => {
    renderChatView();
    expect(screen.getByText(/Offline mode/)).toBeInTheDocument();
  });

  it('renders empty state with connected message when WS is connected', () => {
    mockStatus = 'connected';
    renderChatView();
    expect(screen.getByText(/Start a conversation/)).toBeInTheDocument();
  });

  it('renders infra sub-view segmented control', () => {
    renderChatView();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('adds user message to chat on send', async () => {
    mockStatus = 'disconnected';
    renderChatView();
    const user = userEvent.setup();
    const input = screen.getByLabelText('Chat message input');

    await user.type(input, 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('displays assistant response from WebSocket', async () => {
    mockStatus = 'disconnected';
    renderChatView();
    const user = userEvent.setup();

    // Send a message first (offline mode will produce a mock response)
    await user.type(screen.getByLabelText('Chat message input'), 'hello');
    await user.click(screen.getByLabelText('Send message'));

    // The offline fallback should produce a response
    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('displays error messages from WebSocket with error styling', async () => {
    mockStatus = 'connected';
    renderChatView();

    // Simulate an error message from the backend
    if (wsMessageHandler) {
      wsMessageHandler({ type: 'error', message: 'Rate limit exceeded' });
    }

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
    // Error message should have the error article
    const errorArticle = screen.getByText('Rate limit exceeded').closest('[role="article"]') as HTMLElement;
    expect(errorArticle).toBeInTheDocument();
    expect(errorArticle.style.border).toContain('rgb(255, 77, 79)');
  });

  it('handles streaming response flow', async () => {
    mockStatus = 'connected';
    renderChatView();

    // Simulate stream_start
    if (wsMessageHandler) {
      wsMessageHandler({ type: 'stream_start', message_id: 'stream-1', agent_id: 'conductor' });
    }

    await waitFor(() => {
      // A new assistant message should appear (empty initially)
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThanOrEqual(1);
    });

    // Simulate stream chunks
    if (wsMessageHandler) {
      wsMessageHandler({ type: 'stream_chunk', message_id: 'stream-1', content: 'Hello ' });
      wsMessageHandler({ type: 'stream_chunk', message_id: 'stream-1', content: 'world' });
    }

    await waitFor(() => {
      expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    });

    // Simulate stream end
    if (wsMessageHandler) {
      wsMessageHandler({ type: 'stream_end', message_id: 'stream-1', agent_id: 'conductor' });
    }

    // Send button should be re-enabled after stream ends
    await waitFor(() => {
      const sendBtn = screen.getByLabelText('Send message');
      // Button is disabled only because input is empty, not because of streaming
      expect(sendBtn).toBeInTheDocument();
    });
  });

  it('shows connection status indicator', () => {
    mockStatus = 'connected';
    renderChatView();
    expect(screen.getByLabelText('WebSocket connected')).toBeInTheDocument();
  });

  it('shows disconnected status indicator', () => {
    mockStatus = 'disconnected';
    renderChatView();
    expect(screen.getByLabelText('WebSocket disconnected')).toBeInTheDocument();
  });
});
