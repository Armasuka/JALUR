import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ExternalLink, Filter, Search, ArrowRight, BrainCircuit, Loader2, X, MapPin, ChevronLeft, ChevronRight, Download, Trash } from './icons';
import EmptyState from './EmptyState';
import { getStatusColor, getScoreColor } from '../lib/utils';
import { Report } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryListProps {
  reports: Report[];
  isAdmin: boolean;
  onStatusChange: (id: number, status: string) => void;
  onDetect?: (id: number) => Promise<void>;
  onNavigateReport?: () => void;
  onDelete: (id: number) => void;
}

export default function HistoryList({ reports, isAdmin, onStatusChange, onDetect, onNavigateReport, onDelete }: HistoryListProps) {
  const [detectingId, setDetectingId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [imgDims, setImgDims] = useState({w: 1, h: 1});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDetections, setShowDetections] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    if (!showFilterMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu]);



  const handleExportPDF = async (report: Report) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, w, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('JALUR', 15, 20);
    doc.setFontSize(10);
    doc.text('Sistem Pelaporan Kerusakan Jalan', 15, 28);
    doc.setFontSize(12);
    doc.text(report.kodeUnik || 'Laporan', w - 15, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.text(report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm') : '', w - 15, 28, { align: 'right' });
    
    // Body
    let y = 52;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text('Detail Laporan', 15, y); y += 10;
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    const fields = [
      ['Status', report.status === 'pending' ? 'Menunggu' : report.status === 'reviewed' ? 'Ditinjau' : 'Selesai'],
      ['RDS Score', `${report.rdsScore} (${report.rdsScore < 40 ? 'Parah' : report.rdsScore < 70 ? 'Sedang' : 'Ringan'})`],
      ['Koordinat', `${report.latitude}, ${report.longitude}`],
      ['Alamat', report.address || '-'],
      ['Email', report.email || '-'],
      ['Deskripsi', report.deskripsi || '-'],
    ];
    fields.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 15, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(val, w - 65);
      doc.text(lines, 55, y);
      y += lines.length * 5 + 4;
    });
    
    // Detections
    if (report.detections && report.detections.length > 0) {
      y += 5;
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text('Hasil Deteksi AI', 15, y); y += 10;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      report.detections.forEach((det, i) => {
        doc.text(`${i+1}. ${det.class} — ${Math.round(det.confidence * 100)}%`, 15, y);
        y += 7;
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Digenerate otomatis oleh JALUR — Proyek percontohan Kecamatan Kemang, Bogor', w / 2, 285, { align: 'center' });
    
    doc.save(`JALUR_${report.kodeUnik || report.id}.pdf`);
  };

  useEffect(() => {
    setCurrentImgIdx(0);
    setImgDims({w: 1, h: 1});
  }, [selectedReport]);

  const modalImages = useMemo(() => {
    if (!selectedReport?.imageUrl) return [];
    try {
      const parsed = JSON.parse(selectedReport.imageUrl);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    return [selectedReport.imageUrl];
  }, [selectedReport]);

  const handleDetectClick = async (id: number) => {
    if (!onDetect) return;
    setDetectingId(id);
    await onDetect(id);
    setDetectingId(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-status-pending';
      case 'reviewed': return 'badge-status-reviewed';
      case 'dilaporkan': return 'badge-status-dilaporkan';
      case 'dalam_perbaikan': return 'badge-status-dalam-perbaikan';
      case 'perbaikan_selesai': return 'badge-status-selesai';
      case 'ditolak': return 'badge-status-ditolak';
      default: return 'badge-status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'reviewed': return 'Ditinjau';
      case 'dilaporkan': return 'Dilaporkan PU';
      case 'dalam_perbaikan': return 'Perbaikan';
      case 'perbaikan_selesai': return 'Selesai';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  const filteredReports = useMemo(() => {
    let result = reports;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.kodeUnik || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q) ||
        (r.deskripsi || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    return result;
  }, [reports, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="display-serif text-4xl">Riwayat Laporan</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input 
              type="text"
              placeholder="Cari kode, email, alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10 pr-4 py-2 text-xs w-full"
              style={{ minWidth: '180px', maxWidth: '280px' }}
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ 
                background: statusFilter !== 'all' ? 'var(--color-brand-blue-50)' : 'var(--color-surface)', 
                border: `1px solid ${statusFilter !== 'all' ? 'var(--color-brand-blue-100)' : 'var(--color-border)'}` 
              }}
            >
              <Filter className="w-4 h-4" />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 py-2 rounded-2xl z-50" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(15,23,42,0.12)' }}>
                {['all', 'pending', 'reviewed', 'dilaporkan'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-[var(--color-surface-cream)]"
                    style={{ color: statusFilter === s ? 'var(--color-brand-blue)' : 'var(--color-on-surface-muted)', fontWeight: statusFilter === s ? 700 : 500 }}
                  >
                    {s === 'all' ? 'Semua Status' : s === 'pending' ? 'Pending' : s === 'reviewed' ? 'Reviewed' : 'Resolved'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {filteredReports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setSelectedReport(report)}
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid var(--color-border)', background: '#f1f5f9' }}>
                {(() => {
                  let firstImg = report.imageUrl;
                  try {
                    const parsed = JSON.parse(firstImg);
                    if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
                  } catch (e) {}
                  return firstImg ? <img src={firstImg} alt="Damage" className="w-full h-full object-cover" /> : null;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-mono)' }}>{report.kodeUnik || 'Laporan'}</p>
                  {report.rdsScore > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${report.rdsScore < 50 ? 'badge-accent' : ''}`}
                      style={report.rdsScore >= 50 ? { background: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue)' } : {}}
                    >
                      RDS {report.rdsScore}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusBadgeClass(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {report.createdAt ? format(new Date(report.createdAt), 'dd MMM, HH:mm') : '-'}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && report.rdsScore === 0 && (
              <span className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--color-brand-yellow-50)', color: '#92400e' }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI menganalisis...
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="overflow-x-auto card hidden md:block">
        <table className="w-full text-left text-sm">
          <thead style={{ background: 'var(--color-surface-cream)', borderBottom: '1px solid var(--color-border)' }}>
            <tr>
              <th className="px-6 py-4 eyebrow" style={{ fontSize: '11px' }}>Informasi Laporan</th>
              <th className="px-6 py-4 eyebrow" style={{ fontSize: '11px' }}>Waktu</th>
              <th className="px-6 py-4 eyebrow" style={{ fontSize: '11px' }}>RDS Score</th>
              <th className="px-6 py-4 eyebrow" style={{ fontSize: '11px' }}>Status</th>
              <th className="px-6 py-4 eyebrow" style={{ fontSize: '11px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr 
                key={report.id} 
                className="hover:bg-[var(--color-surface-cream)] transition-colors cursor-pointer group"
                style={{ borderBottom: '1px solid var(--color-border)' }}
                onClick={() => setSelectedReport(report)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid var(--color-border)', background: '#f1f5f9' }}>
                      {(() => {
                        let firstImg = report.imageUrl;
                        try {
                          const parsed = JSON.parse(firstImg);
                          if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
                        } catch (e) {}
                        return firstImg ? <img src={firstImg} alt="Damage" className="w-full h-full object-cover" /> : null;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{report.kodeUnik || 'Laporan'}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-surface-cream)', color: 'var(--color-on-surface-muted)' }}>
                          {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                        </span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2 max-w-[250px]" style={{ color: 'var(--color-on-surface-muted)' }} title={report.deskripsi}>
                        {report.deskripsi || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {report.createdAt ? 
                    format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm') 
                    : '-'
                  }
                </td>
                <td className="px-6 py-4" style={{ fontFamily: 'var(--font-mono)' }}>
                  {report.rdsScore === 0 ? (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menganalisis...
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${report.rdsScore < 50 ? 'badge-accent' : ''}`}
                      style={report.rdsScore >= 50 ? { background: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue)' } : {}}
                    >
                      {report.rdsScore}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <select
                      value={report.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onStatusChange(report.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer outline-none ${getStatusBadgeClass(report.status)}`}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="reviewed">Ditinjau</option>
                      <option value="dilaporkan">Dilaporkan ke PU</option>
                    </select>
                  ) : (
                    <span className={getStatusBadgeClass(report.status)}>
                      {report.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:shadow-md"
                      style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}
                      title="Lihat detail"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(report); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:shadow-md"
                        style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}
                        title="Hapus laporan"
                      >
                        <Trash className="w-3.5 h-3.5" style={{ '--color-brand-blue': '#ef4444' } as React.CSSProperties} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        
      {filteredReports.length === 0 && (
        <EmptyState
          message={searchQuery || statusFilter !== 'all' ? 'Tidak ada laporan yang cocok dengan filter.' : 'Belum ada laporan yang tersedia.'}
          action={
            searchQuery || statusFilter !== 'all'
              ? { label: 'Reset Filter', onClick: () => { setSearchQuery(''); setStatusFilter('all'); } }
              : onNavigateReport
                ? { label: 'Mulai Laporkan', onClick: onNavigateReport }
                : undefined
          }
        />
      )}

      {/* ── Delete Confirmation Modal ─────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 z-[110]"
              style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[111] flex items-center justify-center p-4"
            >
              <div
                className="w-full md:w-[420px] rounded-3xl p-6 md:p-8 flex flex-col gap-5"
                style={{ background: 'var(--color-surface-cream)', boxShadow: '0 40px 80px rgba(15,23,42,0.4)' }}
              >
                {/* Icon */}
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
                    <Trash className="w-6 h-6" style={{ '--color-brand-blue': '#ef4444' } as React.CSSProperties} />
                  </div>
                </div>

                {/* Text */}
                <div className="text-center">
                  <h3 className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>
                    Hapus Laporan?
                  </h3>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-on-surface-muted)' }}>
                    Laporan <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{deleteTarget.kodeUnik}</span> akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-on-surface)' }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onDelete(deleteTarget.id);
                      setDeleteTarget(null);
                      if (selectedReport?.id === deleteTarget.id) setSelectedReport(null);
                    }}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-colors"
                    style={{ background: '#ef4444' }}
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ── Review Modal ───────────────────────── */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(8px)" }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-[1080px] h-full md:h-auto md:max-h-[90vh] z-[101] flex flex-col md:flex-row modal-review"
              style={{ background: "var(--color-surface-cream)", boxShadow: "0 40px 80px rgba(15,23,42,0.4)" }}
            >
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 md:top-5 md:right-5 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-colors"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid var(--color-border)' }}
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* LEFT: Image Gallery */}
              <div className="shrink-0 md:w-[52%] relative flex items-center justify-center h-[40vh] md:h-auto" style={{ background: '#0f172a' }}>
                {modalImages.length > 0 && (
                  <div className="relative p-4 md:p-6 flex items-center justify-center w-full h-full">
                    <div className="relative inline-block max-h-full">
                      <img 
                        src={modalImages[currentImgIdx]} 
                        alt="Kerusakan" 
                        className="block max-w-full max-h-[32vh] md:max-h-[80vh] w-auto h-auto object-contain"
                        style={{ borderRadius: '12px' }}
                        onLoad={(e) => setImgDims({w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight})}
                      />
                      
                      {/* Bounding Boxes — positioned relative to the image */}
                      {showDetections && selectedReport.detections?.filter(d => d.image_index === currentImgIdx || d.image_index === undefined).map((det, i) => {
                         const left = (det.bbox.x / imgDims.w) * 100;
                         const top = (det.bbox.y / imgDims.h) * 100;
                         const width = (det.bbox.width / imgDims.w) * 100;
                         const height = (det.bbox.height / imgDims.h) * 100;
                         
                         const catColor = det.class === 'pothole' ? '#ef4444'
                           : det.class === 'alligator crack' ? '#f59e0b'
                           : '#3b82f6';
              
                         return (
                           <div key={i} style={{
                             position: 'absolute',
                             left: `${left}%`,
                             top: `${top}%`,
                             width: `${width}%`,
                             height: `${height}%`,
                             border: `2px solid ${catColor}`,
                             backgroundColor: catColor + '18',
                             borderRadius: '4px',
                             pointerEvents: 'none',
                           }}>
                             <span className="absolute -top-4 left-0 px-1.5 py-0.5 text-[7px] md:text-[8px] font-bold whitespace-nowrap rounded" style={{ 
                               background: catColor,
                               color: '#fff',
                               fontFamily: 'var(--font-sans)'
                             }}>
                               {det.class} {Math.round(det.confidence*100)}%
                             </span>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Gallery Controls */}
                {modalImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImgIdx(p => p > 0 ? p - 1 : modalImages.length - 1)}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentImgIdx(p => p < modalImages.length - 1 ? p + 1 : 0)}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {modalImages.map((_, i) => (
                        <div 
                          key={i} 
                          className="h-[6px] md:h-[7px] rounded-full cursor-pointer transition-all" 
                          style={{ 
                            width: i === currentImgIdx ? '20px' : '6px',
                            background: i === currentImgIdx ? 'var(--color-brand-yellow)' : 'rgba(255,255,255,0.4)' 
                          }}
                          onClick={() => setCurrentImgIdx(i)} 
                        />
                      ))}
                    </div>
                  </>
                )}
              
                {/* Toggle AI detection overlay */}
                {selectedReport.detections && selectedReport.detections.length > 0 && (
                  <button 
                    onClick={() => setShowDetections(!showDetections)}
                    className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-white text-[9px] md:text-[10px] font-bold transition-colors uppercase tracking-widest"
                    style={{ background: showDetections ? 'var(--color-brand-blue)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-brand-yellow)' }} />
                    {showDetections ? 'AI ON' : 'AI OFF'}
                  </button>
                )}
              </div>
              
              {/* RIGHT: Editorial Details */}
              <div className="flex-1 md:w-[48%] p-5 md:p-12 overflow-y-auto custom-scrollbar flex flex-col gap-4 md:gap-6" style={{ background: 'var(--color-surface-cream)' }}>
                {/* Header */}
                <div>
                  <span className="eyebrow">Laporan warga</span>
                  <h2 className="display-serif mt-2" style={{ fontSize: 'clamp(24px, 5vw, 44px)', letterSpacing: '-0.03em', color: 'var(--color-brand-blue)', lineHeight: 1.1, fontFeatureSettings: '"tnum"' }}>
                    {selectedReport.kodeUnik || 'Laporan'}
                  </h2>
                  <span className="text-xs font-medium mt-1 block" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {selectedReport.createdAt ? format(new Date(selectedReport.createdAt), 'dd MMM yyyy, HH:mm') : ''}
                  </span>
                </div>
              
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={getStatusBadgeClass(selectedReport.status)}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                    {selectedReport.status === 'pending' ? 'Menunggu' : selectedReport.status === 'reviewed' ? 'Ditinjau' : 'Selesai'}
                  </span>
                  {selectedReport.rdsScore > 0 && (
                    <span className={`${selectedReport.rdsScore < 50 ? 'badge-accent' : ''}`}
                      style={selectedReport.rdsScore >= 50 ? { 
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '9999px',
                        fontSize: '11px', fontWeight: 700,
                        background: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue)'
                      } : {}}
                    >
                      RDS {selectedReport.rdsScore}
                    </span>
                  )}
                </div>
              
                {/* Description */}
                <div className="pt-3 md:pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="eyebrow mb-2 block">Deskripsi warga</span>
                  {selectedReport.deskripsi ? (
                    <p className="display-serif text-base md:text-lg leading-relaxed" style={{ fontStyle: 'italic' }}>
                      <span style={{ color: 'var(--color-brand-yellow)', fontSize: '20px' }}>"</span>
                      {selectedReport.deskripsi}
                      <span style={{ color: 'var(--color-brand-yellow)', fontSize: '20px' }}>"</span>
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--color-on-surface-muted)' }}>Tidak ada deskripsi tambahan.</p>
                  )}
                </div>
              
                {/* Location */}
                <div className="pt-3 md:pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="eyebrow mb-2 block">Lokasi</span>
                  <div className="flex items-start gap-2 p-3 md:p-3.5 rounded-xl md:rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <MapPin className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-semibold leading-tight mb-1 break-words">{selectedReport.address}</p>
                      <p className="text-[10px] md:text-xs" style={{ color: 'var(--color-on-surface-muted)', fontFamily: 'var(--font-mono)' }}>
                        {selectedReport.latitude}, {selectedReport.longitude}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Detections */}
                {selectedReport.detections && selectedReport.detections.length > 0 && (
                  <div className="pt-3 md:pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span className="eyebrow mb-3 block">Deteksi AI · {selectedReport.detections.length} objek</span>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {selectedReport.detections.map((det, i) => {
                        const catColor = det.class === 'pothole' ? '#ef4444'
                          : det.class === 'alligator crack' ? '#f59e0b'
                          : '#3b82f6'; // linear crack
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style={{ background: catColor }} />
                              <span className="font-semibold text-[10px] md:text-xs capitalize truncate">{det.class}</span>
                            </div>
                            <span className="text-[10px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-full shrink-0" style={{ color: catColor, background: catColor + '15', fontFamily: 'var(--font-mono)' }}>
                              {Math.round(det.confidence * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              
                {/* Status Timeline */}
                <div className="pt-3 md:pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="eyebrow mb-3 md:mb-4 block">Timeline Status</span>
                  <div className="relative pl-6">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ background: 'var(--color-border)' }} />
                    {[
                      { label: 'Dilaporkan', key: 'pending', desc: selectedReport.createdAt ? format(new Date(selectedReport.createdAt), 'dd MMM yyyy, HH:mm') : 'Baru saja' },
                      { label: 'Ditinjau Admin', key: 'reviewed', desc: selectedReport.status === 'reviewed' || selectedReport.status === 'dilaporkan' ? 'Sudah ditinjau' : 'Menunggu' },
                      { label: 'Dilaporkan ke PU', key: 'dilaporkan', desc: selectedReport.status === 'dilaporkan' ? 'Sudah dilaporkan' : 'Menunggu' },
                    ].map((step, i) => {
                      const statusOrder = ['pending', 'reviewed', 'dilaporkan'];
                      const current = statusOrder.indexOf(selectedReport.status);
                      const isActive = i <= current;
                      const isCurrent = statusOrder[i] === selectedReport.status;
                      return (
                        <div key={step.key} className="relative flex items-start gap-3 mb-4 md:mb-5 last:mb-0">
                          <div className="absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                            style={{
                              borderColor: isActive ? 'var(--color-brand-blue)' : 'var(--color-border)',
                              background: isActive ? 'var(--color-brand-blue)' : 'var(--color-surface)',
                            }}>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="text-xs md:text-sm font-bold" style={{ color: isActive ? 'var(--color-on-surface)' : 'var(--color-on-surface-muted)' }}>{step.label}</p>
                            <p className="text-[10px] md:text-[11px]" style={{ color: 'var(--color-on-surface-muted)' }}>{step.desc}</p>
                            {isCurrent && <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue)' }}>Status saat ini</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              
                {/* Export PDF (admin) */}
                {isAdmin && selectedReport.rdsScore > 0 && (
                  <div className="pt-3 md:pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => handleExportPDF(selectedReport)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-colors"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-on-surface)' }}
                    >
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                  </div>
                )}
              
                {/* AI sedang menganalisis (admin, RDS=0) */}
                {isAdmin && selectedReport.rdsScore === 0 && (
                  <div className="mt-auto pt-4 md:pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-center gap-2 py-3 md:py-4 rounded-2xl text-sm font-semibold"
                      style={{ background: 'var(--color-brand-yellow-50)', border: '1px solid var(--color-brand-yellow-100)', color: '#92400e' }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI sedang menganalisis foto laporan ini...
                    </div>
                    <p className="text-center text-[10px] mt-3 font-semibold uppercase tracking-widest" style={{ color: 'var(--color-on-surface-muted)' }}>
                      Hasil deteksi akan muncul otomatis dalam beberapa detik
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}