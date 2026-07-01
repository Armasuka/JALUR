import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function HardHat(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" stroke="var(--color-brand-blue)" />
      <path d="M10 15V6a2 2 0 0 1 4 0v9" stroke="var(--color-brand-blue)" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" stroke="var(--color-brand-blue)" />
      <line x1="7" y1="15" x2="7" y2="18" stroke="var(--color-brand-yellow)" strokeWidth="1.5" />
      <line x1="17" y1="15" x2="17" y2="18" stroke="var(--color-brand-yellow)" strokeWidth="1.5" />
    </BaseIcon>
  );
}
