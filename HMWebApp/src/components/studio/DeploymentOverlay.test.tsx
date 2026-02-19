import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { DeploymentOverlay } from './DeploymentOverlay';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { DeploymentEvent } from '../../utils/studio/studioTypes';

// Mock WebSocket
let mockWsInstance: MockWebSocket | null = null;

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  close = vi.fn(() => { this.readyState = MockWebSocket.CLOSED; });

  constructor(url: string) {
    this.url = url;
    mockWsInstance = this;
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: DeploymentEvent): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({} as CloseEvent);
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

const defaultProps = {
  deploymentId: 'deploy-123',
  onComplete: vi.fn(),
  onClose: vi.fn(),
};

function renderOverlay(props = defaultProps) {
  return render(
    <ThemeProvider>
      <ConfigProvider>
        <DeploymentOverlay {...props} />
      </ConfigProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.restoreAllMocks();
  mockWsInstance = null;
  defaultProps.onComplete = vi.fn();
  defaultProps.onClose = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DeploymentOverlay', () => {
  it('renders modal with deployment ID', () => {
    renderOverlay();
    expect(screen.getByText(/deploy-123/)).toBeInTheDocument();
  });

  it('shows connecting state initially', () => {
    renderOverlay();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows Live tag when WebSocket connects', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('displays resource nodes from live events', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });

    const event: DeploymentEvent = {
      timestamp: Date.now(),
      resourceType: 'AWS::EC2::VPC',
      logicalResourceId: 'MyVPC',
      status: 'CREATE_IN_PROGRESS',
    };

    await act(async () => {
      mockWsInstance?.simulateMessage(event);
    });

    expect(screen.getByTestId('resource-node-MyVPC')).toBeInTheDocument();
    expect(screen.getAllByText('MyVPC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('AWS::EC2::VPC').length).toBeGreaterThanOrEqual(1);
  });

  it('updates resource node status from IN_PROGRESS to COMPLETE', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });

    await act(async () => {
      mockWsInstance?.simulateMessage({
        timestamp: Date.now(),
        resourceType: 'AWS::EC2::VPC',
        logicalResourceId: 'MyVPC',
        status: 'CREATE_IN_PROGRESS',
      });
    });

    // Should have pulsing animation (IN_PROGRESS)
    const node = screen.getByTestId('resource-node-MyVPC');
    expect(node.style.animation).toContain('deployPulse');

    await act(async () => {
      mockWsInstance?.simulateMessage({
        timestamp: Date.now(),
        resourceType: 'AWS::EC2::VPC',
        logicalResourceId: 'MyVPC',
        status: 'CREATE_COMPLETE',
      });
    });

    // Should no longer pulse
    const updatedNode = screen.getByTestId('resource-node-MyVPC');
    expect(updatedNode.style.animation).toBe('none');
  });

  it('shows last 10 events in log tail', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });

    // Send 12 events with unique resource names that won't substring-match
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima'];
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        mockWsInstance?.simulateMessage({
          timestamp: Date.now() + i * 1000,
          resourceType: 'AWS::EC2::VPC',
          logicalResourceId: names[i],
          status: 'CREATE_IN_PROGRESS',
        });
      });
    }

    // The log tail (role="log") should only contain the last 10 events
    const logArea = screen.getByRole('log');
    // Alpha and Bravo should NOT be in the log tail (first 2 of 12)
    expect(logArea.textContent).not.toContain('Alpha');
    expect(logArea.textContent).not.toContain('Bravo');
    // Charlie through Lima should be in the log tail (last 10)
    expect(logArea.textContent).toContain('Charlie');
    expect(logArea.textContent).toContain('Lima');
  });

  it('falls back to simulated animation when WebSocket fails', async () => {
    renderOverlay();

    // Simulate connection timeout by advancing past WS_CONNECT_TIMEOUT_MS
    await act(async () => {
      vi.advanceTimersByTime(5500);
    });

    expect(screen.getByText('Simulated')).toBeInTheDocument();

    // Simulated events should start appearing
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByTestId('resource-node-VPC')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    renderOverlay();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const closeBtn = screen.getByText('Close');
    await user.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows event log area with role="log"', () => {
    renderOverlay();
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('displays statusReason in log tail when present', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });

    await act(async () => {
      mockWsInstance?.simulateMessage({
        timestamp: Date.now(),
        resourceType: 'AWS::Lambda::Function',
        logicalResourceId: 'MyFunc',
        status: 'CREATE_FAILED',
        statusReason: 'Resource creation timed out',
      });
    });

    expect(screen.getByText('Resource creation timed out')).toBeInTheDocument();
  });

  it('auto-completes when terminal stack status is received', async () => {
    renderOverlay();
    await act(async () => {
      mockWsInstance?.simulateOpen();
    });

    await act(async () => {
      mockWsInstance?.simulateMessage({
        timestamp: Date.now(),
        resourceType: 'AWS::CloudFormation::Stack',
        logicalResourceId: 'Stack',
        status: 'CREATE_COMPLETE',
      });
    });

    // Should show Done button
    expect(screen.getByText('Done')).toBeInTheDocument();

    // After 1.5s delay, onComplete should be called
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(defaultProps.onComplete).toHaveBeenCalled();
  });
});
