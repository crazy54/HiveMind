import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { LeftIconRail } from './LeftIconRail';
import { BottomDock } from './BottomDock';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

/**
 * Feature: studio-v2-overhaul, Property 19: ARIA labels on icon-only buttons
 *
 * For any icon-only button rendered in the left icon rail or bottom dock,
 * the button element SHALL have a non-empty aria-label attribute that
 * describes the button's action.
 *
 * **Validates: Requirements 13.5**
 */
describe('Property 19: ARIA labels on icon-only buttons', () => {
  it('every button in LeftIconRail has a non-empty aria-label', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const handlers = {
          onOpenSettings: vi.fn(),
          onOpenApiConfig: vi.fn(),
          onResetSession: vi.fn(),
          onOpenLogs: vi.fn(),
        };

        const { unmount } = render(<LeftIconRail {...handlers} />, { wrapper });

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        for (const button of buttons) {
          const label = button.getAttribute('aria-label');
          expect(label).toBeTruthy();
          expect(typeof label).toBe('string');
          expect(label!.trim().length).toBeGreaterThan(0);
        }

        unmount();
      }),
      { numRuns: 10 },
    );
  }, 30_000);

  it('every button in BottomDock has a non-empty aria-label for any cost string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map((s) => `$${s}`),
        (estimatedCost) => {
          const handlers = {
            estimatedCost,
            onGenerate: vi.fn(),
            onValidate: vi.fn(),
            onDeploy: vi.fn(),
            onViewCost: vi.fn(),
          };

          const { unmount } = render(<BottomDock {...handlers} />, { wrapper });

          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThan(0);

          for (const button of buttons) {
            const label = button.getAttribute('aria-label');
            expect(label).toBeTruthy();
            expect(typeof label).toBe('string');
            expect(label!.trim().length).toBeGreaterThan(0);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  }, 30_000);

  it('LeftIconRail aria-labels describe the button actions', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const handlers = {
          onOpenSettings: vi.fn(),
          onOpenApiConfig: vi.fn(),
          onResetSession: vi.fn(),
          onOpenLogs: vi.fn(),
        };

        const { unmount } = render(<LeftIconRail {...handlers} />, { wrapper });

        const expectedLabels = ['Settings', 'API Configuration', 'View Logs', 'Reset Session'];
        for (const label of expectedLabels) {
          const button = screen.getByLabelText(label);
          expect(button).toBeInTheDocument();
          expect(button.tagName === 'BUTTON' || button.closest('button')).toBeTruthy();
        }

        unmount();
      }),
      { numRuns: 10 },
    );
  }, 30_000);

  it('BottomDock aria-labels describe the button actions', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map((s) => `$${s}`),
        (estimatedCost) => {
          const handlers = {
            estimatedCost,
            onGenerate: vi.fn(),
            onValidate: vi.fn(),
            onDeploy: vi.fn(),
            onViewCost: vi.fn(),
          };

          const { unmount } = render(<BottomDock {...handlers} />, { wrapper });

          const expectedLabels = [
            'Generate template',
            'Validate template',
            'Deploy infrastructure',
            'View cost estimate',
          ];
          for (const label of expectedLabels) {
            const button = screen.getByLabelText(label);
            expect(button).toBeInTheDocument();
            expect(button.tagName === 'BUTTON' || button.closest('button')).toBeTruthy();
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  }, 30_000);
});
