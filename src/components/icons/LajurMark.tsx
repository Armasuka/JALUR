import React from 'react';
import { IconProps } from './types';

interface LajurMarkProps extends IconProps {
  /** Use 'light' when placed on a dark/blue background — strokes become white */
  variant?: 'default' | 'light';
}

export default function LajurMark({ size = 24, className = '', variant = 'default', 'aria-label': ariaLabel, ...rest }: LajurMarkProps) {
  const strokeColor = variant === 'light' ? '#ffffff' : 'var(--color-brand-blue)';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label={ariaLabel || 'LAJUR logo mark'}
      role="img"
      {...rest}
    >
      {/* J-Road body: thick J-shape */}
      <path
        d="M18 4 L18 20 Q18 26 12 26 Q6 26 6 20"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Yellow dashed center line */}
      <path
        d="M18 6 L18 20 Q18 24 12 24 Q8 24 8 20"
        stroke="var(--color-brand-yellow)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        fill="none"
      />
      {/* Pin dot at top */}
      <circle
        cx="18"
        cy="4"
        r="2.5"
        fill="var(--color-brand-yellow)"
      />
    </svg>
  );
}
