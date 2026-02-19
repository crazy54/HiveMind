import { Segmented, Badge } from 'antd';
import type { ReactNode } from 'react';
import {
  TeamOutlined,
  MessageOutlined,
  CloudServerOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

export type StudioView = 'agents' | 'chat' | 'deployments' | 'logs';

interface ViewSwitcherProps {
  activeView: StudioView;
  onViewChange: (view: StudioView) => void;
  notifications?: Partial<Record<StudioView, number>>;
}

const VIEW_OPTIONS: { value: StudioView; label: string; icon: React.ReactNode }[] = [
  { value: 'agents', label: 'Agents', icon: <TeamOutlined /> },
  { value: 'chat', label: 'Chat', icon: <MessageOutlined /> },
  { value: 'deployments', label: 'Deploy', icon: <CloudServerOutlined /> },
  { value: 'logs', label: 'Logs', icon: <FileTextOutlined /> },
];

export function ViewSwitcher({ activeView, onViewChange, notifications = {} }: ViewSwitcherProps): ReactNode {
  return (
    <Segmented
      value={activeView}
      onChange={(val) => onViewChange(val as StudioView)}
      options={VIEW_OPTIONS.map((opt) => ({
        value: opt.value,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
            {opt.icon}
            <span>{opt.label}</span>
            {(notifications[opt.value] ?? 0) > 0 && (
              <Badge count={notifications[opt.value]} size="small" />
            )}
          </div>
        ),
      }))}
    />
  );
}
