import { Layout, Button, Space, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import {
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  BookOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { Header } = Layout;

interface TopBarProps {
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  onHamburgerClick?: () => void;
}

export function TopBar({ onOpenSettings, onOpenDocs, onHamburgerClick }: TopBarProps): ReactNode {
  const { mode, toggleMode, preset } = useTheme();
  const isDark = mode === 'dark';

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: 56,
        lineHeight: '56px',
        background: isDark ? '#141414' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Accent gradient bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${preset.colorPrimary}, ${preset.colorPrimary}88)`,
        }}
      />

      {/* Hamburger button — visible only on mobile via CSS */}
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={onHamburgerClick}
        aria-label="Open navigation menu"
        className="studio-hamburger-btn"
        style={{ marginRight: 8 }}
      />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 24 }}>
        <img
          src="/Hivemind-Logo-TRANS.png"
          alt="HiveMind Logo"
          style={{ height: 32, width: 'auto' }}
        />
        <span
          className="studio-logo-text"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: isDark ? '#e0e0e0' : '#1a1a1a',
          }}
        >
          HiveMind Studio
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <Space size={8}>
        <Tooltip title="Documentation">
          <Button
            type="text"
            icon={<BookOutlined />}
            onClick={onOpenDocs}
            aria-label="Open documentation"
          />
        </Tooltip>
        <Tooltip title="Settings">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            aria-label="Open settings"
          />
        </Tooltip>
        <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleMode}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          />
        </Tooltip>
      </Space>
    </Header>
  );
}
