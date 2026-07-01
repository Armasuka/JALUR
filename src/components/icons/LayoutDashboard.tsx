import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function LayoutDashboard(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" stroke="var(--color-brand-blue)" />
      <rect x="14" y="3" width="7" height="5" rx="1" stroke="var(--color-brand-blue)" />
      <rect x="14" y="12" width="7" height="9" rx="1" stroke="var(--color-brand-blue)" />
      <rect x="3" y="16" width="7" height="5" rx="1" stroke="var(--color-brand-blue)" />
      <circle cx="17.5" cy="5.5" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
