import React from 'react';
import { ArrowRight } from './icons';

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional secondary text below main message */
  subtext?: string;
}

export default function EmptyState({ message, action, subtext }: EmptyStateProps) {
  return (
    <div className="py-16 md:py-20 text-center space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>
        {message}
      </p>
      {subtext && (
        <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)', opacity: 0.7 }}>
          {subtext}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold mx-auto"
          style={{ color: 'var(--color-brand-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {action.label} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}