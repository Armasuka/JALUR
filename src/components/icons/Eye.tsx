import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Eye(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="12" r="3" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="12" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
