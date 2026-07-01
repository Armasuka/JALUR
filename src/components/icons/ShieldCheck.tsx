import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function ShieldCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--color-brand-blue)" />
      <polyline points="9 12 11.5 14.5 16 9.5" stroke="var(--color-brand-yellow)" strokeWidth="2.5" />
    </BaseIcon>
  );
}
