import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';
import { Report } from '../types';
import { ChevronLeft, ArrowRight, MapPin, Filter } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import kemangData from '../kemangPolygon.json';
import HeatmapLayer from './HeatmapLayer';
import { AnimatedNumber } from '../lib/useCountUp';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface PublicMapPageProps {
  onBack: () => void;
  onEnter: (role: 'warga' | 'admin') => void;
}

type SeverityFilter = 'all' | 'parah' | 'sedang' | 'ringan';
type StatusFilter = 'all' | 'pending' | 'reviewed' | 'diteruskan';

function getSeverityLabel(score: number): string {
  if (score <= 39) return 'parah';
  if (score <= 69) return 'sedang';
  return 'ringan';
}

function getSeverityColor(score: number): string {
  if (score <= 39) return '#ef4444';
  if (score <= 69) return '#facc15';
  return '#22c55e';
}

export default function PublicMapPage({ onBack, onEnter }: PublicMapPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [mapMode, setMapMode] = useState<'markers' | 'heatmap'>('markers');

  const defaultPosition: [number, number] = [-6.4952, 106.7423];

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then((data: Report[]) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    if (severityFilter !== 'all' && getSeverityLabel(r.rdsScore) !== severityFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const heatPoints = useMemo(() => {
    return filtered.map(r => {
      const intensity = Math.max(0.1, (100 - r.rdsScore) / 100);
      return [r.latitude, r.longitude, intensity] as [number, number, number];
    });
  }, [filtered]);

  const stats = {
    total: reports.length,
    parah: reports.filter(r => r.rdsScore <= 39).length,
    sedang: reports.filter(r => r.rdsScore > 39 && r.rdsScore <= 69).length,
    ringan: reports.filter(r => r.rdsScore > 69).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen" style={{ background: 'var(--color-surface-cream)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50" style={{
        background: 'rgba(251,249,244,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--color-brand-blue)]" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-muted)' }}>
            <ChevronLeft size={18} /> Kembali ke Beranda
          </button>
          <button onClick={() => onEnter('warga')} className="btn-primary text-sm px-5 py-2.5">
            Lapor Sekarang <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span className="eyebrow" style={{ color: 'var(--color-brand-blue)' }}>Wilayah Pantauan</span>
          <h1 className="display-serif mt-2 mb-2" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1 }}>
            Peta Sebaran<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>Kerusakan Jalan</em>
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-on-surface-muted)', maxWidth: 520 }}>
            Visualisasi realtime seluruh laporan kerusakan jalan di Kecamatan Kemang, Bogor. Data terbuka untuk transparansi publik.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total Laporan', value: stats.total, color: 'var(--color-brand-blue)' },
            { label: 'Parah', value: stats.parah, color: '#ef4444' },
            { label: 'Sedang', value: stats.sedang, color: '#facc15' },
            { label: 'Ringan', value: stats.ringan, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="tile text-center py-4 px-3">
              <AnimatedNumber value={s.value} className="display-serif block text-2xl" style={{ color: s.color }} />
              <span className="eyebrow mt-1 block" style={{ fontSize: '9px' }}>{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Filter toggle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
            style={{
              background: showFilters ? 'var(--color-brand-blue)' : 'var(--color-surface)',
              color: showFilters ? '#fff' : 'var(--color-on-surface)',
              border: `1px solid ${showFilters ? 'var(--color-brand-blue)' : 'var(--color-border)'}`,
              cursor: 'pointer',
            }}
          >
            <Filter size={14} /> Filter {severityFilter !== 'all' || statusFilter !== 'all' ? `(aktif)` : ''}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mt-3 p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <span className="eyebrow block mb-2">Severity</span>
                    <div className="flex gap-2">
                      {(['all', 'parah', 'sedang', 'ringan'] as SeverityFilter[]).map(f => (
                        <button key={f} onClick={() => setSeverityFilter(f)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                          style={{
                            background: severityFilter === f ? 'var(--color-brand-blue)' : 'var(--color-surface-cream)',
                            color: severityFilter === f ? '#fff' : 'var(--color-on-surface-muted)',
                            border: '1px solid ' + (severityFilter === f ? 'var(--color-brand-blue)' : 'var(--color-border)'),
                            cursor: 'pointer', textTransform: 'capitalize',
                          }}
                        >{f === 'all' ? 'Semua' : f}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="eyebrow block mb-2">Status</span>
                    <div className="flex gap-2">
                      {(['all', 'pending', 'reviewed', 'diteruskan'] as StatusFilter[]).map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                          style={{
                            background: statusFilter === f ? 'var(--color-brand-blue)' : 'var(--color-surface-cream)',
                            color: statusFilter === f ? '#fff' : 'var(--color-on-surface-muted)',
                            border: '1px solid ' + (statusFilter === f ? 'var(--color-brand-blue)' : 'var(--color-border)'),
                            cursor: 'pointer', textTransform: 'capitalize',
                          }}
                        >{f === 'all' ? 'Semua' : f}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
          className="rounded-[28px] overflow-hidden" style={{ border: '1px solid var(--color-border)', height: '65vh', minHeight: '450px' }}
        >
          {loading ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand-blue)' }} />
                <span className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Memuat peta...</span>
              </div>
            </div>
          ) : (
            <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true} className="z-0 w-full h-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON data={kemangData as any} style={{ color: '#1e3a8a', weight: 3, fillColor: '#facc15', fillOpacity: 0.12 }} />
              {mapMode === 'heatmap' && heatPoints.length > 0 && (
                <HeatmapLayer points={heatPoints} />
              )}
              {mapMode === 'markers' && filtered.map(report => (
                <CircleMarker
                  key={report.id}
                  center={[report.latitude, report.longitude]}
                  radius={8}
                  pathOptions={{
                    fillColor: getSeverityColor(report.rdsScore),
                    fillOpacity: 0.85,
                    color: '#fff',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-3 space-y-2" style={{ minWidth: '200px' }}>
                      {(() => {
                        let firstImg = report.imageUrl;
                        try { const parsed = JSON.parse(firstImg); if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0]; } catch {}
                        return firstImg ? <img src={firstImg} alt="Damage" className="w-full h-28 object-cover" style={{ borderRadius: '12px' }} /> : null;
                      })()}
                      <div>
                        <span className="text-xs font-bold" style={{ color: getSeverityColor(report.rdsScore) }}>
                          RDS: {report.rdsScore} — {getSeverityLabel(report.rdsScore).toUpperCase()}
                        </span>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
                          {report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm') : 'Baru saja'}
                        </p>
                        {report.deskripsi && (
                          <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface)' }}>{report.deskripsi}</p>
                        )}
                      </div>
                      <div className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full inline-block"
                        style={{
                          background: report.status === 'diteruskan' ? '#f0fdf4' : report.status === 'reviewed' ? 'var(--color-brand-blue-50)' : 'var(--color-brand-yellow-50)',
                          color: report.status === 'diteruskan' ? '#15803d' : report.status === 'reviewed' ? 'var(--color-brand-blue)' : 'var(--color-brand-yellow-700)',
                        }}
                      >{report.status}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </motion.div>

        {/* Map Mode Toggle + Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 px-2">
          <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {(['markers', 'heatmap'] as const).map(mode => (
              <button key={mode} onClick={() => setMapMode(mode)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all capitalize"
                style={{
                  background: mapMode === mode ? 'var(--color-brand-blue)' : 'transparent',
                  color: mapMode === mode ? '#fff' : 'var(--color-on-surface-muted)',
                  border: 'none', cursor: 'pointer',
                }}
              >{mode === 'markers' ? 'Titik' : 'Heatmap'}</button>
            ))}
          </div>
          <span className="eyebrow" style={{ fontSize: '9px' }}>Legenda:</span>
          {[
            { label: 'Parah (0-39)', color: '#ef4444' },
            { label: 'Sedang (40-69)', color: '#facc15' },
            { label: 'Ringan (70-100)', color: '#22c55e' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
          <span className="text-xs ml-auto" style={{ color: 'var(--color-on-surface-muted)' }}>
            Menampilkan {filtered.length} dari {reports.length} laporan
          </span>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="tile-ribbon flex flex-col md:flex-row items-center justify-between gap-6 mt-10"
        >
          <div>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow)' }}>Lihat Kerusakan di Sekitar Anda?</span>
            <h3 className="display-serif text-2xl md:text-3xl text-white">Laporkan dan bantu perbaiki jalan.</h3>
          </div>
          <button onClick={() => onEnter('warga')} className="btn-primary text-sm px-6 py-3.5 shrink-0">
            Mulai Lapor <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
