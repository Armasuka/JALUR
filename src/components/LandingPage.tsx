import React, { useState, useEffect, useRef } from 'react';
import { JalurLogo, JalurMark, ArrowRight, ShieldCheck, MapPin, BrainCircuit, Search, Loader2 } from './icons';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { LandingView } from '../App';
import { AnimatedNumber } from '../lib/useCountUp';
import { Report, Stats } from '../types';

interface LandingPageProps {
  onEnter: (role: 'warga' | 'admin') => void;
  onNavigate: (page: LandingView) => void;
  onLogoClick?: () => void;
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Hero Image Slider ─────────────────── */
const heroImages = [
  { src: '/images/pothole-1.png', alt: 'Kerusakan jalan pothole' },
  { src: '/images/crack-long-1.png', alt: 'Retak memanjang di jalan' },
  { src: '/images/crack-alligator-1.png', alt: 'Kerusakan jalan retak buaya' },
  { src: '/images/pothole-2.png', alt: 'Pothole di jalan residential' },
  { src: '/images/crack-alligator-2.png', alt: 'Retak buaya parah' },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-slider">
      {heroImages.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className={i === current ? 'active' : ''}
        />
      ))}
      <div className="slider-dots">
        {heroImages.map((_, i) => (
          <button
            key={i}
            className={`slider-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease }
  })
};

/* ── Animated Logo: "J JALUR" → scroll → just "J" ───────── */
function AnimatedHeaderLogo({ scrolled, onLogoClick }: { scrolled: boolean; onLogoClick?: () => void }) {
  return (
    <button
      onClick={onLogoClick}
      className="flex items-center gap-2.5 overflow-hidden bg-none border-none cursor-pointer"
    >
      <JalurMark size={28} />
      <div
        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: scrolled ? 0 : '72px',
          opacity: scrolled ? 0 : 1,
        }}
      >
        <span
          className="whitespace-nowrap block"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '23.8px',
            letterSpacing: '-0.04em',
            color: 'var(--color-brand-blue)',
            lineHeight: 1,
          }}
        >
          JALUR
        </span>
      </div>
    </button>
  );
}

export default function LandingPage({ onEnter, onNavigate, onLogoClick }: LandingPageProps) {
  const [stats, setStats] = useState<Stats>({ total: 0, avgRds: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const handleTrack = async () => {
    if (!trackCode.trim()) return;
    setTrackLoading(true); setTrackError(''); setTrackResult(null);
    try {
      const res = await fetch(`/api/reports/track/${trackCode.trim().toUpperCase()}`);
      if (!res.ok) throw new Error('Laporan tidak ditemukan');
      setTrackResult(await res.json());
    } catch (e: any) { setTrackError(e.message || 'Tidak ditemukan'); }
    finally { setTrackLoading(false); }
  };

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 60));

  const sectionHow = useRef<HTMLDivElement>(null);
  const sectionAI = useRef<HTMLDivElement>(null);
  const sectionMap = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then((reports: Report[]) => {
        const a = reports.filter((r) => r.rdsScore > 0);
        const avg = a.length > 0 ? Math.round(a.reduce((s: number, r) => s + r.rdsScore, 0) / a.length) : 0;
        setStats({ total: reports.length, avgRds: avg });
      }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: 'var(--color-surface-cream)', color: 'var(--color-on-surface)' }}>

      {/* ── Sticky Header ─────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(251,249,244,0.92)' : 'rgba(251,249,244,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${scrolled ? 'var(--color-border)' : 'transparent'}`,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <AnimatedHeaderLogo scrolled={scrolled} onLogoClick={onLogoClick} />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo(sectionHow)} className="text-sm font-medium transition-colors hover:text-[var(--color-brand-blue)]" style={{ color: 'var(--color-on-surface-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cara Lapor</button>
            <button onClick={() => scrollTo(sectionAI)} className="text-sm font-medium transition-colors hover:text-[var(--color-brand-blue)]" style={{ color: 'var(--color-on-surface-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Tentang AI</button>
            <button onClick={() => scrollTo(sectionMap)} className="text-sm font-medium transition-colors hover:text-[var(--color-brand-blue)]" style={{ color: 'var(--color-on-surface-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Peta</button>
          </div>
        </div>
      </header>

      {/* ── Editorial Hero ─────────────────────── */}
      <section className="pt-24 md:pt-36 pb-8 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <motion.span
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className="eyebrow inline-block mb-6" style={{ color: 'var(--color-brand-blue)' }}
            >
              Platform Monitoring · Kemang, Bogor
            </motion.span>
            <motion.h1
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="display-serif mb-6" style={{ fontSize: 'clamp(48px, 6vw, 88px)', lineHeight: 1.02 }}
            >
              Jalan lapor<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>untuk rakyat.</em>
            </motion.h1>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
              className="text-lg leading-relaxed max-w-[480px] mb-8" style={{ color: 'var(--color-on-surface-muted)' }}
            >
              Sistem deteksi kerusakan jalan berbasis kecerdasan buatan. Setiap warga bisa melapor, setiap laporan dipetakan, setiap titik kerusakan dinilai secara matematis.
            </motion.p>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={3}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <button onClick={() => onEnter('warga')} className="btn-primary text-base px-8 py-4">
                Mulai Lapor <ArrowRight size={18} />
              </button>
              <button onClick={() => onEnter('admin')} className="btn-secondary text-base px-8 py-4">
                Untuk Admin Kecamatan
              </button>
            </motion.div>
          </div>

          {/* Right: hero image slider */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={scaleIn} custom={2}
            className="relative"
          >
            <div className="rounded-[28px] overflow-hidden" style={{ border: '1px solid var(--color-border)', boxShadow: '0 24px 60px rgba(30,58,138,0.12)' }}>
              <div className="w-full aspect-[4/3]">
                <HeroSlider />
              </div>
            </div>
            {/* Floating stat badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-4 left-4 p-3 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}
            >
              <span className="eyebrow text-[9px] md:text-xs block mb-0.5 md:mb-1">Laporan Masuk</span>
              <AnimatedNumber value={stats.total > 0 ? stats.total : '—'} className="display-serif text-xl md:text-3xl" style={{ color: 'var(--color-brand-blue)' }} />
            </motion.div>
            {/* Floating RDS badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="absolute top-4 right-4 p-3 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'var(--color-brand-blue)' }}
            >
              <span className="eyebrow text-[9px] md:text-xs block mb-0.5 md:mb-1" style={{ color: 'var(--color-brand-yellow)' }}>Avg RDS</span>
              <AnimatedNumber value={stats.avgRds > 0 ? stats.avgRds : '—'} className="display-serif text-xl md:text-3xl text-white" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Bento Grid ─────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-16 space-y-4">

        {/* Row 1: AI detection + Cara Lapor steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI tile with real image */}
          <motion.div
            ref={sectionAI}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={scaleIn} custom={0}
            className="tile p-0 overflow-hidden scroll-mt-24 cursor-pointer group"
            onClick={() => onNavigate('ai-info')}
          >
            <div className="p-5 md:p-7 pb-4">
              <span className="eyebrow" style={{ color: 'var(--color-brand-blue)' }}>Deteksi Otomatis</span>
              <h3 className="display-serif text-2xl md:text-3xl mt-3 mb-2">AI membaca foto Anda.</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>
                Computer vision YOLOv11 mengenali pothole, retak memanjang, dan retak buaya — langsung dari satu foto.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: 'var(--color-brand-blue)' }}>Pelajari teknologi AI <ArrowRight size={12} /></span>
            </div>
            <div className="px-5 md:px-7 pb-5 md:pb-7">
              <div className="rounded-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]" style={{ border: '1px solid var(--color-border)' }}>
                <img src="/images/ai-detect.png" alt="AI Detection" className="w-full h-48 object-cover" />
              </div>
            </div>
          </motion.div>

          {/* How it works CTA tile */}
          <motion.div
            ref={sectionHow}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={scaleIn} custom={1}
            className="tile-cta flex flex-col justify-between rounded-[28px] p-8 cursor-pointer scroll-mt-24 group"
            onClick={() => onNavigate('how-to')}
          >
            <div>
              <span className="eyebrow" style={{ color: 'var(--color-brand-yellow-700)' }}>Cara Lapor</span>
              <h3 className="display-serif text-3xl mt-3 mb-6">Lapor dalam<br/>60 detik.</h3>
              <div className="space-y-4">
                {[
                  { n: '01', t: 'Foto kerusakan jalan dari ponsel' },
                  { n: '02', t: 'Lokasi GPS otomatis terdeteksi' },
                  { n: '03', t: 'AI menganalisis & hitung skor RDS' },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}>{step.n}</span>
                    <span className="text-sm font-medium mt-0.5">{step.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <span className="text-sm font-semibold">Lihat Panduan Lengkap →</span>
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}>
                <ArrowRight size={18} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: 'Laporan Masuk', value: stats.total > 0 ? stats.total.toLocaleString('id-ID') : '—' },
            { label: 'Rata-rata RDS', value: stats.avgRds > 0 ? stats.avgRds : '—' },
            { label: 'Wilayah Aktif', value: '1' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={scaleIn} custom={i}
              className="tile text-center py-6"
            >
              <AnimatedNumber value={s.value} className="display-serif block" style={{ fontSize: 'clamp(32px, 7vw, 44px)', fontWeight: 300, color: 'var(--color-brand-blue)', lineHeight: 1 }} />
              <span className="eyebrow mt-2 block">{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Row 3: Map + RDS + Quote */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Aerial map tile */}
          <motion.div
            ref={sectionMap}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={scaleIn} custom={0}
            className="md:col-span-5 tile p-0 overflow-hidden cursor-pointer scroll-mt-24 relative group"
            style={{ minHeight: '260px' }}
            onClick={() => onNavigate('public-map')}
          >
            <img src="/images/map-aerial.png" alt="Peta Kemang" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: 'rgba(30,58,138,0.55)' }} />
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <span className="eyebrow" style={{ color: 'var(--color-brand-yellow)' }}>Wilayah Pantauan</span>
              <h3 className="display-serif text-3xl text-white mt-1">Kecamatan Kemang.</h3>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1 transition-all group-hover:gap-2">Klik untuk lihat peta interaktif <span>→</span></p>
            </div>
          </motion.div>

          {/* RDS explainer */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={scaleIn} custom={1}
            className="md:col-span-4 tile flex flex-col justify-between cursor-pointer group"
            onClick={() => onNavigate('rds-info')}
          >
            <div>
              <span className="eyebrow">Road Damage Score</span>
              <h3 className="display-serif text-2xl mt-3 mb-4">Skor 0–100, otomatis dari deteksi AI.</h3>
            </div>
            <div>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Parah', range: '0–39', color: '#ef4444', w: '35%' },
                  { label: 'Sedang', range: '40–69', color: 'var(--color-brand-yellow)', w: '30%' },
                  { label: 'Ringan', range: '70–100', color: 'var(--color-success)', w: '35%' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold w-12" style={{ color: 'var(--color-on-surface-muted)' }}>{b.label}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-cream)' }}>
                      <div className="h-full rounded-full" style={{ width: b.w, background: b.color }} />
                    </div>
                    <span className="text-[10px] font-bold w-10 text-right" style={{ color: 'var(--color-on-surface-muted)' }}>{b.range}</span>
                  </div>
                ))}
              </div>
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: '#f1f5f9' }}>
                <div className="h-full" style={{ width: '33%', background: '#ef4444', borderRadius: '9999px 0 0 9999px' }} />
                <div className="h-full" style={{ width: '34%', background: 'var(--color-brand-yellow)' }} />
                <div className="h-full" style={{ width: '33%', background: 'var(--color-success)', borderRadius: '0 9999px 9999px 0' }} />
              </div>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: 'var(--color-brand-blue)' }}>Pelajari cara perhitungan <ArrowRight size={12} /></span>
            </div>
          </motion.div>

          {/* Quote tile */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={scaleIn} custom={2}
            className="md:col-span-3 rounded-[28px] p-7 flex flex-col justify-between"
            style={{ background: 'var(--color-brand-blue)', color: '#fff', minHeight: '280px' }}
          >
            <div className="w-8 h-[3px] mb-4" style={{ background: 'var(--color-brand-yellow)' }} />
            <p className="display-serif text-xl leading-snug" style={{ fontStyle: 'italic' }}>
              "Infrastruktur yang baik dimulai dari mata warganya."
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-widest mt-4" style={{ color: '#94a3b8' }}>Filosofi JALUR</span>
          </motion.div>
        </div>

        {/* Row 4: CTA ribbon */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          variants={scaleIn} custom={0}
          className="tile-ribbon flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >

          <div className="relative z-10">
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow)' }}>Mulai Kontribusi</span>
            <h3 className="display-serif text-3xl md:text-4xl text-white">
              Bangun Kemang yang lebih layak.
            </h3>
          </div>
          <button onClick={() => onEnter('warga')} className="btn-primary text-base px-7 py-4 shrink-0 relative z-10">
            Buka Peta & Lapor <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Row 5: Track Report */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          variants={scaleIn} custom={0}
          className="tile p-8 mt-4"
        >
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1">
              <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Lacak Laporan</span>
              <h3 className="display-serif text-2xl mb-2">Cek status laporan Anda.</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>Masukkan kode unik yang diberikan saat melapor (contoh: LAP-ABCD)</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="LAP-XXXX"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    className="input-base pl-12 uppercase"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                  />
                </div>
                <button onClick={handleTrack} disabled={trackLoading || !trackCode.trim()} className="btn-primary px-6 py-3">
                  {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lacak'}
                </button>
              </div>
            </div>

            {trackResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 p-5 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="display-serif text-2xl" style={{ color: 'var(--color-brand-blue)', fontFeatureSettings: '"tnum"' }}>{trackResult.kodeUnik}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${trackResult.status === 'dilaporkan' ? 'badge-status-dilaporkan' : trackResult.status === 'reviewed' ? 'badge-status-reviewed' : 'badge-status-pending'}`}>
                    {trackResult.status === 'pending' ? 'Menunggu' : trackResult.status === 'reviewed' ? 'Ditinjau' : 'Dilaporkan ke PU'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <span className="eyebrow block" style={{ fontSize: '9px' }}>RDS Score</span>
                    <span className="display-serif text-xl" style={{ color: trackResult.rdsScore < 40 ? '#ef4444' : trackResult.rdsScore < 70 ? '#f59e0b' : '#22c55e' }}>{trackResult.rdsScore || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <span className="eyebrow block" style={{ fontSize: '9px' }}>Deteksi AI</span>
                    <span className="display-serif text-xl" style={{ color: 'var(--color-brand-blue)' }}>{trackResult.detectionsCount ?? '—'}</span>
                  </div>
                </div>
                {trackResult.address && <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'var(--color-on-surface-muted)' }}><MapPin className="w-3 h-3" />{trackResult.address}</p>}
              </motion.div>
            )}
            {trackError && <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{trackError}</p>}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <JalurLogo size={28} showTagline />
          <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
            © 2026 JALUR · Proyek percontohan Kecamatan Kemang, Bogor
          </span>
        </div>
      </footer>
    </div>
  );
}
