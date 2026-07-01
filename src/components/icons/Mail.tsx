import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Mail(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="var(--color-brand-blue)" />
      <polyline points="22 7 12 13 2 7" stroke="var(--color-brand-blue)" />
      <circle cx="20" cy="6" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
