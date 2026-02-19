import type { ReactNode } from 'react';
import { Typography, Alert, Descriptions } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function ChatUsage(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Chat Interface</Title>
      <Paragraph>
        The Chat view is the primary way to interact with HiveMind agents. Messages are sent
        over a WebSocket connection to the backend, which routes them to the appropriate AI agent
        for processing.
      </Paragraph>

      <Title level={3}>Sending Messages</Title>
      <Paragraph>
        Type your message in the input area at the bottom of the Chat view and press Enter or
        click the Send button. Messages are delivered in real-time via WebSocket.
      </Paragraph>

      <Title level={3}>Streaming Responses</Title>
      <Paragraph>
        Agent responses stream token-by-token as they are generated. You will see a typing
        indicator while the response is being generated. The send button is disabled during
        active streaming to prevent concurrent messages.
      </Paragraph>

      <Alert
        message="Tip"
        description="If a response seems stuck, check the connection indicator in the input area. A green dot means connected; red means disconnected."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={3}>Agent Switching</Title>
      <Paragraph>
        Use the agent dropdown in the input area to switch between Recon, Conductor, and Janitor.
        The conversation history is maintained across agent switches, allowing agents to reference
        previous context.
      </Paragraph>

      <Title level={3}>Connection Status</Title>
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="🟢 Connected">WebSocket is active. Messages are sent to the live backend.</Descriptions.Item>
        <Descriptions.Item label="🔴 Disconnected">WebSocket is down. The system falls back to offline mock responses.</Descriptions.Item>
        <Descriptions.Item label="🟡 Reconnecting">Attempting to re-establish the connection with exponential backoff.</Descriptions.Item>
      </Descriptions>

      <Title level={3}>Infrastructure Sub-Views</Title>
      <Paragraph>
        When discussing infrastructure design, the Chat view provides secondary navigation
        to three sub-views:
      </Paragraph>
      <ul>
        <li><Text strong>Architecture</Text> — Live diagram of your infrastructure design</li>
        <li><Text strong>Template</Text> — Generated CloudFormation template</li>
        <li><Text strong>Cost</Text> — Estimated monthly cost breakdown</li>
      </ul>

      <Title level={3}>Session Management</Title>
      <Paragraph>
        Use the <Text code>Reset Session</Text> option in the left icon rail to clear the
        conversation history and start fresh. This creates a new WebSocket session.
      </Paragraph>

      <Title level={3}>Context Windowing</Title>
      <Paragraph>
        To manage token limits, conversations longer than 50 messages automatically send only
        the most recent 20 messages as context with new requests. Earlier messages are still
        visible in the UI but are not included in the LLM context.
      </Paragraph>
    </Typography>
  );
}
