import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Modal, Typography, Tag, Progress, Button, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CloudServerOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { DeploymentEvent } from '../../utils/studio/studioTypes';

const { Text } = Typography;

const MAX_LOG_TAIL = 10;
const WS_CONNECT_TIMEOUT_MS = 5000;
const SIMULATED_INTERVAL_MS = 2000;

export interface DeploymentOverlayProps {
  deploymentId: string;
  onComplete: () => void;
  onClose: () => void;
}

interface ResourceNodeState {
  logicalResourceId: string;
  resourceType: string;
  status: string;
  statusReason?: string;
  timestamp: number;
}

type ConnectionState = 'connecting' | 'connected' | 'fallback';

const TERMINAL_STACK_STATUSES = ['CREATE_COMPLETE', 'ROLLBACK_COMPLETE', 'DELETE_COMPLETE', 'UPDATE_COMPLETE'];

function getStatusColor(status: string): string {
  if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) return '#52c41a';
  if (status.includes('FAILED') || status.includes('ROLLBACK')) return '#ff4d4f';
  if (status.includes('IN_PROGRESS')) return '#fa8c16';
  return '#8c8c8c';
}

function getStatusIcon(status: string): ReactNode {
  if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) return <CheckCircleOutlined />;
  if (status.includes('FAILED') || status.includes('ROLLBACK')) return <CloseCircleOutlined />;
  if (status.includes('IN_PROGRESS')) return <SyncOutlined spin />;
  return <CloudServerOutlined />;
}

function formatEventTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Simulated CF events for fallback when WebSocket is unavailable */
const SIMULATED_RESOURCES = [
  { logicalResourceId: 'VPC', resourceType: 'AWS::EC2::VPC' },
  { logicalResourceId: 'Subnet', resourceType: 'AWS::EC2::Subnet' },
  { logicalResourceId: 'SecurityGroup', resourceType: 'AWS::EC2::SecurityGroup' },
  { logicalResourceId: 'IAMRole', resourceType: 'AWS::IAM::Role' },
  { logicalResourceId: 'LambdaFunction', resourceType: 'AWS::Lambda::Function' },
];

