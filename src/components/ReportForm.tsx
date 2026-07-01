import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, ShieldAlert, Mail, MapPin, ArrowRight, BrainCircuit, CheckCircle2 } from './icons';
import PhotoGuidePanel from './PhotoGuidePanel';
import { motion, AnimatePresence } from 'motion/react';
import { cn, compressImage } from '../lib/utils';

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
    const maxPolls = 30;

    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const response = await fetch(`/api/reports/track/${kodeUnik}`);
        if (response.ok) {
          const reportsRes = await fetch('/api/reports');
          if (reportsRes.ok) {
            const reports = await reportsRes.json();
            const report = reports.find((r: any) => r.kodeUnik === kodeUnik);

            if (report) {
              if (report.imageUrl) {
                try {
                  const parsed = JSON.parse(report.imageUrl);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setResultImages(parsed);
                  }
                } catch (e) {}
              } else if (previews.length > 0 && resultImages.length === 0) {
                setResultImages(previews);
              }

              if (report.rdsScore > 0) {
                setRdsScore(report.rdsScore);
                if (report.detections) {
                  setDetections(report.detections);
                }
                setIsDetecting(false);
                clearInterval(pollInterval);
              } else if (pollCount >= maxPolls) {
                setIsDetecting(false);
                clearInterval(pollInterval);
              }
            }
          }
        }
      } catch (err) {
        if (previews.length > 0 && resultImages.length === 0) {
          setResultImages(previews);
        }
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isDetecting, kodeUnik]);

  // Success Card Component
  const SuccessCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="p-8 text-center" style={{ background: 'linear-gradient(180deg, var(--color-brand-yellow-50) 0%, white 100%)' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-4"
        >
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="40" cy="40" r="38" fill="#1e3a8a"/>
            <path d="M24 40L35 51L56 30" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow-700)' }}
        >
          Laporan Terkirim
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="display-serif" style={{ fontSize: 'clamp(36px, 8vw, 56px)', letterSpacing: '-0.03em', color: 'var(--color-brand-blue)', lineHeight: 1 }}
        >
          {kodeUnik}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm mt-3" style={{ color: 'var(--color-on-surface-muted)' }}
        >
          Simpan kode untuk memantau status laporan.
        </motion.p>
      </div>

      <div className="p-6 space-y-4">
        {/* RD Score Card */}
        {rdsScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <motion.circle
                    cx="40" cy="40" r="35" fill="none"
                    stroke={rdsScore < 50 ? '#ef4444' : rdsScore < 70 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${rdsScore * 2.2} 220`}
                    initial={{ strokeDasharray: '0 220' }}
                    animate={{ strokeDasharray: `${rdsScore * 2.2} 220` }}
                    transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: rdsScore < 50 ? '#ef4444' : rdsScore < 70 ? '#f59e0b' : '#22c55e' }}>
                    {rdsScore}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>
                  Road Damage Score
                </span>
                <p className="font-bold text-base mt-1" style={{ color: rdsScore < 50 ? '#dc2626' : rdsScore < 70 ? '#d97706' : '#16a34a' }}>
                  {rdsScore < 50 ? 'Kerusakan Parah' : rdsScore < 70 ? 'Kerusakan Sedang' : 'Kerusakan Ringan'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {rdsScore < 50 ? 'Perlu penanganan segera' : rdsScore < 70 ? 'Perlu perhatian admin' : 'Kondisi baik'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Analyzing indicator */}
        {isDetecting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4" style={{ background: 'var(--color-brand-blue-50)', border: '1px solid var(--color-brand-blue-100)' }}
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand-blue)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--color-brand-blue)' }}>
                AI Sedang Menganalisis...
              </span>
            </div>
          </motion.div>
        )}

        {/* Object Detection Section */}
        {detections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="px-4 py-3" style={{ background: 'var(--color-brand-blue-50)', borderBottom: '1px solid var(--color-brand-blue-100)' }}>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color: 'var(--color-brand-blue)' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-brand-blue)' }}>
                  Object Detection
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {detections.map((det: any, i: number) => {
                const catColor = det.class === 'pothole' ? '#ef4444' : det.class === 'alligator crack' ? '#f59e0b' : '#3b82f6';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-cream)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ background: catColor }} />
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-on-surface)' }}>{det.class}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color: catColor, background: catColor + '15' }}>
                      {Math.round(det.confidence * 100)}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Results with Bounding Boxes */}
        {resultImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="px-4 py-3" style={{ background: 'var(--color-surface-cream)', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-on-surface-muted)' }}>
                Results ({resultImages.length} {resultImages.length === 1 ? 'image' : 'images'})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-0.5">
              {resultImages.map((img: string, imgIdx: number) => {
                const imgDetections = detections.length > 0
                  ? detections.filter((d: any) => d.image_index === imgIdx || d.image_index === undefined)
                  : [];
                const dims = imgDims[imgIdx] || { w: 1, h: 1 };

                return (
                  <motion.div
                    key={imgIdx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + imgIdx * 0.1 }}
                    className="relative" style={{ background: '#f1f5f9', aspectRatio: '1/1' }}
                  >
                    <img
                      src={img}
                      alt={`Result ${imgIdx + 1}`}
                      className="w-full h-full object-contain"
                      onLoad={(e) => {
                        const imgEl = e.currentTarget;
                        if (imgEl && !imgEl.complete) return;
                        const w = imgEl?.naturalWidth || 1;
                        const h = imgEl?.naturalHeight || 1;
                        setImgDims(prev => {
                          if (prev[imgIdx]?.w === w && prev[imgIdx]?.h === h) return prev;
                          return { ...prev, [imgIdx]: { w, h } };
                        });
                      }}
                    />
                    {imgDetections.map((det: any, detIdx: number) => {
                      const catColor = det.class === 'pothole' ? '#ef4444' : det.class === 'alligator crack' ? '#f59e0b' : '#3b82f6';
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
                          backgroundColor: catColor + '20',
                          borderRadius: '3px',
                          pointerEvents: 'none',
                        }}>
                          <span className="absolute -top-5 left-0 px-1 py-0.5 text-[7px] font-bold whitespace-nowrap rounded" style={{ background: catColor, color: '#fff' }}>
                            {det.class} {Math.round(det.confidence * 100)}%
                          </span>
                        </div>
                      );
                    })}
                    {isDetecting && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(241,245,249,0.8)' }}>
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand-blue)' }} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 pt-2"
        >
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
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-[1080px] mx-auto py-4 md:py-8 px-0">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <SuccessCard />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
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
            <StepIndicator step={currentStep} />

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
              </div>
            </form>

            {/* Error state */}
            {status === 'error' && (
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
