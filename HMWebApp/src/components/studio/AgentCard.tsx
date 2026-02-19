import type { ReactNode } from 'react';
import { Card, Tag, Typography, Badge } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import type { AgentInfo } from '../../utils/studio/studioTypes';

const { Text, Paragraph } = Typography;

interface AgentCardProps {
  agent: AgentInfo;
  onSelect: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'green',
  busy: 'orange',
  unavailable: 'red',
};

export function AgentCard({ agent, onSelect }: AgentCardProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <Badge.Ribbon
      text={agent.status}
      color={STATUS_COLORS[agent.status] ?? 'default'}
    >
      <Card
        hoverable
        onClick={() => onSelect(agent.id)}
        style={{
          borderRadius: 12,
          border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
          background: isDark ? '#1a1a1a' : '#ffffff',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          cursor: 'pointer',
        }}
        styles={{
          body: { padding: 20 },
        }}
        className="interactive-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{agent.icon}</span>
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>{agent.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{agent.role}</Text>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {agent.capabilities.map((cap) => (
            <Tag key={cap} style={{ margin: 0, fontSize: 11 }}>{cap}</Tag>
          ))}
        </div>
      </Card>
    </Badge.Ribbon>
  );
}
