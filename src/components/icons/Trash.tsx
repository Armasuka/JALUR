import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Trash(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="3 6 5 6 21 6" stroke="var(--color-brand-blue)" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="var(--color-brand-blue)" />
      <path d="M10 11v6M14 11v6" stroke="var(--color-brand-blue)" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="var(--color-brand-blue)" />
    </BaseIcon>
  );
}
