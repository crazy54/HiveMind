import { useState, useEffect, useCallback, Suspense, lazy, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Menu, Input, Button, Tooltip, Skeleton, Typography, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { DOC_SECTIONS, findPageByPath, searchDocs, type DocPage } from '../docs/docsRegistry';

const { Sider, Content } = Layout;
const { Title } = Typography;

type LazyComponent = React.LazyExoticComponent<() => ReactNode>;

function buildMenuItems(filteredPages: Set<string>) {
  return DOC_SECTIONS.map((section) => {
    const visiblePages = section.pages.filter((p) => filteredPages.has(p.key));
    if (visiblePages.length === 0) return null;
    return {
      key: `section-${section.title}`,
      label: (
        <span>
          <span style={{ marginRight: 8 }}>{section.icon}</span>
          {section.title}
        </span>
      ),
      children: visiblePages.map((page) => ({
        key: page.path,
        label: page.title,
      })),
    };
  }).filter(Boolean);
}

export function DocsLayout(): ReactNode {
  const { '*': splat } = useParams();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activePath, setActivePath] = useState<string>(splat || 'getting-started');
  const [PageComponent, setPageComponent] = useState<LazyComponent | null>(null);

  const filteredPages = searchDocs(searchQuery);
  const filteredKeys = new Set(filteredPages.map((p) => p.key));

  const loadPage = useCallback((page: DocPage) => {
    const LazyPage = lazy(page.content as () => Promise<{ default: React.ComponentType }>) as LazyComponent;
    setPageComponent(() => LazyPage);
  }, []);

  useEffect(() => {
    const page = findPageByPath(activePath);
    if (page) {
      loadPage(page);
    } else {
      // Default to first page
      const firstPage = filteredPages[0];
      if (firstPage) {
        setActivePath(firstPage.path);
        loadPage(firstPage);
      }
    }
  }, [activePath, loadPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMenuSelect = useCallback(({ key }: { key: string }) => {
    setActivePath(key);
    navigate(`/docs/${key}`, { replace: true });
  }, [navigate]);

  const menuItems = buildMenuItems(filteredKeys);

  // Find open section keys for the active path
  const openKeys = DOC_SECTIONS
    .filter((s) => s.pages.some((p) => p.path === activePath))
    .map((s) => `section-${s.title}`);

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#0a0a0a' : '#f0f2f5' }}>
      {/* Top bar */}
      <Layout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          height: 56,
          background: isDark ? '#141414' : '#ffffff',
          borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Tooltip title="Back to Studio">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/studio')}
            aria-label="Back to Studio"
            style={{ marginRight: 16 }}
          />
        </Tooltip>
        <Title level={4} style={{ margin: 0, flex: 1 }}>
          📖 HiveMind Documentation
        </Title>
      </Layout.Header>

      <Layout style={{ background: 'transparent' }}>
        {/* Sidebar */}
        <Sider
          width={280}
          style={{
            background: isDark ? '#141414' : '#ffffff',
            borderRight: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}`,
            overflow: 'auto',
            height: 'calc(100vh - 56px)',
            position: 'sticky',
            top: 56,
          }}
        >
          <div style={{ padding: '16px 16px 8px' }}>
            <Input
              placeholder="Search docs..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              aria-label="Search documentation"
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activePath]}
            defaultOpenKeys={openKeys}
            items={menuItems as NonNullable<typeof menuItems>}
            onSelect={handleMenuSelect}
            style={{
              border: 'none',
              background: 'transparent',
            }}
          />
        </Sider>

        {/* Content */}
        <Content
          role="main"
          style={{
            padding: 32,
            maxWidth: 800,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
            {PageComponent ? (
              <PageComponent />
            ) : (
              <Empty description="Select a documentation page from the sidebar" />
            )}
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
