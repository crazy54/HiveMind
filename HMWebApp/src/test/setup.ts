import '@testing-library/jest-dom';

// Mock window.matchMedia for antd responsive components (Row, Col, Grid)
// antd's responsiveObserver calls matchMedia().addListener and destructures { matches }
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
