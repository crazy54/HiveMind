import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hivemind-tutorial-completed';

export interface UseTutorialReturn {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  next: () => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function persistCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch { /* noop */ }
}

function clearCompleted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}

const TOTAL_STEPS = 7;

export function useTutorial(): UseTutorialReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(readCompleted);

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const previous = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const skip = useCallback(() => {
    persistCompleted();
    setIsCompleted(true);
  }, []);

  const complete = useCallback(() => {
    persistCompleted();
    setIsCompleted(true);
  }, []);

  const reset = useCallback(() => {
    clearCompleted();
    setIsCompleted(false);
    setCurrentStep(0);
  }, []);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    isCompleted,
    next,
    previous,
    skip,
    complete,
    reset,
  };
}

export { STORAGE_KEY, TOTAL_STEPS };
