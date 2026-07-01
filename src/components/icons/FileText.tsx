import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function FileText(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" />
      <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" />
    </BaseIcon>
  );
}
