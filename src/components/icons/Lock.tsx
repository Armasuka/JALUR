import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Lock(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="var(--color-brand-blue)" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="16" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
