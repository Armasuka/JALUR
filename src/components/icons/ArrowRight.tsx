import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ArrowRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="5" y1="12" x2="19" y2="12" stroke="var(--color-brand-blue)" />
      <polyline points="12 5 19 12 12 19" stroke="var(--color-brand-blue)" />
      <circle cx="19" cy="12" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
