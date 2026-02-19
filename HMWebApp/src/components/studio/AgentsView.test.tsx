import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { AgentsView } from './AgentsView';
import { ThemeProvider } from '../../contexts/ThemeContext';

function renderAgentsView(onSelectAgent = vi.fn()) {
  return {
    onSelectAgent,
    ...render(
      <ThemeProvider>
        <ConfigProvider>
          <AgentsView onSelectAgent={onSelectAgent} />
        </ConfigProvider>
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('AgentsView', () => {
  it('shows skeleton loading state initially', () => {
    // Make fetch hang so we stay in loading state
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    const { container } = renderAgentsView();
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders default agents when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderAgentsView();
    await waitFor(() => {
      expect(screen.getByText('Recon')).toBeInTheDocument();
    });
    expect(screen.getByText('Conductor')).toBeInTheDocument();
    expect(screen.getByText('Janitor')).toBeInTheDocument();
  });

  it('shows warning alert when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderAgentsView();
    await waitFor(() => {
      expect(screen.getByText(/Could not reach agent API/)).toBeInTheDocument();
    });
  });

  it('renders agents from successful API response', async () => {
    const mockAgents = [
      { id: 'test-agent', name: 'TestBot', icon: '🤖', role: 'Tester', capabilities: ['testing'], status: 'available' as const },
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockAgents,
    } as Response);

    renderAgentsView();
    await waitFor(() => {
      expect(screen.getByText('TestBot')).toBeInTheDocument();
    });
    expect(screen.getByText('Tester')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });

  it('calls onSelectAgent when an agent card is clicked', async () => {
    const onSelectAgent = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    renderAgentsView(onSelectAgent);
    await waitFor(() => {
      expect(screen.getByText('Recon')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Recon'));
    expect(onSelectAgent).toHaveBeenCalledWith('recon');
  });

  it('retries fetch when retry button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    renderAgentsView();

    await waitFor(() => {
      expect(screen.getByText(/Could not reach agent API/)).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByText('Retry'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
