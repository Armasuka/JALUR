import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function MapPin(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="10" r="3" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="10" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
