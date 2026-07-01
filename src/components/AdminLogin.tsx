import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from './icons';
import { JalurLogo } from './icons';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@kemang.go.id' && password === 'admin123') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface-cream)' }}>
      {/* Left: Brand Panel */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-14 relative overflow-hidden" style={{ background: 'var(--color-brand-blue)' }}>
        {/* Decorative shapes */}
        <div className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full" style={{ background: 'rgba(250,204,21,0.08)' }} />
        <div className="absolute -left-20 -bottom-20 w-[300px] h-[300px] rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        
        <div className="relative z-10 flex items-center gap-3">
          <JalurLogo size={36} colorScheme="light" />
        </div>

        <div className="relative z-10">
          <span className="eyebrow !text-brand-yellow mb-6 inline-block">Portal Administrasi</span>
          <h1 className="display-serif text-5xl lg:text-6xl text-white mb-5" style={{ lineHeight: 1.0 }}>
            Pantau wilayahmu,<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-yellow)' }}>satu laporan dalam satu waktu.</em>
          </h1>
          <p className="text-base leading-relaxed max-w-[380px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Akses panel pengawasan untuk meninjau, memprioritaskan, dan menyelesaikan laporan warga di Kecamatan Kemang.
          </p>
        </div>

        <span className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          © 2026 JALUR · Jalan Lapor Untuk Rakyat
        </span>
      </div>

      {/* Right: Form Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 max-w-[560px]">
        <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm font-medium" style={{ color: 'var(--color-on-surface-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-brand-blue)' }}>←</span>
          Kembali ke beranda
        </button>

        <h2 className="display-serif text-4xl mb-2.5">
          Masuk ke<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>portal admin.</em>
        </h2>
        <p className="text-base mb-9 max-w-[380px] leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>
          Khusus untuk perangkat desa dan staf Seksi Pengawasan Kecamatan Kemang.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-2xl text-sm font-semibold" style={{ background: '#fef2f2', color: 'var(--color-danger)', border: '1px solid #fecaca' }}>
              Email atau password salah. Coba lagi.
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-on-surface)' }}>Email admin</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kemang.go.id"
                className="input-base pl-12"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-on-surface)' }}>Kata sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••"
                className="input-base pl-12"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-base">
            Masuk Portal
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}>→</span>
          </button>

          <div className="text-center">
            <button type="button" onClick={onBack} className="text-sm font-semibold transition-colors" style={{ color: 'var(--color-on-surface-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Bukan Admin? Kembali ke Beranda
            </button>
          </div>

          <div className="text-xs p-3.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', color: 'var(--color-on-surface-muted)' }}>
            <strong style={{ color: 'var(--color-on-surface)' }}>Demo:</strong> Gunakan{' '}
            <code className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--color-surface-cream)', color: 'var(--color-brand-blue)', fontFamily: 'var(--font-mono)' }}>admin@kemang.go.id</code> /{' '}
            <code className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--color-surface-cream)', color: 'var(--color-brand-blue)', fontFamily: 'var(--font-mono)' }}>admin123</code>
          </div>
        </form>
      </div>
    </div>
  );
}
