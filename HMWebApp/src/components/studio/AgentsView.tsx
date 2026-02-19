import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Row, Col, Skeleton, Button, Typography, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { AgentCard } from './AgentCard';
import type { AgentInfo } from '../../utils/studio/studioTypes';

const { Text } = Typography;

interface AgentsViewProps {
  onSelectAgent: (agentId: string) => void;
}

const DEFAULT_AGENTS: AgentInfo[] = [
  {
    id: 'conductor',
    name: 'Conductor',
    icon: '🎼',
    role: 'Infrastructure Orchestrator',
    capabilities: ['Deployment orchestration', 'CloudFormation generation', 'Cost estimation', 'Architecture design'],
    status: 'available',
  },
  {
    id: 'recon',
    name: 'Recon',
    icon: '🔍',
    role: 'Repository Scout',
    capabilities: ['Repo analysis', 'Tech stack detection', 'Dependency scanning', 'Security audit'],
    status: 'available',
  },
  {
    id: 'provisioner',
    name: 'Provisioner',
    icon: '🏗️',
    role: 'Infrastructure Provisioner',
    capabilities: ['CloudFormation templates', 'EC2 / RDS / ALB provisioning', 'Stage-1 & production modes'],
    status: 'available',
  },
  {
    id: 'deployer',
    name: 'Deployer',
    icon: '🚀',
    role: 'Application Deployer',
    capabilities: ['App deployment', 'ALB target registration', 'Health check verification'],
    status: 'available',
  },
  {
    id: 'sheriff',
    name: 'Sheriff',
    icon: '🔒',
    role: 'Security Agent',
    capabilities: ['Security group management', 'IAM policy enforcement', 'Compliance checks'],
    status: 'available',
  },
  {
    id: 'qa',
    name: 'QA',
    icon: '🧪',
    role: 'Quality Assurance',
    capabilities: ['Post-deploy verification', 'Endpoint health checks', 'Integration testing'],
    status: 'available',
  },
  {
    id: 'ops',
    name: 'Ops',
    icon: '📊',
    role: 'Observability',
    capabilities: ['CloudWatch dashboards', 'X-Ray tracing setup', 'Metrics & alerting'],
    status: 'available',
  },
  {
    id: 'medic',
    name: 'Medic',
    icon: '🩺',
    role: 'Error Recovery',
    capabilities: ['Failure analysis', 'Automated fix suggestions', 'Retry orchestration'],
    status: 'available',
  },
  {
    id: 'janitor',
    name: 'Janitor',
    icon: '🧹',
    role: 'Cleanup & Maintenance',
    capabilities: ['Unused resource detection', 'Cost optimization', 'Drift detection'],
    status: 'available',
  },
  {
    id: 'compiler',
    name: 'Compiler',
    icon: '⚙️',
    role: 'Build Agent',
    capabilities: ['Application build', 'Dependency resolution', 'Artifact preparation'],
    status: 'available',
  },
];

export function AgentsView({ onSelectAgent }: AgentsViewProps): ReactNode {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
      const data: AgentInfo[] = await res.json();
      setAgents(data);
    } catch {
      setAgents(DEFAULT_AGENTS);
      setError('Could not reach agent API — showing default agents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {error && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchAgents}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">No agents available.</Text>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {agents.map((agent) => (
            <Col key={agent.id} xs={24} sm={12} lg={8}>
              <AgentCard agent={agent} onSelect={onSelectAgent} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
