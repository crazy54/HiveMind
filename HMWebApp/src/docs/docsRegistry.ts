import type { ReactNode } from 'react';

export interface DocPage {
  key: string;
  title: string;
  path: string;
  keywords: string[];
  content: () => Promise<{ default: () => ReactNode }>;
}

export interface DocSection {
  title: string;
  icon: string;
  pages: DocPage[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Getting Started',
    icon: '🚀',
    pages: [
      {
        key: 'getting-started',
        title: 'Getting Started',
        path: 'getting-started',
        keywords: ['introduction', 'overview', 'quick start', 'setup', 'hivemind', 'studio'],
        content: () => import('./GettingStarted'),
      },
    ],
  },
  {
    title: 'Agents',
    icon: '🤖',
    pages: [
      {
        key: 'agents-overview',
        title: 'Agents Overview',
        path: 'agents/overview',
        keywords: ['agents', 'recon', 'conductor', 'janitor', 'ai', 'team', 'capabilities'],
        content: () => import('./agents/AgentsOverview'),
      },
    ],
  },
  {
    title: 'Chat',
    icon: '💬',
    pages: [
      {
        key: 'chat-usage',
        title: 'Chat Interface',
        path: 'chat/usage',
        keywords: ['chat', 'message', 'streaming', 'agent', 'conversation', 'llm', 'websocket'],
        content: () => import('./chat/ChatUsage'),
      },
    ],
  },
  {
    title: 'Infrastructure',
    icon: '🏗️',
    pages: [
      {
        key: 'infra-design',
        title: 'Infrastructure Design',
        path: 'infrastructure/design',
        keywords: ['infrastructure', 'architecture', 'template', 'cloudformation', 'cost', 'aws', 'design'],
        content: () => import('./infrastructure/InfraDesign'),
      },
    ],
  },
  {
    title: 'Deployments',
    icon: '📦',
    pages: [
      {
        key: 'deployment-management',
        title: 'Deployment Management',
        path: 'deployments/management',
        keywords: ['deployment', 'deploy', 'stack', 'events', 'status', 'progress', 'cloudformation'],
        content: () => import('./deployments/DeploymentManagement'),
      },
    ],
  },
  {
    title: 'Logs',
    icon: '📋',
    pages: [
      {
        key: 'log-browsing',
        title: 'Log Browsing',
        path: 'logs/browsing',
        keywords: ['logs', 'cloudwatch', 'filter', 'streaming', 'real-time', 'monitoring'],
        content: () => import('./logs/LogBrowsing'),
      },
    ],
  },
  {
    title: 'Themes',
    icon: '🎨',
    pages: [
      {
        key: 'theme-customization',
        title: 'Theme Customization',
        path: 'themes/customization',
        keywords: ['theme', 'preset', 'dark', 'light', 'color', 'customization', 'appearance'],
        content: () => import('./themes/ThemeCustomization'),
      },
    ],
  },
  {
    title: 'API',
    icon: '🔌',
    pages: [
      {
        key: 'api-configuration',
        title: 'API Configuration',
        path: 'api/configuration',
        keywords: ['api', 'bedrock', 'claude', 'chatgpt', 'provider', 'configuration', 'settings', 'key'],
        content: () => import('./api/ApiConfiguration'),
      },
    ],
  },
];

export function getAllPages(): DocPage[] {
  return DOC_SECTIONS.flatMap((section) => section.pages);
}

export function searchDocs(query: string): DocPage[] {
  if (!query.trim()) return getAllPages();
  const terms = query.toLowerCase().split(/\s+/);
  return getAllPages().filter((page) => {
    const searchable = [page.title, ...page.keywords].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function findPageByPath(path: string): DocPage | undefined {
  return getAllPages().find((page) => page.path === path);
}
