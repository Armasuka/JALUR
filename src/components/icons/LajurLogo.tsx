import React from 'react';
import LajurMark from './LajurMark';
import { IconProps } from './types';

interface LajurLogoProps extends IconProps {
  showTagline?: boolean;
  variant?: 'horizontal' | 'stacked';
  /** Use 'light' when placed on a dark/blue background */
  colorScheme?: 'default' | 'light';
}

export default function LajurLogo({
  size = 28,
  showTagline = false,
  variant = 'horizontal',
  colorScheme = 'default',
  className = '',
  ...rest
}: LajurLogoProps) {
  const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
  const fontSize = numSize * 0.85;
  const taglineSize = numSize * 0.4;

  const wordmarkColor = colorScheme === 'light' ? '#ffffff' : 'var(--color-brand-blue)';
  const taglineColor = colorScheme === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--color-on-surface-muted)';

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`} {...rest}>
        <LajurMark size={numSize} variant={colorScheme === 'light' ? 'light' : 'default'} />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: `${fontSize}px`,
            letterSpacing: '-0.04em',
            color: wordmarkColor,
            fontOpticalSizing: 'auto',
            lineHeight: 1,
          }}
        >
          LAJUR
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: `${taglineSize}px`,
              color: taglineColor,
              letterSpacing: '0',
              lineHeight: 1.3,
            }}
          >
            LAPOR JALAN UNTUK RAKYAT
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...rest}>
      <LajurMark size={numSize} variant={colorScheme === 'light' ? 'light' : 'default'} />
      <div className="flex flex-col">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: `${fontSize}px`,
            letterSpacing: '-0.04em',
            color: wordmarkColor,
            fontOpticalSizing: 'auto',
            lineHeight: 1,
          }}
        >
          LAJUR
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: `${taglineSize}px`,
              color: taglineColor,
              letterSpacing: '0',
              lineHeight: 1.3,
              marginTop: '2px',
            }}
          >
            LAPOR JALAN UNTUK RAKYAT
          </span>
        )}
      </div>
    </div>
  );
}
