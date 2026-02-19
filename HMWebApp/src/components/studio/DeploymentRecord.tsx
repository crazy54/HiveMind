import type { ReactNode } from 'react';
import { Card, Tag, Typography, Collapse, Timeline, Descriptions, Progress } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  RollbackOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { DeploymentRecord as DeploymentRecordType } from '../../utils/studio/studioTypes';

const { Text } = Typography;

interface DeploymentRecordProps {
  deployment: DeploymentRecordType;
  expanded: boolean;
  onToggleExpand: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: ReactNode; label: string }> = {
  pending: { color: 'blue', icon: <ClockCircleOutlined />, label: 'Pending' },
  'in-progress': { color: 'orange', icon: <SyncOutlined spin />, label: 'In Progress' },
  complete: { color: 'green', icon: <CheckCircleOutlined />, label: 'Complete' },
  failed: { color: 'red', icon: <CloseCircleOutlined />, label: 'Failed' },
  'rolled-back': { color: 'purple', icon: <RollbackOutlined />, label: 'Rolled Back' },
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function DeploymentRecord({ deployment, expanded, onToggleExpand }: DeploymentRecordProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const statusCfg = STATUS_CONFIG[deployment.status] ?? STATUS_CONFIG.pending;

  const outputEntries = Object.entries(deployment.outputs);

  const detailItems = [
    {
      key: deployment.deploymentId,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {statusCfg.icon}
          <Text strong>Events &amp; Details</Text>
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {deployment.status === 'in-progress' && (
            <Progress status="active" percent={99.9} showInfo={false} strokeColor="#fa8c16" />
          )}

          {deployment.events.length > 0 && (
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>Stack Events</Text>
              <Timeline
                items={deployment.events.map((evt) => ({
                  color: evt.status.includes('COMPLETE') ? 'green'
                    : evt.status.includes('FAILED') ? 'red'
                    : evt.status.includes('IN_PROGRESS') ? 'blue'
                    : 'gray',
                  dot: evt.status.includes('IN_PROGRESS') ? <LoadingOutlined /> : undefined,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 12 }}>{evt.logicalResourceId}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {evt.resourceType} — {evt.status}
                      </Text>
                      {evt.statusReason && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                            {evt.statusReason}
                          </Text>
                        </>
                      )}
                      <br />
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {formatTimestamp(evt.timestamp)}
                      </Text>
                    </div>
                  ),
                }))}
              />
            </div>
          )}

          {outputEntries.length > 0 && (
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>Outputs</Text>
              <Descriptions
                bordered
                size="small"
                column={1}
                items={outputEntries.map(([key, value]) => ({
                  key,
                  label: key,
                  children: <Text copyable style={{ fontSize: 12 }}>{value}</Text>,
                }))}
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      size="small"
      hoverable
      onClick={onToggleExpand}
      style={{
        borderRadius: 10,
        border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        background: isDark ? '#1a1a1a' : '#ffffff',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        cursor: 'pointer',
      }}
      className="interactive-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>{deployment.stackName}</Text>
            <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {deployment.deploymentId} · {deployment.region} · {formatTimestamp(deployment.timestamp)}
          </Text>
        </div>
        {deployment.status === 'in-progress' && (
          <SyncOutlined spin style={{ fontSize: 18, color: '#fa8c16' }} />
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
          <Collapse
            defaultActiveKey={[deployment.deploymentId]}
            ghost
            items={detailItems}
          />
        </div>
      )}
    </Card>
  );
}
