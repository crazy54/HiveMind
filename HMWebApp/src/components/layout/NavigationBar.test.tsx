import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { NavigationBar } from './NavigationBar';

function renderWithRouter(initialPath = '/studio') {
  return render(
    <ConfigProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <NavigationBar />
      </MemoryRouter>
    </ConfigProvider>,
  );
}

describe('NavigationBar', () => {
  it('renders all navigation items', () => {
    renderWithRouter();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
  });

  it('renders as antd Menu component', () => {
    const { container } = renderWithRouter();
    const menu = container.querySelector('.ant-menu');
    expect(menu).toBeInTheDocument();
  });

  it('renders in horizontal mode', () => {
    const { container } = renderWithRouter();
    const menu = container.querySelector('.ant-menu-horizontal');
    expect(menu).toBeInTheDocument();
  });
});
