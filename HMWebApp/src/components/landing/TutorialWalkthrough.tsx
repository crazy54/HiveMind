import type { ReactNode } from 'react';
import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { TutorialStep } from './TutorialStep';
import { useTheme } from '../../contexts/ThemeContext';

export const TUTORIAL_STEPS = [
  {
    title: 'Meet Your AI Team',
    description: 'HiveMind agents specialize in different DevOps tasks. Recon scouts your repos, Conductor orchestrates workflows, and Janitor keeps things clean.',
    icon: '🤖',
  },
  {
    title: 'Chat with Agents',
    description: 'Talk to agents in natural language. Ask them to design infrastructure, troubleshoot issues, or explain your architecture.',
    icon: '💬',
  },
  {
    title: 'Design Infrastructure',
    description: 'Build AWS architectures visually. See your infrastructure as a live diagram, generate CloudFormation templates, and estimate costs.',
    icon: '🏗️',
  },
  {
    title: 'Track Deployments',
    description: 'Monitor deployment progress in real-time. View stack events, outputs, and logs as your infrastructure comes to life.',
    icon: '🚀',
  },
  {
    title: 'Browse Logs',
    description: 'Read CloudWatch logs directly in Studio. Filter by keyword, time range, and stream logs in real-time.',
    icon: '📋',
  },
  {
    title: 'Make It Yours',
    description: 'Choose from theme presets, toggle dark/light mode, and customize the Studio to match your style.',
    icon: '🎨',
  },
  {
    title: 'Learn More',
    description: 'Comprehensive documentation is built right in. Click the Docs button anytime to learn about features and capabilities.',
    icon: '📖',
  },
];

export interface TutorialWalkthroughProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function TutorialWalkthrough({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: TutorialWalkthroughProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div
      data-testid="tutorial-walkthrough"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      <TutorialStep
        title={step.title}
        description={step.description}
        icon={step.icon}
        stepNumber={currentStep}
        totalSteps={totalSteps}
      />

      <Space size="middle">
        {!isFirstStep && (
          <Button
            icon={<LeftOutlined />}
            onClick={onPrevious}
            style={{
              borderColor: isDark ? '#333' : '#d9d9d9',
              color: isDark ? '#e0e0e0' : '#1a1a1a',
            }}
          >
            Previous
          </Button>
        )}
        {isLastStep ? (
          <Button type="primary" onClick={onComplete}>
            Get Started
          </Button>
        ) : (
          <Button type="primary" onClick={onNext}>
            Next <RightOutlined />
          </Button>
        )}
      </Space>

      <Button
        type="link"
        onClick={onSkip}
        style={{
          color: isDark ? '#a0a0a0' : '#595959',
          fontSize: 13,
        }}
      >
        Skip Tutorial
      </Button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
