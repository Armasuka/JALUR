import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function Ruler(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2 12h2m4 0h2m4 0h2m4 0h2m4 0h2" stroke="currentColor" />
      <path d="M2 12v8m20-8v8M6 17h2m4-5h2m4-5h2" stroke="currentColor" />
    </BaseIcon>
  );
}