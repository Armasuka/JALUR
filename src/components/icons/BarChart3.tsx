import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function BarChart3(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 3v18h18" stroke="var(--color-brand-blue)" />
      <rect x="7" y="13" width="3" height="7" rx="0.5" stroke="var(--color-brand-blue)" fill="none" />
      <rect x="14" y="8" width="3" height="12" rx="0.5" stroke="var(--color-brand-blue)" fill="none" />
      <circle cx="19" cy="5" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
