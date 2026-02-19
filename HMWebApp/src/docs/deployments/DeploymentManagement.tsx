import type { ReactNode } from 'react';
import { Typography, Tag, Descriptions } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function DeploymentManagement(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Deployment Management</Title>
      <Paragraph>
        The Deployments view tracks all your infrastructure deployments, showing status,
        events, and outputs. Deployments are sorted newest-first for quick access to recent activity.
      </Paragraph>

      <Title level={3}>Deployment Status</Title>
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label={<Tag color="blue">Pending</Tag>}>Deployment has been queued but not yet started.</Descriptions.Item>
        <Descriptions.Item label={<Tag color="orange">In Progress</Tag>}>CloudFormation stack is being created or updated.</Descriptions.Item>
        <Descriptions.Item label={<Tag color="green">Complete</Tag>}>All resources have been successfully created.</Descriptions.Item>
        <Descriptions.Item label={<Tag color="red">Failed</Tag>}>Deployment encountered an error. Check events for details.</Descriptions.Item>
        <Descriptions.Item label={<Tag color="purple">Rolled Back</Tag>}>Deployment was rolled back due to a failure.</Descriptions.Item>
      </Descriptions>

      <Title level={3}>Viewing Deployment Details</Title>
      <Paragraph>
        Click any deployment record to expand its detail panel. The detail panel shows:
      </Paragraph>
      <ul>
        <li><Text strong>Stack Events</Text> — Chronological list of CloudFormation events</li>
        <li><Text strong>Outputs</Text> — Stack output values (endpoints, ARNs, etc.)</li>
        <li><Text strong>Logs</Text> — Related CloudWatch log entries</li>
      </ul>

      <Title level={3}>Live Progress</Title>
      <Paragraph>
        In-progress deployments show a live progress indicator that updates via WebSocket events.
        The deployment overlay provides a cinematic view of resources being created, with animated
        nodes transitioning through creation states.
      </Paragraph>

      <Title level={3}>Starting a New Deployment</Title>
      <Paragraph>
        Click the <Text code>Deploy New</Text> button to switch to the Chat view and start
        an infrastructure design conversation. You can also use the Deploy action in the
        bottom dock from the Chat view.
      </Paragraph>

      <Title level={3}>Deployment Overlay</Title>
      <Paragraph>
        During active deployments, a full-screen overlay shows resource creation progress.
        When real-time streaming is available, resource nodes animate based on live CloudFormation
        events — pulsing amber for in-progress, solid green for complete. If streaming is
        unavailable, a simulated animation sequence is shown instead.
      </Paragraph>
    </Typography>
  );
}
