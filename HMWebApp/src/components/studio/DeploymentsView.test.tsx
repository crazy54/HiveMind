import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { DeploymentsView } from './DeploymentsView';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { DeploymentRecord } from '../../utils/studio/studioTypes';

const MOCK_DEPLOYMENTS: DeploymentRecord[] = [
  {
    deploymentId: 'dep-001',
    status: 'complete',
    timestamp: 1700000000000,
    stackName: 'my-stack-prod',
    region: 'us-east-1',
    events: [
      {
        timestamp: 1700000010000,
        resourceType: 'AWS::S3::Bucket',
        logicalResourceId: 'MyBucket',
        status: 'CREATE_COMPLETE',
      },
    ],
    outputs: { BucketArn: 'arn:aws:s3:::my-bucket' },
  },
  {
    deploymentId: 'dep-002',
    status: 'in-progress',
    timestamp: 1700001000000,
    stackName: 'my-stack-staging',
    region: 'us-west-2',
    events: [],
    outputs: {},
  },
];

function renderView(onStartNewDeployment = vi.fn()) {
  return {
    onStartNewDeployment,
    ...render(
      <ThemeProvider>
        <ConfigProvider>
          <DeploymentsView onStartNewDeployment={onStartNewDeployment} />
        </ConfigProvider>
      </ThemeProvider>,
    ),
  };
}

function mockFetchSuccess(data: DeploymentRecord[] = MOCK_DEPLOYMENTS) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('DeploymentsView', () => {
  it('shows skeleton loading state initially', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    const { container } = renderView();
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders deployment list sorted newest first', async () => {
    mockFetchSuccess();
    renderView();

    await waitFor(() => {
      expect(screen.getByText('my-stack-staging')).toBeInTheDocument();
    });
    expect(screen.getByText('my-stack-prod')).toBeInTheDocument();

    // dep-002 (newer) should appear before dep-001 (older)
    const staging = screen.getByText('my-stack-staging');
    const prod = screen.getByText('my-stack-prod');
    expect(staging.compareDocumentPosition(prod) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders status tags for each deployment', async () => {
    mockFetchSuccess();
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  // Req 6.6: Empty state message when no deployments
  it('shows empty state when no deployments exist', async () => {
    mockFetchSuccess([]);
    renderView();

    await waitFor(() => {
      expect(screen.getByText(/No deployments yet/)).toBeInTheDocument();
    });
    expect(screen.getByText('Start your first deployment')).toBeInTheDocument();
  });

  // Req 6.5: "Deploy New" button switches to ChatView
  it('calls onStartNewDeployment when Deploy New is clicked', async () => {
    const onStartNewDeployment = vi.fn();
    mockFetchSuccess();
    renderView(onStartNewDeployment);

    await waitFor(() => {
      expect(screen.getByText('Deploy New')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Deploy New'));
    expect(onStartNewDeployment).toHaveBeenCalledOnce();
  });

  it('calls onStartNewDeployment from empty state link', async () => {
    const onStartNewDeployment = vi.fn();
    mockFetchSuccess([]);
    renderView(onStartNewDeployment);

    await waitFor(() => {
      expect(screen.getByText('Start your first deployment')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Start your first deployment'));
    expect(onStartNewDeployment).toHaveBeenCalledOnce();
  });

  it('shows error alert with retry on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Failed to load deployments')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries fetch when retry button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByText('Retry'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // Req 6.3: Click deployment record expands inline detail panel
  it('expands detail panel when a deployment record is clicked', async () => {
    mockFetchSuccess();
    renderView();

    await waitFor(() => {
      expect(screen.getByText('my-stack-prod')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click the card for my-stack-prod to expand it
    await user.click(screen.getByText('my-stack-prod'));

    // The expanded detail should show events timeline content
    await waitFor(() => {
      expect(screen.getByText('MyBucket')).toBeInTheDocument();
    });
    expect(screen.getByText(/AWS::S3::Bucket/)).toBeInTheDocument();
  });

  it('collapses detail panel when the same record is clicked again', async () => {
    mockFetchSuccess();
    renderView();

    await waitFor(() => {
      expect(screen.getByText('my-stack-prod')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Expand
    await user.click(screen.getByText('my-stack-prod'));
    await waitFor(() => {
      expect(screen.getByText('MyBucket')).toBeInTheDocument();
    });

    // Collapse by clicking the card header area again
    await user.click(screen.getByText('my-stack-prod'));
    await waitFor(() => {
      expect(screen.queryByText('MyBucket')).not.toBeInTheDocument();
    });
  });
});
