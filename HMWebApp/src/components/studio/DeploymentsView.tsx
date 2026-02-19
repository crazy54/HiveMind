import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Button, Typography, Alert, Skeleton, Empty } from 'antd';
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { DeploymentRecord } from './DeploymentRecord';
import { fetchDeployments, sortDeploymentsByTimestamp } from '../../services/deploymentService';
import type { DeploymentRecord as DeploymentRecordType } from '../../utils/studio/studioTypes';

const { Text } = Typography;

interface DeploymentsViewProps {
  onStartNewDeployment: () => void;
}

export function DeploymentsView({ onStartNewDeployment }: DeploymentsViewProps): ReactNode {
  const [deployments, setDeployments] = useState<DeploymentRecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadDeployments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeployments();
      setDeployments(sortDeploymentsByTimestamp(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load deployments';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  const handleToggleExpand = useCallback((deploymentId: string) => {
    setExpandedId((prev) => (prev === deploymentId ? null : deploymentId));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} active paragraph={{ rows: 2 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong style={{ fontSize: 18 }}>Deployments</Text>
        <Button
          type="primary"
          icon={<RocketOutlined />}
          onClick={onStartNewDeployment}
        >
          Deploy New
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message="Failed to load deployments"
          description={error}
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadDeployments}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {!error && deployments.length === 0 ? (
        <Empty
          description={
            <span>
              No deployments yet.{' '}
              <Button type="link" onClick={onStartNewDeployment} style={{ padding: 0 }}>
                Start your first deployment
              </Button>
            </span>
          }
          style={{ padding: 48 }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deployments.map((dep) => (
            <DeploymentRecord
              key={dep.deploymentId}
              deployment={dep}
              expanded={expandedId === dep.deploymentId}
              onToggleExpand={() => handleToggleExpand(dep.deploymentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
