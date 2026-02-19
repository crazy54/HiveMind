import { Button, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import {
  FormatPainterOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { Text } = Typography;

interface BottomDockProps {
  estimatedCost: string;
  onGenerate: () => void;
  onValidate: () => void;
  onDeploy: () => void;
  onViewCost: () => void;
}

export function BottomDock({ estimatedCost, onGenerate, onValidate, onDeploy, onViewCost }: BottomDockProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <footer
      role="toolbar"
      aria-label="Studio actions"
      className="studio-bottom-dock"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 24px',
        height: 48,
        borderTop: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        background: isDark
          ? 'rgba(20, 20, 20, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Space size={16}>
        <Button type="text" icon={<FormatPainterOutlined />} onClick={onGenerate} aria-label="Generate template" className="dock-btn">
          Generate
        </Button>
        <Button type="text" icon={<SafetyCertificateOutlined />} onClick={onValidate} aria-label="Validate template" className="dock-btn">
          Validate
        </Button>
        <Button type="text" icon={<RocketOutlined />} onClick={onDeploy} aria-label="Deploy infrastructure" className="dock-btn">
          Deploy
        </Button>
        <Button type="text" icon={<BarChartOutlined />} onClick={onViewCost} aria-label="View cost estimate" className="dock-btn">
          View Cost
        </Button>
      </Space>
      <Text
        style={{
          fontFamily: "'Inter', monospace",
          fontWeight: 500,
          color: isDark ? '#D4AF37' : '#8B7320',
        }}
      >
        {estimatedCost}
      </Text>
    </footer>
  );
}
