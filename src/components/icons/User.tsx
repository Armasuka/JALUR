import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function User(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="7" r="4" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="7" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
