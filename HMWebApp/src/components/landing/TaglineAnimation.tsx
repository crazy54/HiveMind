import { useState, useEffect, type ReactNode } from 'react';
import { Typography } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

const TAGLINE = 'Agentic-AI DevOps Studio';

export interface TaglineAnimationProps {
  onComplete: () => void;
}

export function TaglineAnimation({ onComplete }: TaglineAnimationProps): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < TAGLINE.length) {
      const timer = setTimeout(() => {
        setDisplayedText(TAGLINE.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, 60);
      return () => clearTimeout(timer);
    } else {
      const completeTimer = setTimeout(onComplete, 400);
      return () => clearTimeout(completeTimer);
    }
  }, [charIndex, onComplete]);

  return (
    <div data-testid="tagline-animation" style={{ textAlign: 'center' }}>
      <Title
        level={2}
        style={{
          color: isDark ? '#e0e0e0' : '#1a1a1a',
          fontWeight: 300,
          letterSpacing: 1,
          margin: 0,
          minHeight: '1.5em',
        }}
      >
        {displayedText}
        <span
          style={{
            borderRight: '2px solid currentColor',
            animation: 'blink 0.7s step-end infinite',
            marginLeft: 2,
          }}
        />
      </Title>
      <style>{`
        @keyframes blink {
          50% { border-color: transparent; }
        }
      `}</style>
    </div>
  );
}

export { TAGLINE };
