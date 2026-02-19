import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Drawer } from 'antd';
import { TopBar } from '../components/layout/TopBar';
import { StudioSidebar } from '../components/layout/StudioSidebar';
import { ChatView } from '../components/studio/ChatView';
import { AgentsView } from '../components/studio/AgentsView';
import { DeploymentsView } from '../components/studio/DeploymentsView';
import { LogsView } from '../components/studio/LogsView';
import { UserSettingsPanel } from '../components/settings/UserSettingsPanel';
import { useTheme } from '../contexts/ThemeContext';
import type { StudioView } from '../components/studio/ViewSwitcher';

const VALID_VIEWS: StudioView[] = ['agents', 'chat', 'deployments', 'logs'];

function parseViewFromPath(view?: string): StudioView {
  if (view && VALID_VIEWS.includes(view as StudioView)) return view as StudioView;
  return 'chat';
}

export function StudioPage(): ReactNode {
  const { '*': splat } = useParams();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [activeView, setActiveView] = useState<StudioView>(() => parseViewFromPath(splat));
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Allow child components to open settings via custom event
  useEffect(() => {
    const handler = () => setSettingsVisible(true);
    window.addEventListener('hivemind:open-settings', handler);
    return () => window.removeEventListener('hivemind:open-settings', handler);
  }, []);

  const handleViewChange = useCallback((view: StudioView) => {
    setActiveView(view);
    navigate(`/studio/${view}`, { replace: true });
    setMobileSidebarOpen(false);
  }, [navigate]);

  const handleSelectAgent = useCallback(() => {
    handleViewChange('chat');
  }, [handleViewChange]);

  const handleStartNewDeployment = useCallback(() => {
    handleViewChange('chat');
  }, [handleViewChange]);

  function renderActiveView(): ReactNode {
    switch (activeView) {
      case 'agents':      return <AgentsView onSelectAgent={handleSelectAgent} />;
      case 'chat':        return <ChatView />;
      case 'deployments': return <DeploymentsView onStartNewDeployment={handleStartNewDeployment} />;
      case 'logs':        return <LogsView />;
    }
  }

  const sidebarProps = {
    activeView,
    onViewChange: handleViewChange,
    onGenerate:     () => { /* TODO */ },
    onValidate:     () => { /* TODO */ },
    onDeploy:       () => { /* TODO */ },
    onViewCost:     () => { /* TODO */ },
    onOpenSettings: () => setSettingsVisible(true),
    onResetSession: () => { /* TODO */ },
    onOpenDocs:     () => navigate('/docs'),
    estimatedCost:  '$0.00/mo',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: isDark ? '#0a0a0a' : '#f0f2f5',
    }}>
      <TopBar
        onOpenSettings={() => setSettingsVisible(true)}
        onOpenDocs={() => navigate('/docs')}
        onHamburgerClick={() => setMobileSidebarOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop sidebar */}
        <div className="studio-sidebar-desktop-wrapper">
          <StudioSidebar
            {...sidebarProps}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          />
        </div>

        {/* Mobile sidebar drawer */}
        <Drawer
          placement="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          width={220}
          styles={{ body: { padding: 0 }, header: { display: 'none' } }}
          className="studio-mobile-sidebar-drawer"
        >
          <StudioSidebar
            {...sidebarProps}
            collapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
          />
        </Drawer>

        <main
          role="main"
          style={{ flex: 1, overflow: 'auto', position: 'relative' }}
        >
          <div key={activeView} style={{ animation: 'viewFadeIn 200ms ease-out' }}>
            {renderActiveView()}
          </div>
        </main>
      </div>

      <UserSettingsPanel visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <style>{`
        @keyframes viewFadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .studio-sidebar-desktop-wrapper { display: none; }
        }
        @media (min-width: 769px) {
          .studio-hamburger-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
