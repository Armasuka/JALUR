import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Send(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="22" y1="2" x2="11" y2="13" stroke="var(--color-brand-blue)" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="var(--color-brand-blue)" />
      <circle cx="11" cy="13" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
