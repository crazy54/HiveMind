import type { ReactNode } from 'react';
import { Typography, Steps } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function InfraDesign(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Infrastructure Design Workflow</Title>
      <Paragraph>
        HiveMind Studio provides an end-to-end workflow for designing, validating, and deploying
        AWS infrastructure through natural language conversations.
      </Paragraph>

      <Title level={3}>Design Flow</Title>
      <Steps
        direction="vertical"
        current={-1}
        items={[
          {
            title: 'Describe Your Needs',
            description: 'Tell the Conductor agent what you want to build. Be specific about services, scaling requirements, and constraints.',
          },
          {
            title: 'Review Architecture',
            description: 'The agent generates a visual architecture diagram. Switch to the Architecture sub-view to see your infrastructure layout.',
          },
          {
            title: 'Generate Template',
            description: 'A CloudFormation template is generated from the architecture. Review it in the Template sub-view.',
          },
          {
            title: 'Estimate Costs',
            description: 'View estimated monthly costs in the Cost sub-view. The agent breaks down costs by service.',
          },
          {
            title: 'Validate & Deploy',
            description: 'Use the bottom dock actions to validate the template and deploy when ready.',
          },
        ]}
      />

      <Title level={3}>Architecture View</Title>
      <Paragraph>
        The Architecture sub-view displays a live diagram of your infrastructure. Resources are
        shown as nodes with connections representing dependencies and data flow. The diagram
        updates in real-time as you refine your design through conversation.
      </Paragraph>

      <Title level={3}>Template View</Title>
      <Paragraph>
        The Template sub-view shows the generated CloudFormation template in YAML format.
        You can review resource definitions, parameters, and outputs before deploying.
      </Paragraph>

      <Title level={3}>Cost View</Title>
      <Paragraph>
        The Cost sub-view provides an estimated monthly cost breakdown by service. The live
        cost ticker in the bottom dock shows the running total as you add or remove resources.
      </Paragraph>

      <Title level={3}>Bottom Dock Actions</Title>
      <Paragraph>
        The bottom dock provides quick actions for the infrastructure workflow:
      </Paragraph>
      <ul>
        <li><Text strong>Generate</Text> — Generate or regenerate the CloudFormation template</li>
        <li><Text strong>Validate</Text> — Validate the template against AWS best practices</li>
        <li><Text strong>Deploy</Text> — Start a deployment with the current template</li>
        <li><Text strong>View Cost</Text> — Switch to the cost estimation view</li>
      </ul>
    </Typography>
  );
}
