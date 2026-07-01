import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Scale(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v18" stroke="currentColor" />
      <path d="M5 7l7-4 7 4" stroke="currentColor" />
      <path d="M5 7l7 10 7-10" stroke="currentColor" />
      <circle cx="5" cy="17" r="2" stroke="currentColor" />
      <circle cx="19" cy="17" r="2" stroke="currentColor" />
    </BaseIcon>
  );
}