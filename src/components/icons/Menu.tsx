import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Menu(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="4" x2="20" y1="12" y2="12" stroke="currentColor" />
      <line x1="4" x2="20" y1="6" y2="6" stroke="currentColor" />
      <line x1="4" x2="20" y1="18" y2="18" stroke="currentColor" />
    </BaseIcon>
  );
}
