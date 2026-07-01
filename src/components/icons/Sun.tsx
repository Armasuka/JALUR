import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Sun(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" />
    </BaseIcon>
  );
}