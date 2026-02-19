import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, render, act, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { useTutorial, STORAGE_KEY, TOTAL_STEPS } from '../../hooks/useTutorial';
import { TUTORIAL_STEPS } from './TutorialWalkthrough';
import { TutorialStep } from './TutorialStep';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type { ReactNode } from 'react';

function themeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

/**
 * Feature: studio-v2-overhaul, Property 16: Landing page renders if and only if tutorial not completed
 *
 * For any localStorage state, the Landing_Page SHALL render when
 * localStorage.getItem('hivemind-tutorial-completed') is null or absent,
 * and SHALL NOT render (redirecting to Studio instead) when the flag is present.
 *
 * **Validates: Requirements 16.1, 16.9**
 */
describe('Property 16: Landing page renders if and only if tutorial not completed', () => {
  it('isCompleted is false when localStorage key is absent', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        localStorage.clear();
        localStorage.removeItem(STORAGE_KEY);

        const { result } = renderHook(() => useTutorial());
        expect(result.current.isCompleted).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('isCompleted is true when localStorage key is present with any string value', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEY, value);

        const { result } = renderHook(() => useTutorial());
        // readCompleted checks !== null, so any stored value (even empty string) means completed
        expect(result.current.isCompleted).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('isCompleted biconditional: true iff key present, false iff key absent', () => {
    const flagPresentArb = fc.boolean();

    fc.assert(
      fc.property(flagPresentArb, (flagPresent) => {
        localStorage.clear();
        if (flagPresent) {
          localStorage.setItem(STORAGE_KEY, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }

        const { result } = renderHook(() => useTutorial());
        expect(result.current.isCompleted).toBe(flagPresent);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: studio-v2-overhaul, Property 17: Skip tutorial sets completion flag from any step
 *
 * For any tutorial step number (1 through 7), clicking "Skip Tutorial" SHALL set
 * localStorage.getItem('hivemind-tutorial-completed') to a truthy value and navigate
 * to the Studio.
 *
 * **Validates: Requirements 16.6**
 */
describe('Property 17: Skip tutorial sets completion flag from any step', () => {
  it('skip() sets localStorage flag from any step (0-indexed: 0 through 6)', () => {
    // Steps are 0-indexed internally (0..6), representing tutorial steps 1..7
    const stepArb = fc.integer({ min: 0, max: TOTAL_STEPS - 1 });

    fc.assert(
      fc.property(stepArb, (targetStep) => {
        localStorage.clear();

        const { result } = renderHook(() => useTutorial());

        // Navigate to the target step
        for (let i = 0; i < targetStep; i++) {
          act(() => result.current.next());
        }
        expect(result.current.currentStep).toBe(targetStep);

        // Skip from this step
        act(() => result.current.skip());

        // Verify localStorage flag is set and truthy
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).not.toBeNull();
        expect(stored).toBeTruthy();

        // Verify hook state reflects completion
        expect(result.current.isCompleted).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 18: Tutorial step indicator accuracy
 *
 * For any tutorial step N (1 through 7), the step indicator SHALL display the
 * current step as N and the total steps as 7. The indicator values SHALL satisfy
 * 1 <= currentStep <= totalSteps and totalSteps === TUTORIAL_STEPS.length.
 *
 * **Validates: Requirements 16.8**
 */
describe('Property 18: Tutorial step indicator accuracy', () => {
  it('step indicator aria-label shows correct step N+1 of totalSteps for any step', () => {
    // stepNumber is 0-indexed (0..6), displayed as 1-indexed in aria-label
    const stepArb = fc.integer({ min: 0, max: TUTORIAL_STEPS.length - 1 });

    fc.assert(
      fc.property(stepArb, (stepNumber) => {
        const step = TUTORIAL_STEPS[stepNumber];
        const totalSteps = TUTORIAL_STEPS.length;

        const { unmount } = render(
          <TutorialStep
            title={step.title}
            description={step.description}
            icon={step.icon}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />,
          { wrapper: themeWrapper },
        );

        // The aria-label uses 1-indexed step: "Step {N+1} of {total}"
        const displayedStep = stepNumber + 1;
        const indicator = screen.getByLabelText(`Step ${displayedStep} of ${totalSteps}`);
        expect(indicator).toBeInTheDocument();

        // Verify invariants: 1 <= displayedStep <= totalSteps
        expect(displayedStep).toBeGreaterThanOrEqual(1);
        expect(displayedStep).toBeLessThanOrEqual(totalSteps);

        // Verify totalSteps matches TUTORIAL_STEPS.length
        expect(totalSteps).toBe(TUTORIAL_STEPS.length);
        expect(totalSteps).toBe(TOTAL_STEPS);

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('step indicator renders correct number of dot elements', () => {
    const stepArb = fc.integer({ min: 0, max: TUTORIAL_STEPS.length - 1 });

    fc.assert(
      fc.property(stepArb, (stepNumber) => {
        const step = TUTORIAL_STEPS[stepNumber];
        const totalSteps = TUTORIAL_STEPS.length;

        const { unmount } = render(
          <TutorialStep
            title={step.title}
            description={step.description}
            icon={step.icon}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />,
          { wrapper: themeWrapper },
        );

        // The indicator container has totalSteps child dot divs
        const indicator = screen.getByLabelText(`Step ${stepNumber + 1} of ${totalSteps}`);
        expect(indicator.children.length).toBe(totalSteps);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
