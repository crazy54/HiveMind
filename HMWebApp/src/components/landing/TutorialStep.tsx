import type { ReactNode } from 'react';
import { Typography, Space } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Paragraph } = Typography;

export interface TutorialStepProps {
  title: string;
  description: string;
  icon: string;
  stepNumber: number;
  totalSteps: number;
}

export function TutorialStep({ title, description, icon, stepNumber, totalSteps }: TutorialStepProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <Space
      direction="vertical"
      align="center"
      size="large"
      style={{ textAlign: 'center', width: '100%', maxWidth: 480 }}
      data-testid={`tutorial-step-${stepNumber}`}
    >
      <div
        style={{
          fontSize: 64,
          lineHeight: 1,
          marginBottom: 8,
        }}
        role="img"
        aria-label={title}
      >
        {icon}
      </div>
      <Title
        level={3}
        style={{
          margin: 0,
          color: isDark ? '#e0e0e0' : '#1a1a1a',
        }}
      >
        {title}
      </Title>
      <Paragraph
        style={{
          fontSize: 16,
          color: isDark ? '#a0a0a0' : '#595959',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {description}
      </Paragraph>
      <div
        aria-label={`Step ${stepNumber + 1} of ${totalSteps}`}
        style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === stepNumber ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === stepNumber
                ? (isDark ? '#D4AF37' : '#1677ff')
                : (isDark ? '#333' : '#d9d9d9'),
              transition: 'all 300ms ease',
            }}
          />
        ))}
      </div>
    </Space>
  );
}
