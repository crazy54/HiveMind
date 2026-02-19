import { useState, useEffect, type ReactNode } from 'react';

export interface LogoAnimationProps {
  onComplete: () => void;
}

export function LogoAnimation({ onComplete }: LogoAnimationProps): ReactNode {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false);
      onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      data-testid="logo-animation"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <img
        src="/Hivemind-Logo-TRANS.png"
        alt="HiveMind Logo"
        style={{
          width: 160,
          height: 160,
          objectFit: 'contain',
          animation: animating ? 'logoFadeScale 1.5s ease-out forwards' : undefined,
          opacity: animating ? 0 : 1,
          transform: animating ? undefined : 'scale(1)',
        }}
      />
      <style>{`
        @keyframes logoFadeScale {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
