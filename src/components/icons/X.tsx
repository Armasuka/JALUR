import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function X(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" stroke="var(--color-brand-blue)" />
      <line x1="6" y1="6" x2="18" y2="18" stroke="var(--color-brand-blue)" />
    </BaseIcon>
  );
}
