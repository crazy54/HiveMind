import { Menu } from 'antd';
import type { ReactNode } from 'react';
import {
  RocketOutlined,
  MessageOutlined,
  TeamOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { key: '/studio', icon: <RocketOutlined />, label: 'Studio' },
  { key: '/studio/agents', icon: <TeamOutlined />, label: 'Agents' },
  { key: '/studio/chat', icon: <MessageOutlined />, label: 'Chat' },
  { key: '/studio/deployments', icon: <CloudServerOutlined />, label: 'Deployments' },
];

export function NavigationBar(): ReactNode {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.key))?.key ?? '/studio';

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[selectedKey]}
      items={NAV_ITEMS}
      onClick={({ key }) => navigate(key)}
      style={{ flex: 1, border: 'none', background: 'transparent' }}
    />
  );
}
