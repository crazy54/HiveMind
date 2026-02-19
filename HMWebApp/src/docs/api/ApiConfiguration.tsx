import type { ReactNode } from 'react';
import { Typography, Alert, Descriptions } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function ApiConfiguration(): ReactNode {
  return (
    <Typography>
      <Title level={2}>API Configuration</Title>
      <Paragraph>
        HiveMind Studio connects to LLM providers for agent conversations and to AWS for
        infrastructure operations. Configure your providers in Settings → API Configuration.
      </Paragraph>

      <Alert
        message="Security Note"
        description="API keys are stored in your browser's localStorage and sent to the backend over WebSocket. They are never logged or persisted server-side. Use environment variables for production deployments."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={3}>Supported Providers</Title>
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Amazon Bedrock">
          Configure the Bedrock endpoint and region. Uses IAM credentials from your AWS configuration.
          Supports Claude, Titan, and other Bedrock-hosted models.
        </Descriptions.Item>
        <Descriptions.Item label="Claude API">
          Provide your Anthropic API key. The backend routes messages directly to the Claude API.
        </Descriptions.Item>
        <Descriptions.Item label="ChatGPT API">
          Provide your OpenAI API key. The backend routes messages to the OpenAI Chat Completions API.
        </Descriptions.Item>
      </Descriptions>

      <Title level={3}>Setting Up a Provider</Title>
      <Paragraph>
        1. Open Settings from the top bar (gear icon) or left icon rail.
      </Paragraph>
      <Paragraph>
        2. Navigate to the API Configuration section.
      </Paragraph>
      <Paragraph>
        3. Select your preferred provider and enter the required credentials.
      </Paragraph>
      <Paragraph>
        4. Save the configuration. The Chat view will use the selected provider for all
        subsequent messages.
      </Paragraph>

      <Title level={3}>AWS Credentials</Title>
      <Paragraph>
        AWS credentials are required for:
      </Paragraph>
      <ul>
        <li>CloudWatch log browsing (Logs view)</li>
        <li>CloudFormation deployments</li>
        <li>Amazon Bedrock model access</li>
      </ul>
      <Paragraph>
        Configure your AWS region and credentials in the API settings. The backend uses these
        credentials to proxy AWS API calls on your behalf.
      </Paragraph>

      <Title level={3}>Offline Mode</Title>
      <Paragraph>
        If no provider is configured or the WebSocket connection is lost, the Chat view falls
        back to an offline mock mode. Responses in offline mode are simulated and clearly
        indicated in the UI. Configure a provider to enable real agent conversations.
      </Paragraph>

      <Title level={3}>Troubleshooting</Title>
      <ul>
        <li>
          <Text strong>Invalid API key</Text> — Verify your key in the provider dashboard.
          Error messages appear as system messages in the chat.
        </li>
        <li>
          <Text strong>Rate limit exceeded</Text> — Wait a moment and retry. Consider upgrading
          your API plan for higher limits.
        </li>
        <li>
          <Text strong>Connection refused</Text> — Check that the backend server is running
          and accessible at the configured WebSocket URL.
        </li>
      </ul>
    </Typography>
  );
}
