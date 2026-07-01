import React from 'react';
import JalurMark from './JalurMark';
import { IconProps } from './types';

interface JalurLogoProps extends IconProps {
  showTagline?: boolean;
  variant?: 'horizontal' | 'stacked';
  /** Use 'light' when placed on a dark/blue background */
  colorScheme?: 'default' | 'light';
}

export default function JalurLogo({
  size = 28,
  showTagline = false,
  variant = 'horizontal',
  colorScheme = 'default',
  className = '',
  ...rest
}: JalurLogoProps) {
  const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
  const fontSize = numSize * 0.85;
  const taglineSize = numSize * 0.4;

  const wordmarkColor = colorScheme === 'light' ? '#ffffff' : 'var(--color-brand-blue)';
  const taglineColor = colorScheme === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--color-on-surface-muted)';

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`} {...rest}>
        <JalurMark size={numSize} variant={colorScheme === 'light' ? 'light' : 'default'} />
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
          JALUR
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
            Jalan Lapor Untuk Rakyat
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...rest}>
      <JalurMark size={numSize} variant={colorScheme === 'light' ? 'light' : 'default'} />
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
          JALUR
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
            Jalan Lapor Untuk Rakyat
          </span>
        )}
      </div>
    </div>
  );
}
