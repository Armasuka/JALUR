import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function LogOut(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="var(--color-brand-blue)" />
      <polyline points="16 17 21 12 16 7" stroke="var(--color-brand-blue)" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="var(--color-brand-blue)" />
      <circle cx="21" cy="12" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
