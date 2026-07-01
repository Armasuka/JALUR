import { AlertTriangle } from './icons';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({ message, onRetry }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-surface-cream)' }}>
      <div className="tile max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-brand-yellow-50)', border: '1px solid #fde68a' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-brand-yellow-700)' }} />
          </div>
        </div>

        <h2
          className="display-serif text-2xl mb-2"
          style={{ color: 'var(--color-on-surface)' }}
        >
          Oops! Ada Kesalahan
        </h2>

        <p className="text-sm mb-8" style={{ color: 'var(--color-on-surface-muted)' }}>
          {message || 'Terjadi kesalahan saat memuat komponen. Silakan coba lagi.'}
        </p>

        {onRetry && (
          <button className="btn-primary mx-auto" onClick={onRetry}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}
