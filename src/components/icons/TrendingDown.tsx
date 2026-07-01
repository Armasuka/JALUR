import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function TrendingDown(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="var(--color-brand-blue)" />
      <polyline points="17 18 23 18 23 12" stroke="var(--color-brand-blue)" />
      <circle cx="1" cy="6" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
