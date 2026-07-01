import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ExternalLink(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="var(--color-brand-blue)" />
      <polyline points="15 3 21 3 21 9" stroke="var(--color-brand-blue)" />
      <line x1="10" y1="14" x2="21" y2="3" stroke="var(--color-brand-blue)" />
      <circle cx="21" cy="3" r="1" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
