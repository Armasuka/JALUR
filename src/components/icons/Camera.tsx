import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Camera(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="currentColor" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" />
    </BaseIcon>
  );
}
