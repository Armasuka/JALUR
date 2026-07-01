import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ChevronRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="9 18 15 12 9 6" stroke="var(--color-brand-blue)" />
    </BaseIcon>
  );
}
