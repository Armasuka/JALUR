import React, { useMemo, useState } from 'react';
const ease = [0.22, 1, 0.36, 1] as const;
import { motion } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle, BrainCircuit, ArrowRight, TrendingDown, ShieldAlert } from './icons';
import { AnimatedNumber } from '../lib/useCountUp';
import { format } from 'date-fns';
import { Report } from '../types';

interface PriorityViewProps {
  reports: Report[];
  onStatusChange: (id: number, status: string) => void;
  onNavigateHistory?: () => void;
}

// Severity level berdasarkan RDS score
function getSeverity(rds: number): { label: string; color: string; bg: string; ring: string; rank: 'KRITIS' | 'PARAH' | 'SEDANG' | 'RINGAN' } {
  if (rds < 25)  return { label: 'Kritis',  color: '#dc2626', bg: '#fef2f2', ring: '#fca5a5', rank: 'KRITIS' };
  if (rds < 40)  return { label: 'Parah',   color: '#ef4444', bg: '#fff1f0', ring: '#fca5a5', rank: 'PARAH'  };
  if (rds < 70)  return { label: 'Sedang',  color: '#f59e0b', bg: '#fffbeb', ring: '#fde68a', rank: 'SEDANG' };
  return         { label: 'Ringan', color: '#22c55e', bg: '#f0fdf4', ring: '#86efac', rank: 'RINGAN' };
}

// RDS Gauge bar mini
function RDSGauge({ score }: { score: number }) {
  const pct = score; // 0–100
  const { color } = getSeverity(score);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-7 text-right" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {score}
      </span>
    </div>
  );
}