function buildWsUrl(deploymentId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/deployments/${deploymentId}/events`;
}

export function DeploymentOverlay({ deploymentId, onComplete, onClose }: DeploymentOverlayProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [events, setEvents] = useState<DeploymentEvent[]>([]);
  const [resourceNodes, setResourceNodes] = useState<Map<string, ResourceNodeState>>(new Map());
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isTerminal, setIsTerminal] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulatedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logTailRef = useRef<HTMLDivElement>(null);

  const addEvent = useCallback((event: DeploymentEvent) => {
    setEvents((prev) => [...prev, event]);

    setResourceNodes((prev) => {
      const next = new Map(prev);
      next.set(event.logicalResourceId, {
        logicalResourceId: event.logicalResourceId,
        resourceType: event.resourceType,
        status: event.status,
        statusReason: event.statusReason,
        timestamp: event.timestamp,
      });
      return next;
    });

    // Check for terminal stack status (the stack itself completing)
    if (TERMINAL_STACK_STATUSES.includes(event.status) && event.resourceType === 'AWS::CloudFormation::Stack') {
      setIsTerminal(true);
    }
  }, []);

  // Start simulated fallback animation
  const startSimulation = useCallback(() => {
    setConnectionState('fallback');
    let step = 0;

    simulatedTimerRef.current = setInterval(() => {
      if (step >= SIMULATED_RESOURCES.length * 2) {
        // Simulation complete — fire stack complete
        addEvent({
          timestamp: Date.now(),
          resourceType: 'AWS::CloudFormation::Stack',
          logicalResourceId: 'Stack',
          status: 'CREATE_COMPLETE',
        });
        if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);
        return;
      }

      const resourceIdx = Math.floor(step / 2);
      const resource = SIMULATED_RESOURCES[resourceIdx];
      const isComplete = step % 2 === 1;

      addEvent({
        timestamp: Date.now(),
        resourceType: resource.resourceType,
        logicalResourceId: resource.logicalResourceId,
        status: isComplete ? 'CREATE_COMPLETE' : 'CREATE_IN_PROGRESS',
      });

      step += 1;
    }, SIMULATED_INTERVAL_MS);
  }, [addEvent]);

  // WebSocket connection for live CF events
  useEffect(() => {
    const wsUrl = buildWsUrl(deploymentId);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // If we don't connect within timeout, fall back to simulation
      connectTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          startSimulation();
        }
      }, WS_CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        setConnectionState('connected');
      };

      ws.onmessage = (msgEvent) => {
        try {
          const event = JSON.parse(msgEvent.data) as DeploymentEvent;
          addEvent(event);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        ws.close();
      };

      ws.onclose = () => {
        if (connectionState === 'connecting') {
          startSimulation();
        }
      };
    } catch {
      startSimulation();
    }

    return () => {
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploymentId]);

  // Auto-close on terminal status
  useEffect(() => {
    if (isTerminal) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTerminal, onComplete]);

  // Auto-scroll log tail
  useEffect(() => {
    if (logTailRef.current) {
      logTailRef.current.scrollTop = logTailRef.current.scrollHeight;
    }
  }, [events]);

  const recentEvents = events.slice(-MAX_LOG_TAIL);
  const nodeArray = Array.from(resourceNodes.values());
  const completedCount = nodeArray.filter((n) => n.status.includes('COMPLETE') && !n.status.includes('ROLLBACK')).length;
  const totalCount = Math.max(nodeArray.length, 1);
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <Modal
      open
      closable
      onCancel={onClose}
      footer={
        <Space>
          {isTerminal && (
            <Button type="primary" onClick={onComplete}>
              Done
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </Space>
      }
      width={720}
      title={
        <Space>
          <CloudServerOutlined />
          <span>Deploying: {deploymentId}</span>
          {connectionState === 'fallback' && (
            <Tag icon={<DisconnectOutlined />} color="warning">Simulated</Tag>
          )}
          {connectionState === 'connected' && (
            <Tag color="success">Live</Tag>
          )}
          {connectionState === 'connecting' && (
            <Tag icon={<SyncOutlined spin />} color="processing">Connecting...</Tag>
          )}
        </Space>
      }
      styles={{
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.65)' },
        content: {
          background: isDark ? '#141414' : '#ffffff',
          borderRadius: 12,
        },
        header: {
          background: isDark ? '#141414' : '#ffffff',
          borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        },
        body: { padding: 24 },
      }}
    >
      {/* Progress bar */}
      <Progress
        percent={isTerminal ? 100 : progressPercent}
        status={isTerminal ? 'success' : 'active'}
        strokeColor={isTerminal ? '#52c41a' : '#fa8c16'}
        style={{ marginBottom: 20 }}
      />

      {/* Resource nodes grid */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Resources</Text>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {nodeArray.length === 0 && (
            <Text type="secondary">Waiting for events...</Text>
          )}
          {nodeArray.map((node) => {
            const color = getStatusColor(node.status);
            const isPulsing = node.status.includes('IN_PROGRESS');
            return (
              <div
                key={node.logicalResourceId}
                data-testid={`resource-node-${node.logicalResourceId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${color}`,
                  background: isDark ? '#1a1a1a' : '#fafafa',
                  animation: isPulsing ? 'deployPulse 1.5s ease-in-out infinite' : 'none',
                  transition: 'border-color 300ms ease, background 300ms ease',
                }}
              >
                {getStatusIcon(node.status)}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text strong style={{ fontSize: 12, lineHeight: 1.2 }}>{node.logicalResourceId}</Text>
                  <Text type="secondary" style={{ fontSize: 10, lineHeight: 1.2 }}>{node.resourceType}</Text>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live log tail */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Event Log</Text>
        <div
          ref={logTailRef}
          role="log"
          aria-label="Deployment events"
          style={{
            maxHeight: 220,
            overflow: 'auto',
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: 11,
            lineHeight: 1.6,
            padding: 10,
            borderRadius: 6,
            background: isDark ? '#0d0d0d' : '#f5f5f5',
            border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
          }}
        >
          {recentEvents.length === 0 && (
            <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
              Waiting for deployment events...
            </Text>
          )}
          {recentEvents.map((evt, idx) => (
            <div
              key={`${evt.timestamp}-${evt.logicalResourceId}-${idx}`}
              style={{
                padding: '2px 0',
                borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#f0f0f0'}`,
              }}
            >
              <Text style={{ color: isDark ? '#8c8c8c' : '#595959', fontFamily: 'inherit', fontSize: 'inherit' }}>
                {formatEventTimestamp(evt.timestamp)}
              </Text>
              {' '}
              <Text style={{ color: getStatusColor(evt.status), fontFamily: 'inherit', fontSize: 'inherit' }}>
                {evt.status}
              </Text>
              {' '}
              <Text style={{ color: isDark ? '#e0e0e0' : '#1a1a1a', fontFamily: 'inherit', fontSize: 'inherit' }}>
                {evt.logicalResourceId}
              </Text>
              {' '}
              <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
                ({evt.resourceType})
              </Text>
              {evt.statusReason && (
                <>
                  {' — '}
                  <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 'inherit', fontStyle: 'italic' }}>
                    {evt.statusReason}
                  </Text>
                </>
              )}
            </div>
          ))}
          {!isTerminal && events.length > 0 && (
            <div style={{ padding: '4px 0', opacity: 0.6 }}>
              <Text type="secondary" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
                ● Streaming events...
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes deployPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Modal>
  );
}
