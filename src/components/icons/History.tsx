import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function History(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="var(--color-brand-blue)" />
      <polyline points="3 3 3 8 8 8" stroke="var(--color-brand-blue)" />
      <path d="M12 7v5l4 2" stroke="var(--color-brand-blue)" />
      <circle cx="16" cy="14" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
