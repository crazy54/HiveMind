import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { StudioPage } from './pages/StudioPage';
import { LandingPage } from './pages/LandingPage';
import { DocsLayout } from './pages/DocsLayout';

function AppContent(): ReactNode {
  const { antdTheme, mode } = useTheme();

  return (
    <ConfigProvider theme={antdTheme}>
      <div
        style={{
          height: '100%',
          background: mode === 'dark' ? '#0a0a0a' : '#f0f2f5',
          color: mode === 'dark' ? '#e0e0e0' : '#1a1a1a',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 400,
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/studio/*" element={<StudioPage />} />
            <Route path="/docs/*" element={<DocsLayout />} />
            <Route path="*" element={<Navigate to="/studio" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ConfigProvider>
  );
}

export function App(): ReactNode {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
