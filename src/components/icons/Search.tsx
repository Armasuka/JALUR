import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Search(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="8" stroke="var(--color-brand-blue)" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="var(--color-brand-blue)" />
      <circle cx="11" cy="11" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
