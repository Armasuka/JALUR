import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function CheckCircle(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" stroke="var(--color-brand-blue)" />
      <polyline points="9 12 11.5 14.5 16 9.5" stroke="var(--color-brand-yellow)" strokeWidth="2.5" />
    </BaseIcon>
  );
}
