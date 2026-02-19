import { Button, Tooltip, Drawer } from 'antd';
import type { ReactNode } from 'react';
import {
  SettingOutlined,
  ApiOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

interface LeftIconRailProps {
  onOpenSettings: () => void;
  onOpenApiConfig: () => void;
  onResetSession: () => void;
  onOpenLogs: () => void;
  mobileDrawerOpen?: boolean;
  onMobileDrawerClose?: () => void;
}

function RailButtons({ onOpenSettings, onOpenApiConfig, onResetSession, onOpenLogs }: Pick<LeftIconRailProps, 'onOpenSettings' | 'onOpenApiConfig' | 'onResetSession' | 'onOpenLogs'>): ReactNode {
  return (
    <>
      <Tooltip title="Settings" placement="right">
        <Button type="text" icon={<SettingOutlined />} aria-label="Settings" onClick={onOpenSettings} />
      </Tooltip>
      <Tooltip title="API Configuration" placement="right">
        <Button type="text" icon={<ApiOutlined />} aria-label="API Configuration" onClick={onOpenApiConfig} />
      </Tooltip>
      <Tooltip title="View Logs" placement="right">
        <Button type="text" icon={<FileTextOutlined />} aria-label="View Logs" onClick={onOpenLogs} />
      </Tooltip>
      <Tooltip title="Reset Session" placement="right">
        <Button type="text" icon={<ReloadOutlined />} aria-label="Reset Session" onClick={onResetSession} />
      </Tooltip>
    </>
  );
}

export function LeftIconRail({
  onOpenSettings,
  onOpenApiConfig,
  onResetSession,
  onOpenLogs,
  mobileDrawerOpen = false,
  onMobileDrawerClose,
}: LeftIconRailProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <>
      {/* Desktop icon rail */}
      <nav
        aria-label="Studio tools"
        className="studio-icon-rail-desktop"
        style={{
          width: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '16px 0',
          borderRight: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
          background: isDark ? '#141414' : '#fafafa',
        }}
      >
        <RailButtons
          onOpenSettings={onOpenSettings}
          onOpenApiConfig={onOpenApiConfig}
          onResetSession={onResetSession}
          onOpenLogs={onOpenLogs}
        />
      </nav>

      {/* Mobile hamburger drawer — collapses icon rail below 768px */}
      <Drawer
        title="Studio Tools"
        placement="left"
        open={mobileDrawerOpen}
        onClose={onMobileDrawerClose}
        width={240}
        styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8, padding: 16 } }}
      >
        <nav aria-label="Studio tools">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <RailButtons
              onOpenSettings={() => { onMobileDrawerClose?.(); onOpenSettings(); }}
              onOpenApiConfig={() => { onMobileDrawerClose?.(); onOpenApiConfig(); }}
              onResetSession={() => { onMobileDrawerClose?.(); onResetSession(); }}
              onOpenLogs={() => { onMobileDrawerClose?.(); onOpenLogs(); }}
            />
          </div>
        </nav>
      </Drawer>
    </>
  );
}
