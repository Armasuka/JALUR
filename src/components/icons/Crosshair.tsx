import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Crosshair(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" />
      <line x1="22" y1="12" x2="18" y2="12" stroke="currentColor" />
      <line x1="6" y1="12" x2="2" y2="12" stroke="currentColor" />
      <line x1="12" y1="6" x2="12" y2="2" stroke="currentColor" />
      <line x1="12" y1="22" x2="12" y2="18" stroke="currentColor" />
    </BaseIcon>
  );
}
