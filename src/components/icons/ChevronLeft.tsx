import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ChevronLeft(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="15 18 9 12 15 6" stroke="var(--color-brand-blue)" />
    </BaseIcon>
  );
}
