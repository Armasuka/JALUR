import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ShieldAlert(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--color-brand-blue)" />
      <line x1="12" y1="8" x2="12" y2="12" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="15" r="0.8" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
