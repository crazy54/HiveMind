import { Menu, Typography, Tooltip, Button } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import {
  MessageOutlined,
  TeamOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  FormatPainterOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  BarChartOutlined,
  SettingOutlined,
  ReloadOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { StudioView } from '../studio/ViewSwitcher';

const { Text } = Typography;

interface StudioSidebarProps {
  activeView: StudioView;
  onViewChange: (view: StudioView) => void;
  onGenerate: () => void;
  onValidate: () => void;
  onDeploy: () => void;
  onViewCost: () => void;
  onOpenSettings: () => void;
  onResetSession: () => void;
  onOpenDocs: () => void;
  estimatedCost: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type MenuItem = Required<MenuProps>['items'][number];

export function StudioSidebar({
  activeView,
  onViewChange,
  onGenerate,
  onValidate,
  onDeploy,
  onViewCost,
  onOpenSettings,
  onResetSession,
  onOpenDocs,
  estimatedCost,
  collapsed,
  onToggleCollapse,
}: StudioSidebarProps): ReactNode {
  const { mode, preset } = useTheme();
  const isDark = mode === 'dark';

  const navItems: MenuItem[] = [
    { type: 'group', label: collapsed ? null : 'Navigate', children: [
      { key: 'chat',        icon: <MessageOutlined />,     label: 'Chat',        onClick: () => onViewChange('chat') },
      { key: 'agents',      icon: <TeamOutlined />,        label: 'Agents',      onClick: () => onViewChange('agents') },
      { key: 'deployments', icon: <CloudServerOutlined />, label: 'Deploy',      onClick: () => onViewChange('deployments') },
      { key: 'logs',        icon: <FileTextOutlined />,    label: 'Logs',        onClick: () => onViewChange('logs') },
    ]},
    { type: 'divider' },
    { type: 'group', label: collapsed ? null : 'Actions', children: [
      { key: 'generate',  icon: <FormatPainterOutlined />,    label: 'Generate',  onClick: onGenerate },
      { key: 'validate',  icon: <SafetyCertificateOutlined />, label: 'Validate', onClick: onValidate },
      { key: 'deploy',    icon: <RocketOutlined />,           label: 'Deploy',    onClick: onDeploy },
      { key: 'view-cost', icon: <BarChartOutlined />,         label: 'View Cost', onClick: onViewCost },
    ]},
    { type: 'divider' },
    { type: 'group', label: collapsed ? null : 'Tools', children: [
      { key: 'settings', icon: <SettingOutlined />,  label: 'Settings', onClick: onOpenSettings },
      { key: 'reset',    icon: <ReloadOutlined />,   label: 'Reset',    onClick: onResetSession },
      { key: 'docs',     icon: <BookOutlined />,     label: 'Docs',     onClick: onOpenDocs },
    ]},
  ];

  return (
    <nav
      aria-label="Studio navigation"
      className="studio-sidebar-desktop"
      style={{
        width: collapsed ? 56 : 200,
        minWidth: collapsed ? 56 : 200,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        background: isDark ? '#111111' : '#fafafa',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes hm-logo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 4px ${preset.colorPrimary}66); }
          50%       { opacity: 0.85; transform: scale(1.08); filter: drop-shadow(0 0 10px ${preset.colorPrimary}cc); }
        }
        @keyframes hm-logo-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hm-sidebar-logo {
          animation: hm-logo-pulse 3s ease-in-out infinite;
          cursor: pointer;
        }
        .hm-sidebar-logo:hover {
          animation: hm-logo-spin-slow 1.2s linear infinite;
        }
      `}</style>

      {/* Logo + brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        padding: collapsed ? '14px 0' : '14px 16px',
        borderBottom: `1px solid ${isDark ? '#1f1f1f' : '#f0f0f0'}`,
        minHeight: 60,
      }}>
        <img
          src="/HM-Logo_only.png"
          alt="HiveMind"
          className="hm-sidebar-logo"
          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && (
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: isDark ? '#e0e0e0' : '#1a1a1a',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            HiveMind
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <div style={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-end',
        padding: '6px 8px 2px',
      }}>
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: isDark ? '#666' : '#999' }}
          />
        </Tooltip>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[activeView]}
          items={navItems}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 13,
          }}
          theme={isDark ? 'dark' : 'light'}
        />
      </div>

      {/* Cost estimate pinned to bottom */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        }}>
          <Text style={{ fontSize: 11, color: isDark ? '#666' : '#aaa', display: 'block', marginBottom: 2 }}>
            Est. Cost
          </Text>
          <Text style={{
            fontSize: 13,
            fontWeight: 600,
            color: preset.colorPrimary,
            fontFamily: 'monospace',
          }}>
            {estimatedCost}
          </Text>
        </div>
      )}
    </nav>
  );
}
