import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoAnimation } from '../components/landing/LogoAnimation';
import { TaglineAnimation } from '../components/landing/TaglineAnimation';
import { TutorialWalkthrough } from '../components/landing/TutorialWalkthrough';
import { useTutorial } from '../hooks/useTutorial';
import { useTheme } from '../contexts/ThemeContext';

type LandingPhase = 'logo' | 'tagline' | 'tutorial';

export function LandingPage(): ReactNode {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const tutorial = useTutorial();
  const [phase, setPhase] = useState<LandingPhase>('logo');

  // If tutorial already completed, redirect immediately
  if (tutorial.isCompleted) {
    // Use effect-free redirect via Navigate would be cleaner,
    // but we need this to work with the hook state
    navigate('/studio', { replace: true });
    return null;
  }

  const handleLogoComplete = useCallback(() => {
    setPhase('tagline');
  }, []);

  const handleTaglineComplete = useCallback(() => {
    setPhase('tutorial');
  }, []);

  const handleSkip = useCallback(() => {
    tutorial.skip();
    navigate('/studio', { replace: true });
  }, [tutorial, navigate]);

  const handleComplete = useCallback(() => {
    tutorial.complete();
    navigate('/studio', { replace: true });
  }, [tutorial, navigate]);

  return (
    <div
      data-testid="landing-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: isDark ? '#0a0a0a' : '#f0f2f5',
        padding: 24,
        gap: 32,
      }}
    >
      {phase === 'logo' && (
        <LogoAnimation onComplete={handleLogoComplete} />
      )}
      {phase === 'tagline' && (
        <>
          <img
            src="/Hivemind-Logo-TRANS.png"
            alt="HiveMind Logo"
            style={{ width: 120, height: 120, objectFit: 'contain' }}
          />
          <TaglineAnimation onComplete={handleTaglineComplete} />
        </>
      )}
      {phase === 'tutorial' && (
        <TutorialWalkthrough
          currentStep={tutorial.currentStep}
          totalSteps={tutorial.totalSteps}
          onNext={tutorial.next}
          onPrevious={tutorial.previous}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
