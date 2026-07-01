import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '20px', rounded = '12px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="tile p-7 space-y-4">
      <Skeleton width="40%" height="12px" rounded="6px" />
      <Skeleton width="60%" height="48px" rounded="12px" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" rounded="12px" />
          <div className="space-y-2 flex-1">
            <Skeleton width="120px" height="13px" rounded="6px" />
            <Skeleton width="180px" height="11px" rounded="6px" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><Skeleton width="100px" height="14px" rounded="6px" /></td>
      <td className="px-6 py-4"><Skeleton width="50px" height="24px" rounded="9999px" /></td>
      <td className="px-6 py-4"><Skeleton width="70px" height="24px" rounded="9999px" /></td>
      <td className="px-6 py-4"><Skeleton width="32px" height="32px" rounded="12px" /></td>
    </tr>
  );
}

export function SkeletonMap() {
  return (
    <div className="w-full h-full flex items-center justify-center relative" style={{ background: 'var(--color-surface)' }}>
      <div className="absolute inset-0 skeleton" style={{ borderRadius: 0 }} />
      <div className="relative z-10 text-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand-blue)' }} />
        <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Memuat peta...</span>
      </div>
    </div>
  );
}

export function SkeletonStatBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="tile text-center py-4 px-3 space-y-2">
          <Skeleton width="60px" height="28px" rounded="8px" className="mx-auto" />
          <Skeleton width="80px" height="10px" rounded="4px" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}
