import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Filter(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="var(--color-brand-blue)" />
      <circle cx="18" cy="5" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
