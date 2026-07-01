import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, CheckCircle2, ShieldAlert, Mail, MapPin, ArrowRight, BrainCircuit } from './icons';
import PhotoGuidePanel from './PhotoGuidePanel';
import { motion, AnimatePresence } from 'motion/react';
import { calculateRDS, cn, compressImage } from '../lib/utils';
import { Detection } from '../types';

interface ReportFormProps {
  onSuccess?: () => void;
  onNavigateMap?: () => void;
  onNavigateHistory?: () => void;
}

/* ── Step indicator ────── */
function StepIndicator({ step }: { step: number }) {
  const steps = ['Upload Foto', 'Isi Data', 'Kirim'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-400"
              style={{
                background: i <= step ? 'var(--color-brand-blue)' : 'var(--color-surface)',
                color: i <= step ? '#fff' : 'var(--color-on-surface-muted)',
                border: `1.5px solid ${i <= step ? 'var(--color-brand-blue)' : 'var(--color-border)'}`,
              }}
            >
              {i + 1}
            </div>
            <span className="text-[11px] font-semibold hidden sm:block" style={{ color: i <= step ? 'var(--color-brand-blue)' : 'var(--color-on-surface-muted)' }}>
              {s}
            </span>
          </div>
          {i < 2 && <div className="flex-1 h-px" style={{ background: i < step ? 'var(--color-brand-blue)' : 'var(--color-border)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ReportForm({ onSuccess, onNavigateMap, onNavigateHistory }: ReportFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kodeUnik, setKodeUnik] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [rdsScore, setRdsScore] = useState<number | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [imgDims, setImgDims] = useState<Record<number, {w: number, h: number}>>({});

  const currentStep = files.length > 0 ? (email ? 2 : 1) : 0;

  const isWithinKemang = (lat: number, lng: number) => {
    return lat >= -6.5400 && lat <= -6.4850 && lng >= 106.7200 && lng <= 106.7800;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => {
        const combined = [...prev, ...acceptedFiles].slice(0, 3);
        setPreviews(combined.map(f => URL.createObjectURL(f)));
        return combined;
      });
      setKodeUnik(null);
      setErrorMsg(null);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  } as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !email) return;

    setLoading(true);
    setStatus('saving');
    setErrorMsg(null);

    try {
      const imagesPayload = await Promise.all(files.map(async (f) => {
        return await compressImage(f, 800, 800, 0.6);
      }));

      let latitude = -6.512500;
      let longitude = 106.755280; 
      
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: Infinity
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (geoError) {
        console.warn("Geolocation failed. Menggunakan lokasi default Kemang.", geoError);
      }

      if (!isWithinKemang(latitude, longitude)) {
        throw new Error("Laporan ditolak. Laporan hanya dapat dibuat untuk wilayah Kecamatan Kemang, Kabupaten Bogor.");
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, latitude, longitude, images: imagesPayload, deskripsi })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      setKodeUnik(data.report.kodeUnik);
      setIsDetecting(data.report.detecting || false);
      setStatus('success');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Terjadi kesalahan saat menyimpan laporan.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Poll for detection results after report is submitted
  useEffect(() => {
    if (!isDetecting || !kodeUnik) return;

    let pollCount = 0;
    const maxPolls = 30; // 60 seconds max (30 * 2s)

    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        // Fetch the specific report by kode unik
        const response = await fetch(`/api/reports/track/${kodeUnik}`);
        if (response.ok) {
          const data = await response.json();
          console.log('[Polling] RDS:', data.rdsScore, 'Detections:', data.detectionsCount);

          // Also fetch full report data for images and detections
          const reportsRes = await fetch('/api/reports');
          if (reportsRes.ok) {
            const reports = await reportsRes.json();
            const report = reports.find((r: any) => r.kodeUnik === kodeUnik);

            if (report) {
              console.log('[Polling] Found report:', report.id, 'RDS:', report.rdsScore, 'Detections:', report.detections?.length);

              // Set images from DB response
              if (report.imageUrl) {
                try {
                  const parsed = JSON.parse(report.imageUrl);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setResultImages(parsed);
                  }
                } catch (e) {
                  console.error('[Polling] Image parse error:', e);
                }
              } else if (previews.length > 0 && resultImages.length === 0) {
                // Fallback: use local previews if DB images not ready yet
                setResultImages(previews);
              }

              // If RDS is ready, show results
              if (report.rdsScore > 0) {
                setRdsScore(report.rdsScore);
                if (report.detections) {
                  setDetections(report.detections);
                }
                setIsDetecting(false);
                clearInterval(pollInterval);
                console.log('[Polling] Detection complete!');
              } else if (pollCount >= maxPolls) {
                // Timeout - show what we have
                setIsDetecting(false);
                clearInterval(pollInterval);
                console.log('[Polling] Timeout');
              }
            }
          } else if (previews.length > 0 && resultImages.length === 0) {
            // If reports API fails, at least show the preview images
            setResultImages(previews);
          }
        } else if (previews.length > 0 && resultImages.length === 0) {
          // If track API fails, use local previews
          setResultImages(previews);
        }
      } catch (err) {
        console.error('[Polling] Error:', err);
        // Still try to show previews if available
        if (previews.length > 0 && resultImages.length === 0) {
          setResultImages(previews);
        }
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isDetecting, kodeUnik]);

  return (
    <div className="max-w-[1080px] mx-auto py-4 md:py-8 px-0">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-1">
          <h2 className="display-serif text-4xl md:text-5xl">
            Laporkan kerusakan,<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>bantu wilayahmu.</em>
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Foto dianalisis otomatis oleh AI. Lokasi dari GPS perangkat.</p>
        </div>

        {/* Step indicator */}
        {status !== 'success' && <StepIndicator step={currentStep} />}

        {/* Photo guide */}
        <PhotoGuidePanel />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="card p-5 md:p-7 space-y-5">
            {/* Dropzone */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold">Foto kerusakan</label>
                <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>{files.length}/3</span>
              </div>
              <div 
                {...getRootProps()} 
                className={cn(
                  "aspect-[3/2] rounded-2xl border-[1.5px] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden relative",
                  isDragActive ? "border-[var(--color-brand-blue)]" : "",
                  previews.length > 0 ? "border-solid" : "border-dashed"
                )}
                style={{
                  borderColor: isDragActive ? 'var(--color-brand-blue)' : 'var(--color-border)',
                  background: isDragActive ? 'var(--color-brand-blue-50)' : 'var(--color-surface-cream)'
                }}
              >
                <input {...getInputProps()} />
                {previews.length > 0 ? (
                  <div className="w-full h-full relative p-2 grid grid-cols-2 gap-2" style={{ background: 'var(--color-surface-cream)' }} onClick={(e) => { if (previews.length >= 3) e.stopPropagation(); }}>
                    {previews.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative rounded-xl overflow-hidden group/img ${previews.length === 1 ? 'col-span-2 row-span-2' : 'h-32'}`}
                      >
                        <img src={p} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles(prev => prev.filter((_, idx) => idx !== i));
                            setPreviews(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full text-white transition-opacity z-10 opacity-100 md:opacity-0 md:group-hover/img:opacity-100"
                          style={{ background: 'rgba(15,23,42,0.6)' }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                    {previews.length < 3 && (
                      <div className="rounded-xl border-[1.5px] border-dashed flex flex-col items-center justify-center h-32 cursor-pointer" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--color-on-surface-muted)' }}>Tambah</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="display-serif text-lg">Tarik foto ke sini</span>
                    <span className="text-xs mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>atau klik untuk pilih dari perangkat</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold mb-2 block">Email pelapor</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input 
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base pl-12"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold">Deskripsi</label>
                <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface-muted)' }}>Opsional</span>
              </div>
              <textarea 
                placeholder="Contoh: jalan berlubang cukup dalam, sering tergenang air ketika hujan."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={3}
                className="input-base resize-none"
              />
            </div>

            {/* GPS hint */}
            <div className="flex gap-3 p-3.5 rounded-2xl" style={{ background: 'var(--color-brand-yellow-50)', border: '1px solid var(--color-brand-yellow-100)' }}>
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                <strong style={{ color: 'var(--color-brand-yellow-700)' }}>Lokasi otomatis.</strong>{' '}
                <span style={{ color: 'var(--color-on-surface-muted)' }}>Koordinat GPS diambil saat pengiriman.</span>
              </p>
            </div>

            {/* Submit */}
            <button
              disabled={loading || files.length === 0 || !email}
              className="btn-primary w-full py-4 text-base group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Kirim Laporan
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col"
                >
                  <div className="card overflow-hidden">
                    <div className="p-7 text-center" style={{ background: 'var(--color-brand-yellow-50)', borderBottom: '1px solid var(--color-brand-yellow-100)' }}>
                      <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}>
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow-700)' }}>Laporan Terkirim</span>
                      <p className="display-serif mt-1" style={{ fontSize: 'clamp(28px, 6vw, 44px)', letterSpacing: '-0.03em', color: 'var(--color-brand-blue)', lineHeight: 1 }}>{kodeUnik}</p>
                      <p className="text-sm mt-3" style={{ color: 'var(--color-on-surface-muted)' }}>Simpan kode ini untuk memantau status.</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 rounded-xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>Status</span>
                          <p className="text-sm font-semibold mt-1">Pending</p>
                        </div>
                        <div className="flex-1 p-3 rounded-xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>RDS</span>
                          <p className="text-sm font-semibold mt-1">
                            {rdsScore !== null ? (
                              <span style={{ color: rdsScore < 50 ? '#ef4444' : rdsScore < 70 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>
                                {rdsScore}
                              </span>
                            ) : isDetecting ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                AI menganalisis...
                              </span>
                            ) : 'Menunggu'}
                          </p>
                        </div>
                      </div>

                      {/* Image Analysis Area - Always visible when detecting or has results */}
                      {(isDetecting || resultImages.length > 0) && (
                        <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BrainCircuit className="w-4 h-4" style={{ color: 'var(--color-brand-blue)' }} />
                              <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-blue)' }}>
                                {isDetecting ? 'AI Sedang Menganalisis...' : 'Hasil Deteksi AI'}
                              </span>
                            </div>
                            {isDetecting && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-brand-blue)' }} />
                                <span className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>Processing</span>
                              </div>
                            )}
                          </div>

                          {/* Image Grid with Bounding Boxes */}
                          {resultImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {resultImages.map((img: string, imgIdx: number) => {
                                const imgDetections = detections.length > 0
                                  ? detections.filter((d: any) => d.image_index === imgIdx || d.image_index === undefined)
                                  : [];
                                const dims = imgDims[imgIdx] || { w: 1, h: 1 };

                                return (
                                  <div key={imgIdx} className="relative rounded-xl overflow-hidden" style={{ background: '#0f172a', aspectRatio: '4/3' }}>
                                    <img
                                      src={img}
                                      alt={`Deteksi ${imgIdx + 1}`}
                                      className="w-full h-full object-contain"
                                      onLoad={(e) => {
                                        const img = e.currentTarget;
                                        if (img && !img.complete) return;
                                        const w = img?.naturalWidth || 1;
                                        const h = img?.naturalHeight || 1;
                                        setImgDims(prev => {
                                          if (prev[imgIdx]?.w === w && prev[imgIdx]?.h === h) return prev;
                                          return { ...prev, [imgIdx]: { w, h } };
                                        });
                                      }}
                                    />

                                    {/* Loading overlay while detecting */}
                                    {isDetecting && imgDetections.length === 0 && (
                                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)' }}>
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                      </div>
                                    )}

                                    {/* Bounding Boxes */}
                                    {imgDetections.map((det: any, detIdx: number) => {
                                      const catColor = det.class === 'pothole' ? '#ef4444'
                                        : det.class === 'alligator crack' ? '#f59e0b'
                                        : '#3b82f6';
                                      const left = (det.bbox.x / dims.w) * 100;
                                      const top = (det.bbox.y / dims.h) * 100;
                                      const width = (det.bbox.width / dims.w) * 100;
                                      const height = (det.bbox.height / dims.h) * 100;
                                      return (
                                        <div key={detIdx} style={{
                                          position: 'absolute',
                                          left: `${left}%`,
                                          top: `${top}%`,
                                          width: `${width}%`,
                                          height: `${height}%`,
                                          border: `2px solid ${catColor}`,
                                          backgroundColor: catColor + '30',
                                          borderRadius: '4px',
                                          pointerEvents: 'none',
                                        }}>
                                          <span className="absolute -top-5 left-0 px-1 py-0.5 text-[7px] font-bold whitespace-nowrap rounded" style={{
                                            background: catColor,
                                            color: '#fff',
                                          }}>
                                            {det.class} {Math.round(det.confidence * 100)}%
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          ) : isDetecting ? (
                            /* Show placeholder images while detecting but images not loaded yet */
                            <div className="grid grid-cols-2 gap-2">
                              {[0, 1].map(i => (
                                <div key={i} className="rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-cream)', aspectRatio: '4/3', border: '1px dashed var(--color-border)' }}>
                                  <div className="text-center">
                                    <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: 'var(--color-on-surface-muted)' }} />
                                    <span className="text-[10px] mt-1 block" style={{ color: 'var(--color-on-surface-muted)' }}>Memuat...</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {/* Detection List */}
                          {detections.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {detections.map((det: any, i: number) => {
                                const catColor = det.class === 'pothole' ? '#ef4444'
                                  : det.class === 'alligator crack' ? '#f59e0b'
                                  : '#3b82f6';
                                return (
                                  <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                                      <span className="text-xs font-medium capitalize">{det.class}</span>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: catColor, background: catColor + '15', fontFamily: 'var(--font-mono)' }}>
                                      {Math.round(det.confidence * 100)}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* RDS Score */}
                      {rdsScore !== null && (
                        <>
                          <div className="p-4 rounded-2xl" style={{
                            background: rdsScore < 50 ? '#fef2f2' : rdsScore < 70 ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${rdsScore < 50 ? '#fca5a5' : rdsScore < 70 ? '#fcd34d' : '#86efac'}`
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                                background: rdsScore < 50 ? '#ef4444' : rdsScore < 70 ? '#f59e0b' : '#22c55e',
                                color: '#fff'
                              }}>
                                <span className="text-lg font-bold">{rdsScore}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-sm" style={{ color: rdsScore < 50 ? '#dc2626' : rdsScore < 70 ? '#d97706' : '#16a34a' }}>
                                  {rdsScore < 50 ? '⚠️ Kerusakan Parah' : rdsScore < 70 ? '🔶 Kerusakan Sedang' : '✅ Kerusakan Ringan'}
                                </p>
                                <p className="text-[11px]" style={{ color: 'var(--color-on-surface-muted)' }}>
                                  Nilai RDS (Road Damage Score)
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>
                            Laporan Anda akan ditinjau oleh admin. Semakin rendah RDS, semakin prioritas penanganan.
                          </p>
                        </>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setStatus('idle');
                            setFiles([]);
                            setPreviews([]);
                            setKodeUnik(null);
                            setDeskripsi('');
                            setIsDetecting(false);
                            setRdsScore(null);
                            setDetections([]);
                            setResultImages([]);
                            setImgDims({});
                          }}
                          className="btn-secondary flex-1"
                        >
                          Lapor Lagi
                        </button>
                        {onNavigateHistory && (
                          <button type="button" onClick={onNavigateHistory} className="btn-primary flex-1 group">
                            Pantau Laporan
                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : status === 'error' ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-8 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#fef2f2', color: '#ef4444' }}>
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="display-serif text-xl">Gagal Mengirim</h3>
                  <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>{errorMsg}</p>
                  <button onClick={() => { setStatus('idle'); setErrorMsg(null); }} className="btn-secondary">Coba Lagi</button>
                </motion.div>
              ) : (
                <>
                  {/* Ticket preview */}
                  <div className="card p-5 md:p-7">
                    <div className="p-5 rounded-2xl" style={{ background: 'var(--color-brand-yellow-50)', border: '1px solid var(--color-brand-yellow-100)' }}>
                      <span className="eyebrow" style={{ color: 'var(--color-brand-yellow-700)' }}>Kode tiket akan muncul di sini</span>
                      <p className="display-serif mt-2" style={{ fontSize: 'clamp(28px, 6vw, 44px)', letterSpacing: '-0.03em', color: 'var(--color-brand-blue)', lineHeight: 1, opacity: 0.15 }}>LAP-————</p>
                      <p className="text-sm mt-2" style={{ color: 'var(--color-on-surface-muted)' }}>Simpan kode ini untuk memantau status.</p>
                    </div>
                  </div>

                  {/* What happens next */}
                  <div className="card p-5 md:p-7">
                    <p className="display-serif text-base mb-4" style={{ fontStyle: 'italic' }}>Apa yang terjadi setelah kirim?</p>
                    <div className="space-y-3">
                      {[
                        { icon: BrainCircuit, text: 'AI memindai foto dalam 5–10 detik' },
                        { icon: MapPin, text: 'Lokasi divalidasi berada di Kemang' },
                        { icon: CheckCircle2, text: 'Laporan masuk ke dashboard admin' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-brand-blue-50)' }}>
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
