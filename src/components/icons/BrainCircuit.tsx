import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function BrainCircuit(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24" stroke="var(--color-brand-blue)" />
      <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1-1.32 4.24" stroke="var(--color-brand-blue)" />
      <path d="M15.7 13.4a2.5 2.5 0 0 1-.84 4.79 2.5 2.5 0 0 1-2.86 1.27" stroke="var(--color-brand-blue)" />
      <path d="M8.3 13.4a2.5 2.5 0 0 0 .84 4.79 2.5 2.5 0 0 0 2.86 1.27" stroke="var(--color-brand-blue)" />
      <path d="M12 4.5v15" stroke="var(--color-brand-blue)" />
      <circle cx="12" cy="12" r="1.5" fill="var(--color-brand-yellow)" stroke="none" />
    </BaseIcon>
  );
}
