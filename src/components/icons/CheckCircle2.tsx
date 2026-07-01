import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function CheckCircle2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" stroke="var(--color-brand-blue)" />
      <path d="M9 12l2 2 4-4" stroke="var(--color-brand-yellow)" strokeWidth="2.5" />
    </BaseIcon>
  );
}
