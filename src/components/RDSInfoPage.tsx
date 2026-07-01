import React, { useState } from 'react';
const ease = [0.22, 1, 0.36, 1] as const;
import { ChevronLeft, ArrowRight, AlertTriangle, ShieldCheck, ShieldAlert } from './icons';
import { motion } from 'motion/react';

interface RDSInfoPageProps {
  onBack: () => void;
  onNavigateMap: () => void;
  onEnter: (role: 'warga' | 'admin') => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease }
  })
};

const categories = [
  {
    label: 'Parah',
    range: '0 – 39',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    iconType: 'alert' as const,
    desc: 'Jalan memerlukan perbaikan segera. Kerusakan berat berupa lubang besar atau retakan luas yang membahayakan pengguna jalan.',
    action: 'Prioritas 1 — Perbaikan darurat dalam waktu 1-2 minggu',
    example: 'Lubang dengan kedalaman >5cm, retak buaya tersebar luas di permukaan jalan, atau kombinasi beberapa jenis kerusakan sekaligus.',
  },
  {
    label: 'Sedang',
    range: '40 – 69',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    iconType: 'warning' as const,
    desc: 'Jalan mengalami penurunan kualitas yang perlu ditangani. Terdapat retakan atau lubang kecil yang berpotensi membesar.',
    action: 'Prioritas 2 — Penjadwalan perbaikan dalam 1-3 bulan',
    example: 'Retakan memanjang 2-5 meter, lubang kecil diameter <20cm, atau retakan buaya pada area terbatas.',
  },
  {
    label: 'Ringan',
    range: '70 – 100',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    iconType: 'ok' as const,
    desc: 'Jalan dalam kondisi relatif baik. Kerusakan minimal berupa retakan kecil yang belum mempengaruhi kenyamanan berkendara.',
    action: 'Prioritas 3 — Monitoring dan pemeliharaan rutin',
    example: 'Retak rambut, retakan kecil <1 meter, atau kerusakan permukaan yang sangat minor.',
  },
];

const formulaParts = [
  { symbol: 'RDS', desc: 'Road Damage Score (skor akhir)', color: 'var(--color-brand-blue)' },
  { symbol: '100', desc: 'Nilai awal jalan dalam kondisi sempurna', color: 'var(--color-success)' },
  { symbol: 'Σ Pᵢ', desc: 'Total penalti dari semua kerusakan terdeteksi', color: '#ef4444' },
];

const penaltyWeights = [
  { type: 'Pothole (Lubang)', weight: 10, desc: 'Kerusakan paling berdampak, penalti tertinggi per deteksi', color: '#ef4444' },
  { type: 'Alligator Crack (Retak Buaya)', weight: 7, desc: 'Indikasi kerusakan struktural, penalti tinggi', color: '#f59e0b' },
  { type: 'Linear Crack (Retak Memanjang)', weight: 5, desc: 'Kerusakan permukaan, penalti moderat', color: '#facc15' },
];

const exampleCases = [
  {
    title: 'Kasus 1: Jalan Desa Kemang Utara',
    detections: '2 Pothole + 1 Linear Crack',
    calc: '100 - (2×10) - (1×5) = 75',
    score: 75,
    verdict: 'Ringan',
    color: '#22c55e',
    desc: 'Jalan masih dalam kondisi dapat dilalui. Dijadwalkan untuk penambalannya di kuartal berikutnya.',
  },
  {
    title: 'Kasus 2: Jalan Raya Kemang-Parung',
    detections: '3 Pothole + 2 Alligator Crack',
    calc: '100 - (3×10) - (2×7) = 56',
    score: 56,
    verdict: 'Sedang',
    color: '#f59e0b',
    desc: 'Perlu penanganan dalam waktu dekat. Tim kecamatan menjadwalkan perbaikan dalam 2 bulan.',
  },
  {
    title: 'Kasus 3: Gang Masjid Rt.02',
    detections: '4 Pothole + 2 Alligator + 3 Linear',
    calc: '100 - (4×10) - (2×7) - (3×5) = 31',
    score: 31,
    verdict: 'Parah',
    color: '#ef4444',
    desc: 'Perbaikan darurat dibutuhkan. Laporan diprioritaskan oleh admin kecamatan untuk penanganan segera.',
  },
];

