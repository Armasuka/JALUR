import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Loader2(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="3" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
