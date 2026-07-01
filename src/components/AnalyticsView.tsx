import React, { useMemo } from 'react';
const ease = [0.22, 1, 0.36, 1] as const;
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingDown } from './icons';
import EmptyState from './EmptyState';
import { AnimatedNumber } from '../lib/useCountUp';
import { Report } from '../types';

interface AnalyticsViewProps {
  reports: Report[];
}

export default function AnalyticsView({ reports }: AnalyticsViewProps) {
  const analyzed = useMemo(() => reports.filter(r => r.rdsScore > 0), [reports]);

  // Status distribution
  const statusCounts = useMemo(() => ({
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    diteruskan: reports.filter(r => r.status === 'diteruskan').length,
  }), [reports]);

  // RDS distribution buckets
  const rdsBuckets = useMemo(() => ({
    parah: analyzed.filter(r => r.rdsScore < 40).length,
    sedang: analyzed.filter(r => r.rdsScore >= 40 && r.rdsScore < 70).length,
    ringan: analyzed.filter(r => r.rdsScore >= 70).length,
  }), [analyzed]);

  // Detection class breakdown
  const detectionClasses = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach(r => {
      if (r.detections && Array.isArray(r.detections)) {
        r.detections.forEach((d) => {
          const cls = d.class || 'unknown';
          map[cls] = (map[cls] || 0) + 1;
        });
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const avgRDS = analyzed.length > 0
    ? Math.round(analyzed.reduce((a, r) => a + r.rdsScore, 0) / analyzed.length)
    : 0;

  const totalDetections = detectionClasses.reduce((a, [, c]) => a + c, 0);

  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="h-7 rounded-full overflow-hidden flex-1" style={{ background: 'var(--color-surface-cream)' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
        transition={{ duration: 0.8, ease }}
        className="h-full rounded-full flex items-center justify-end pr-2"
        style={{ background: color, minWidth: value > 0 ? '24px' : '0px' }}
      >
        {value > 0 && <span className="text-[10px] font-bold text-white">{value}</span>}
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display-serif text-4xl md:text-5xl mb-2">Analisis mendalam.</h2>
        <p className="text-base" style={{ color: 'var(--color-on-surface-muted)' }}>
          Statistik dan distribusi data kerusakan jalan dari {reports.length} laporan.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Laporan', value: reports.length, icon: ShieldAlert },
          { label: 'Sudah Dianalisis', value: analyzed.length, icon: TrendingDown },
          { label: 'Rata-rata RDS', value: avgRDS || '—', icon: AlertTriangle },
          { label: 'Terselesaikan', value: statusCounts.diteruskan, icon: CheckCircle },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="tile flex flex-col justify-between"
            style={{ minHeight: '110px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-brand-blue-50)' }}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <AnimatedNumber value={kpi.value} className="display-serif" style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--color-brand-blue)', lineHeight: 1 }} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="tile space-y-5"
        >
          <span className="eyebrow">Distribusi Status</span>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: statusCounts.pending, color: 'var(--color-brand-yellow)' },
              { label: 'Reviewed', value: statusCounts.reviewed, color: 'var(--color-brand-blue-500)' },
              { label: 'Resolved', value: statusCounts.diteruskan, color: 'var(--color-success)' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-16" style={{ color: 'var(--color-on-surface-muted)' }}>{item.label}</span>
                <Bar value={item.value} max={reports.length} color={item.color} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            {Object.entries(statusCounts).map(([k, v]) => (
              <div key={k} className="text-center flex-1">
                <p className="display-serif text-2xl" style={{ color: 'var(--color-brand-blue)' }}>{v}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>{k}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RDS severity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="tile space-y-5"
        >
          <span className="eyebrow">Tingkat Kerusakan (RDS)</span>
          {analyzed.length > 0 ? (
            <>
              <div className="space-y-3">
                {[
                  { label: 'Parah (<40)', value: rdsBuckets.parah, color: '#ef4444' },
                  { label: 'Sedang (40-70)', value: rdsBuckets.sedang, color: 'var(--color-brand-yellow)' },
                  { label: 'Ringan (>70)', value: rdsBuckets.ringan, color: 'var(--color-success)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold w-24" style={{ color: 'var(--color-on-surface-muted)' }}>{item.label}</span>
                    <Bar value={item.value} max={analyzed.length} color={item.color} />
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: '#f1f5f9' }}>
                  <div className="h-full" style={{ width: '33%', background: '#ef4444', borderRadius: '9999px 0 0 9999px' }} />
                  <div className="h-full" style={{ width: '34%', background: 'var(--color-brand-yellow)' }} />
                  <div className="h-full" style={{ width: '33%', background: 'var(--color-success)', borderRadius: '0 9999px 9999px 0' }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-on-surface-muted)' }}>0</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-brand-blue)' }}>Avg: {avgRDS}</span>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-on-surface-muted)' }}>100</span>
                </div>
              </div>
            </>
          ) : (
            <EmptyState message="Belum ada laporan yang dianalisis AI." subtext="Jalankan analisis AI dari halaman Riwayat." />
          )}
        </motion.div>

        {/* Detection types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="tile space-y-5 lg:col-span-2"
        >
          <span className="eyebrow">Jenis Kerusakan Terdeteksi</span>
          {detectionClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detectionClasses.map(([cls, count], i) => (
                <div key={cls} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: cls === 'pothole' ? '#ef4444' : cls === 'alligator crack' ? '#f59e0b' : '#3b82f6' }} />
                    <span className="text-sm font-semibold capitalize">{cls}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="display-serif text-xl" style={{ color: 'var(--color-brand-blue)' }}>{count}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-on-surface-muted)' }}>
                      ({totalDetections > 0 ? Math.round((count / totalDetections) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Belum ada deteksi AI yang tersedia." subtext="Hasil deteksi akan muncul setelah laporan dianalisis." />
          )}
        </motion.div>
      </div>
    </div>
  );
}
