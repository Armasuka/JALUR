import React from 'react';
import { IconProps } from './types';

interface BaseIconProps extends IconProps {
  children: React.ReactNode;
}

export default function BaseIcon({
  size = 24,
  strokeWidth = 2,
  className = '',
  children,
  'aria-label': ariaLabel,
  ...rest
}: BaseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      {...rest}
    >
      {children}
    </svg>
  );
}