function RDSCalculator() {
  const [pothole, setPothole] = useState(0);
  const [linear, setLinear] = useState(0);
  const [alligator, setAlligator] = useState(0);

  const score = Math.max(0, 100 - (pothole * 10 + alligator * 7 + linear * 5));
  const scoreColor = score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#22c55e';
  const scoreLabel = score < 40 ? 'Parah' : score < 70 ? 'Sedang' : 'Ringan';

  const sliders = [
    { label: 'Pothole (Lubang)', value: pothole, set: setPothole, weight: 10, color: '#ef4444' },
    { label: 'Alligator Crack', value: alligator, set: setAlligator, weight: 7, color: '#f59e0b' },
    { label: 'Linear Crack', value: linear, set: setLinear, weight: 5, color: '#facc15' },
  ];

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      className="mb-16"
    >
      <motion.div variants={fadeUp} custom={0}>
        <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Kalkulator Interaktif</span>
        <h2 className="display-serif text-3xl mb-8">Coba hitung sendiri.</h2>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="tile p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
          <div className="p-8 space-y-6">
            {sliders.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">{s.label}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.color + '15', color: s.color }}>
                    {s.value} × {s.weight} = −{s.value * s.weight}
                  </span>
                </div>
                <input
                  type="range" min="0" max="10" value={s.value}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, ${s.color} ${s.value * 10}%, var(--color-border) ${s.value * 10}%)` }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>0</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>10</span>
                </div>
              </div>
            ))}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
              <span className="eyebrow block mb-1" style={{ fontSize: '9px' }}>Formula</span>
              <p className="text-sm font-mono font-bold" style={{ color: 'var(--color-brand-blue)' }}>
                100 − ({pothole}×10) − ({alligator}×7) − ({linear}×5) = {score}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center p-10 md:p-16" style={{ background: scoreColor + '10', borderLeft: `1px solid ${scoreColor}30`, minWidth: '220px' }}>
            <div className="text-center">
              <span className="display-serif block transition-all duration-300" style={{ fontSize: '80px', color: scoreColor, lineHeight: 1 }}>{score}</span>
              <span className="text-sm font-bold uppercase tracking-wider mt-2 block transition-all duration-300" style={{ color: scoreColor }}>{scoreLabel}</span>
              <div className="mt-4 w-full h-3 rounded-full overflow-hidden flex" style={{ background: '#f1f5f9' }}>
                <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default function RDSInfoPage({ onBack, onNavigateMap, onEnter }: RDSInfoPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen" style={{ background: 'var(--color-surface-cream)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50" style={{
        background: 'rgba(251,249,244,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--color-brand-blue)]" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-muted)' }}>
            <ChevronLeft size={18} /> Kembali
          </button>
          <button onClick={onNavigateMap} className="btn-primary text-sm px-5 py-2.5">
            Lihat Peta <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" className="mb-16">
          <motion.span variants={fadeUp} custom={0} className="eyebrow inline-block mb-3" style={{ color: 'var(--color-brand-blue)' }}>
            Metrik Penilaian
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="display-serif mb-4" style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05 }}>
            Road Damage<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>Score (RDS)</em>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base leading-relaxed max-w-[600px]" style={{ color: 'var(--color-on-surface-muted)' }}>
            Skor kuantitatif 0–100 yang menggambarkan tingkat keparahan kerusakan jalan, dihitung secara otomatis dari hasil deteksi AI. Semakin rendah skor, semakin parah kerusakannya.
          </motion.p>

          {/* Visual Score Bar */}
          <motion.div variants={fadeUp} custom={3} className="mt-8 max-w-[600px]">
            <div className="flex rounded-2xl overflow-hidden h-12" style={{ border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-center text-xs font-bold text-white" style={{ width: '40%', background: '#ef4444' }}>
                PARAH · 0-39
              </div>
              <div className="flex items-center justify-center text-xs font-bold" style={{ width: '30%', background: '#facc15', color: '#78350f' }}>
                SEDANG · 40-69
              </div>
              <div className="flex items-center justify-center text-xs font-bold text-white" style={{ width: '30%', background: '#22c55e' }}>
                RINGAN · 70-100
              </div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>0</span>
              <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>39</span>
              <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>69</span>
              <span className="text-[10px] font-bold" style={{ color: '#22c55e' }}>100</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Categories */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Kategori</span>
            <h2 className="display-serif text-3xl mb-8">Tiga tingkat keparahan.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                variants={fadeUp} custom={i + 1}
                className="rounded-[28px] p-7 flex flex-col"
                style={{ background: cat.bgColor, border: `1px solid ${cat.borderColor}` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cat.color + '20', color: cat.color }}>
                    {cat.iconType === 'alert' && <AlertTriangle size={20} />}
                    {cat.iconType === 'warning' && <ShieldAlert size={20} />}
                    {cat.iconType === 'ok' && <ShieldCheck size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: cat.color }}>{cat.label}</h3>
                    <span className="text-xs font-semibold" style={{ color: cat.color }}>Skor {cat.range}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>{cat.desc}</p>
                <div className="mt-auto p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${cat.borderColor}` }}>
                  <span className="eyebrow block mb-1" style={{ fontSize: '9px', color: cat.color }}>Tindak Lanjut</span>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-on-surface)' }}>{cat.action}</p>
                </div>
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <span className="eyebrow block mb-1" style={{ fontSize: '9px' }}>Contoh</span>
                  <p className="text-[11px]" style={{ color: 'var(--color-on-surface-muted)' }}>{cat.example}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Formula */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Cara Perhitungan</span>
            <h2 className="display-serif text-3xl mb-8">Formula matematis.</h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="tile p-8 mb-6 text-center">
            <div className="display-serif text-4xl md:text-5xl mb-6" style={{ color: 'var(--color-brand-blue)', letterSpacing: '-0.02em' }}>
              RDS = 100 − Σ P<sub>i</sub>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              {formulaParts.map(fp => (
                <div key={fp.symbol} className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono px-2 py-1 rounded-lg" style={{ background: fp.color + '15', color: fp.color }}>{fp.symbol}</span>
                  <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>{fp.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
              Di mana <strong>Pᵢ</strong> = bobot penalti untuk setiap kerusakan yang terdeteksi oleh AI
            </p>
          </motion.div>

          {/* Penalty Weights */}
          <motion.div variants={fadeUp} custom={2} className="tile p-6">
            <span className="eyebrow block mb-4" style={{ color: 'var(--color-brand-blue)' }}>Bobot Penalti per Deteksi</span>
            <div className="space-y-3">
              {penaltyWeights.map(pw => (
                <div key={pw.type} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: pw.color + '20' }}>
                    <span className="display-serif text-2xl" style={{ color: pw.color }}>−{pw.weight}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{pw.type}</h4>
                    <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>{pw.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: pw.color + '15', color: pw.color }}>
                      −{pw.weight} poin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Interactive Calculator */}
        <RDSCalculator />

        {/* Example Cases */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Studi Kasus</span>
            <h2 className="display-serif text-3xl mb-8">Contoh perhitungan nyata.</h2>
          </motion.div>

          <div className="space-y-4">
            {exampleCases.map((ec, i) => (
              <motion.div key={ec.title} variants={fadeUp} custom={i + 1} className="tile p-0 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
                  <div className="p-7">
                    <h3 className="text-sm font-bold mb-2">{ec.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="eyebrow" style={{ fontSize: '9px', width: '65px' }}>Deteksi:</span>
                        <span className="text-xs font-medium">{ec.detections}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="eyebrow" style={{ fontSize: '9px', width: '65px' }}>Hitung:</span>
                        <span className="text-sm font-mono font-bold" style={{ color: 'var(--color-brand-blue)' }}>{ec.calc}</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>{ec.desc}</p>
                  </div>
                  <div className="flex items-center justify-center p-8" style={{ background: ec.color + '10', borderLeft: `1px solid ${ec.color}30`, minWidth: '160px' }}>
                    <div className="text-center">
                      <span className="display-serif block text-5xl" style={{ color: ec.color }}>{ec.score}</span>
                      <span className="text-xs font-bold uppercase tracking-wider mt-1 block" style={{ color: ec.color }}>{ec.verdict}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="tile-ribbon flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow)' }}>Lihat Secara Langsung</span>
            <h3 className="display-serif text-2xl md:text-3xl text-white">Buka peta dan lihat skor RDS di lapangan.</h3>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={onNavigateMap} className="btn-primary text-sm px-6 py-3.5">
              Lihat Peta <ArrowRight size={16} />
            </button>
            <button onClick={() => onEnter('warga')} className="btn-secondary text-sm px-6 py-3.5" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Mulai Lapor
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
