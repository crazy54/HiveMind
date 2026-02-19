import type { ReactNode } from 'react';
import { Typography, Card, Tag, Row, Col } from 'antd';
import {
  SearchOutlined,
  BuildOutlined,
  ClearOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const AGENTS = [
  {
    name: 'Recon',
    icon: <SearchOutlined style={{ fontSize: 24 }} />,
    role: 'Repository Scout',
    description:
      'Recon analyzes your codebase and repositories to understand existing infrastructure, dependencies, and patterns. Use Recon when you need to understand what you already have before making changes.',
    capabilities: ['Repository analysis', 'Dependency scanning', 'Pattern detection', 'Architecture mapping'],
    color: '#1677ff',
  },
  {
    name: 'Conductor',
    icon: <BuildOutlined style={{ fontSize: 24 }} />,
    role: 'Infrastructure Orchestrator',
    description:
      'Conductor designs and orchestrates AWS infrastructure based on your requirements. It generates CloudFormation templates, estimates costs, and manages deployments. This is your primary agent for building new infrastructure.',
    capabilities: ['Architecture design', 'Template generation', 'Cost estimation', 'Deployment orchestration'],
    color: '#D4AF37',
  },
  {
    name: 'Janitor',
    icon: <ClearOutlined style={{ fontSize: 24 }} />,
    role: 'Cleanup & Optimization',
    description:
      'Janitor identifies unused resources, optimizes configurations, and helps clean up stale infrastructure. Use Janitor to reduce costs and maintain a tidy AWS environment.',
    capabilities: ['Resource cleanup', 'Cost optimization', 'Stale resource detection', 'Configuration audit'],
    color: '#52c41a',
  },
];

export default function AgentsOverview(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Agents Overview</Title>
      <Paragraph>
        HiveMind Studio uses specialized AI agents, each focused on a specific area of DevOps.
        You can switch between agents in the Chat view or click an agent card in the Agents view
        to start a conversation.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {AGENTS.map((agent) => (
          <Col xs={24} md={8} key={agent.name}>
            <Card
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {agent.icon}
                  <span>{agent.name}</span>
                </span>
              }
              extra={<Text type="secondary">{agent.role}</Text>}
              style={{ height: '100%' }}
            >
              <Paragraph>{agent.description}</Paragraph>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {agent.capabilities.map((cap) => (
                  <Tag key={cap} color={agent.color}>{cap}</Tag>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={3} style={{ marginTop: 32 }}>Switching Agents</Title>
      <Paragraph>
        Use the agent selector dropdown in the Chat input area to switch between agents mid-conversation.
        The conversation history is preserved when switching, so agents can build on previous context.
      </Paragraph>

      <Title level={3}>Agent Status</Title>
      <Paragraph>
        Each agent card shows a real-time status indicator:
      </Paragraph>
      <ul>
        <li><Tag color="green">Available</Tag> — Ready to accept messages</li>
        <li><Tag color="orange">Busy</Tag> — Currently processing a request</li>
        <li><Tag color="red">Unavailable</Tag> — Offline or not configured</li>
      </ul>
    </Typography>
  );
}
