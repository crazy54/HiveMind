import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { LogsView } from './LogsView';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { LogGroup } from '../../utils/studio/studioTypes';

// Mock WebSocket
class MockWebSocket {
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {}
}

vi.stubGlobal('WebSocket', MockWebSocket);

function renderLogsView() {
  return render(
    <ThemeProvider>
      <ConfigProvider>
        <LogsView />
      </ConfigProvider>
    </ThemeProvider>,
  );
}

const mockGroups: LogGroup[] = [
  { name: '/aws/lambda/fn-1', arn: 'arn:1', storedBytes: 1024, creationTime: 1700000000000 },
  { name: '/aws/lambda/fn-2', arn: 'arn:2', storedBytes: 2048, creationTime: 1700000000000 },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('LogsView', () => {
  it('shows credentials error when API returns 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('AWS credentials not configured')).toBeInTheDocument();
    });
  });

  it('shows error alert when API fails with non-auth error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders log group selector after successful fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: mockGroups }),
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('CloudWatch Logs')).toBeInTheDocument();
    });
    // The select should be present
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders time range picker and keyword filter', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: mockGroups }),
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Filter by keyword')).toBeInTheDocument();
    });
  });

  it('shows empty state when no log group is selected', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: mockGroups }),
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('No log events to display')).toBeInTheDocument();
    });
  });

  it('shows refresh groups button', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: [] }),
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('Refresh Groups')).toBeInTheDocument();
    });
  });

  it('retries loading groups when refresh button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: [] }),
    } as Response);

    renderLogsView();
    await waitFor(() => {
      expect(screen.getByText('Refresh Groups')).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByText('Refresh Groups'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