export default function PriorityView({ reports, onStatusChange, onNavigateHistory }: PriorityViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  // Hanya laporan yg sudah dianalisis AI, diurutkan dari RDS terkecil (paling parah = prioritas tertinggi)
  const prioritized = useMemo(() => {
    return reports
      .filter(r => r.rdsScore > 0 && r.status !== 'diteruskan')
      .filter(r => filter === 'all' || r.status === filter)
      .sort((a, b) => a.rdsScore - b.rdsScore);
  }, [reports, filter]);

  const unanalyzed = useMemo(() => reports.filter(r => r.rdsScore === 0 && r.status !== 'diteruskan'), [reports]);
  const diteruskan   = useMemo(() => reports.filter(r => r.status === 'diteruskan'), [reports]);

  // Summary stats
  const kritis = prioritized.filter(r => r.rdsScore < 25).length;
  const parah  = prioritized.filter(r => r.rdsScore >= 25 && r.rdsScore < 40).length;
  const sedang = prioritized.filter(r => r.rdsScore >= 40 && r.rdsScore < 70).length;

  const summaryCards = [
    { label: 'Perlu Ditangani',  value: prioritized.length, color: 'var(--color-brand-blue)',  bg: 'var(--color-brand-blue-50)',  icon: ShieldAlert },
    { label: 'Kritis / Parah',   value: kritis + parah,     color: '#dc2626',                  bg: '#fef2f2',                     icon: AlertTriangle },
    { label: 'Sedang',           value: sedang,             color: '#f59e0b',                  bg: '#fffbeb',                     icon: TrendingDown  },
    { label: 'Belum Dianalisis', value: unanalyzed.length,  color: 'var(--color-on-surface-muted)', bg: 'var(--color-surface-cream)', icon: BrainCircuit  },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="display-serif text-4xl md:text-5xl">Prioritas penanganan.</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>
          Laporan diurutkan berdasarkan <strong>RDS terkecil</strong> — tingkat kerusakan tertinggi ditangani pertama.
        </p>
      </motion.div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="tile flex flex-col justify-between"
            style={{ minHeight: '110px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">{c.label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <AnimatedNumber
              value={c.value}
              className="display-serif"
              style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 300, letterSpacing: '-0.04em', color: c.color, lineHeight: 1 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Legend + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Severity legend */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Kritis (< 25)',  color: '#dc2626' },
            { label: 'Parah (25–39)',  color: '#ef4444' },
            { label: 'Sedang (40–69)', color: '#f59e0b' },
            { label: 'Ringan (≥ 70)',  color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {(['all', 'pending', 'reviewed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === f
                ? { background: 'var(--color-brand-blue)', color: '#fff' }
                : { background: 'transparent', color: 'var(--color-on-surface-muted)' }}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : 'Reviewed'}
            </button>
          ))}
        </div>
      </div>

      {/* Priority List */}
      {prioritized.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="tile py-16 text-center space-y-3"
        >
          <div style={{ color: 'var(--color-success)' }}><CheckCircle className="w-10 h-10 mx-auto" /></div>
          <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {filter !== 'all' ? 'Tidak ada laporan dengan filter ini.' : 'Semua laporan sudah tertangani atau belum dianalisis.'}
          </p>
          {unanalyzed.length > 0 && (
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              Ada {unanalyzed.length} laporan yang belum dianalisis AI.
            </p>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {prioritized.map((report, index) => {
            const severity = getSeverity(report.rdsScore);
            const detCount = Array.isArray(report.detections) ? report.detections.length : 0;
            let firstImg = report.imageUrl;
            try { const p = JSON.parse(firstImg); if (Array.isArray(p) && p.length > 0) firstImg = p[0]; } catch {}

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className="card overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-stretch">
                  {/* Priority rank number — colored strip */}
                  <div
                    className="flex items-center justify-center w-full md:w-16 py-3 md:py-0 shrink-0"
                    style={{ background: severity.bg }}
                  >
                    <div className="flex flex-row md:flex-col items-center gap-2 md:gap-1">
                      <span
                        className="display-serif font-bold"
                        style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: severity.color, lineHeight: 1 }}
                      >
                        #{index + 1}
                      </span>
                      <span
                        className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ background: severity.color, color: '#fff' }}
                      >
                        {severity.rank}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="hidden md:block w-20 shrink-0 relative" style={{ background: '#0f172a' }}>
                    {firstImg && (
                      <img src={firstImg} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4 md:p-5 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                          {report.kodeUnik || `Laporan #${report.id}`}
                        </p>
                        {report.address && (
                          <p className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[260px]">{report.address}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--color-on-surface-muted)' }}>
                        {report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy') : ''}
                      </span>
                    </div>

                    {/* RDS Gauge */}
                    <RDSGauge score={report.rdsScore} />

                    {/* Bottom row: detections + status + action */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <div className="flex items-center gap-3">
                        {detCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div style={{ color: 'var(--color-brand-blue)' }}><BrainCircuit className="w-3 h-3" /></div>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-on-surface-muted)' }}>
                              {detCount} deteksi AI
                            </span>
                          </div>
                        )}
                        {/* Jenis kerusakan */}
                        {Array.isArray(report.detections) && report.detections.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {[...new Set(report.detections.map((d) => d.class))].map((cls) => (
                              <span
                                key={cls}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                                style={{
                                  background: cls === 'pothole' ? '#fef2f2' : cls === 'alligator crack' ? '#fffbeb' : '#eff6ff',
                                  color: cls === 'pothole' ? '#dc2626' : cls === 'alligator crack' ? '#d97706' : '#2563eb',
                                }}
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status selector */}
                      <select
                        value={report.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => onStatusChange(report.id, e.target.value)}
                        className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg outline-none cursor-pointer"
                        style={{
                          background: report.status === 'pending' ? '#fefce8' : report.status === 'reviewed' ? 'var(--color-brand-blue-50)' : '#f0fdf4',
                          color:      report.status === 'pending' ? '#a16207'  : report.status === 'reviewed' ? 'var(--color-brand-blue)'     : '#15803d',
                          border: '1px solid',
                          borderColor: report.status === 'pending' ? '#fde68a' : report.status === 'reviewed' ? 'var(--color-brand-blue-100)' : '#bbf7d0',
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="diteruskan">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unanalyzed notice */}
      {unanalyzed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="tile p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: 'var(--color-brand-blue-50)', border: '1px solid var(--color-brand-blue-100)' }}
        >
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-brand-blue)' }}>
              {unanalyzed.length} laporan belum dianalisis AI
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
              Laporan tanpa RDS score tidak dapat diprioritaskan. Jalankan analisis AI dari halaman Riwayat.
            </p>
          </div>
          {onNavigateHistory && (
            <button
              onClick={onNavigateHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-colors"
              style={{ background: 'var(--color-brand-blue)', color: '#fff' }}
            >
              Buka Riwayat <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Resolved summary */}
      {diteruskan.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="tile p-5 flex items-center gap-4"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <div style={{ color: '#22c55e' }}><CheckCircle className="w-8 h-8 shrink-0" /></div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#15803d' }}>
              {diteruskan.length} laporan telah selesai diperbaiki
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#16a34a' }}>
              Laporan berstatus <em>diteruskan</em> tidak ditampilkan dalam daftar prioritas.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
