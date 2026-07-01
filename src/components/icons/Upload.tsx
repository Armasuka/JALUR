import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Upload(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-brand-blue)" />
      <polyline points="17 8 12 3 7 8" stroke="var(--color-brand-blue)" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="3" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
