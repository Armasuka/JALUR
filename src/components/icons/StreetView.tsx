import React from 'react';
import BaseIcon from './BaseIcon';
import { IconProps } from './types';

export default function StreetView(props: IconProps) {
  return (
    <BaseIcon {...props}>
      {/* Camera body */}
      <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" />
      {/* Lens */}
      <circle cx="12" cy="14" r="4" stroke="currentColor" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
      {/* Flash/indicator */}
      <rect x="16" y="10" width="2" height="2" rx="0.5" fill="currentColor" />
      {/* Viewfinder */}
      <path d="M8 5L12 2L16 5" stroke="currentColor" fill="none" />
      {/* Base stand hint */}
      <line x1="8" y1="20" x2="8" y2="22" stroke="currentColor" />
      <line x1="16" y1="20" x2="16" y2="22" stroke="currentColor" />
    </BaseIcon>
  );
}
