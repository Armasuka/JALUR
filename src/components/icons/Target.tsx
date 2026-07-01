import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Target(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </BaseIcon>
  );
}