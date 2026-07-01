import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function MapIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke="var(--color-brand-blue)" />
      <line x1="8" y1="2" x2="8" y2="18" stroke="var(--color-brand-blue)" />
      <line x1="16" y1="6" x2="16" y2="22" stroke="var(--color-brand-blue)" />
      <line x1="8" y1="10" x2="16" y2="14" stroke="var(--color-brand-yellow)" strokeWidth="1.5" strokeDasharray="2 2" />
    </BaseIcon>
  );
}
