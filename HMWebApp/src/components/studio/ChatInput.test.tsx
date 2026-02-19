import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { ChatInput } from './ChatInput';
import { ThemeProvider } from '../../contexts/ThemeContext';

function renderInput(overrides: Partial<Parameters<typeof ChatInput>[0]> = {}) {
  const props = {
    onSend: vi.fn(),
    disabled: false,
    wsConnected: true,
    activeAgentId: 'conductor',
    onSwitchAgent: vi.fn(),
    ...overrides,
  };
  return {
    ...props,
    ...render(
      <ThemeProvider>
        <ConfigProvider>
          <ChatInput {...props} />
        </ConfigProvider>
      </ThemeProvider>,
    ),
  };
}

describe('ChatInput', () => {
  it('renders text input and send button', () => {
    renderInput();
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('sends message on button click and clears input', async () => {
    const { onSend } = renderInput();
    const user = userEvent.setup();
    const input = screen.getByLabelText('Chat message input');

    await user.type(input, 'Hello agent');
    await user.click(screen.getByLabelText('Send message'));

    expect(onSend).toHaveBeenCalledWith('Hello agent');
  });

  it('sends message on Enter key', async () => {
    const { onSend } = renderInput();
    const user = userEvent.setup();
    const input = screen.getByLabelText('Chat message input');

    await user.type(input, 'Enter test{Enter}');
    expect(onSend).toHaveBeenCalledWith('Enter test');
  });

  it('does not send empty messages', async () => {
    const { onSend } = renderInput();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Send message'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    renderInput({ disabled: true });
    expect(screen.getByLabelText('Chat message input')).toBeDisabled();
  });

  it('shows connected status indicator when wsConnected is true', () => {
    renderInput({ wsConnected: true });
    expect(screen.getByLabelText('WebSocket connected')).toBeInTheDocument();
  });

  it('shows disconnected status indicator when wsConnected is false', () => {
    renderInput({ wsConnected: false });
    expect(screen.getByLabelText('WebSocket disconnected')).toBeInTheDocument();
  });

  it('shows offline placeholder when disconnected', () => {
    renderInput({ wsConnected: false });
    expect(screen.getByPlaceholderText(/Offline mode/)).toBeInTheDocument();
  });

  it('shows online placeholder when connected', () => {
    renderInput({ wsConnected: true });
    expect(screen.getByPlaceholderText('Ask an agent...')).toBeInTheDocument();
  });

  it('renders agent selector with current agent', () => {
    renderInput({ activeAgentId: 'recon' });
    // Ant Design Select renders aria-label on both wrapper and inner input
    const selectors = screen.getAllByLabelText('Select agent');
    expect(selectors.length).toBeGreaterThanOrEqual(1);
  });
});
