import type { ReactNode } from 'react';
import { Typography, Alert, Steps } from 'antd';
import {
  RocketOutlined,
  TeamOutlined,
  MessageOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function GettingStarted(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Getting Started with HiveMind Studio</Title>
      <Paragraph>
        HiveMind Studio is an agentic AI-powered DevOps workspace that helps you design, deploy,
        and manage AWS infrastructure through natural language conversations with specialized AI agents.
      </Paragraph>

      <Alert
        message="Quick Start"
        description="Open the Chat view, select an agent, and describe the infrastructure you want to build. The agent will guide you through design, validation, and deployment."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={3}>Core Concepts</Title>
      <Steps
        direction="vertical"
        current={-1}
        items={[
          {
            title: 'AI Agents',
            description: 'Specialized agents handle different DevOps tasks — Recon scouts repositories, Conductor orchestrates infrastructure, and Janitor handles cleanup.',
            icon: <TeamOutlined />,
          },
          {
            title: 'Chat Interface',
            description: 'Converse with agents in natural language. Ask them to design architectures, troubleshoot issues, or explain your infrastructure.',
            icon: <MessageOutlined />,
          },
          {
            title: 'Infrastructure Design',
            description: 'View live architecture diagrams, generate CloudFormation templates, and estimate costs — all from the chat context.',
            icon: <CloudServerOutlined />,
          },
          {
            title: 'Deploy & Monitor',
            description: 'Track deployments in real-time, browse CloudWatch logs, and monitor stack events directly in the Studio.',
            icon: <RocketOutlined />,
          },
        ]}
      />

      <Title level={3}>Studio Layout</Title>
      <Paragraph>
        The Studio is organized into four main views accessible from the top navigation:
      </Paragraph>
      <ul>
        <li><Text strong>Agents</Text> — Browse available AI agents and their capabilities</li>
        <li><Text strong>Chat</Text> — Interact with agents and design infrastructure</li>
        <li><Text strong>Deployments</Text> — Track deployment history and status</li>
        <li><Text strong>Logs</Text> — Browse CloudWatch logs from your AWS account</li>
      </ul>

      <Title level={3}>First Steps</Title>
      <Paragraph>
        1. Configure your API settings (Settings → API Configuration) with your LLM provider credentials.
      </Paragraph>
      <Paragraph>
        2. Open the Chat view and select the <Text code>conductor</Text> agent.
      </Paragraph>
      <Paragraph>
        3. Describe the infrastructure you need, for example: <Text code>"Create a serverless API with Lambda and API Gateway"</Text>
      </Paragraph>
      <Paragraph>
        4. Review the generated architecture, template, and cost estimate.
      </Paragraph>
      <Paragraph>
        5. Deploy when ready and monitor progress in the Deployments view.
      </Paragraph>
    </Typography>
  );
}
