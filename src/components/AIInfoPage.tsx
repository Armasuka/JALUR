import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight, BrainCircuit, Camera, Settings, BarChart3, Upload } from './icons';
import { motion } from 'motion/react';

interface AIInfoPageProps {
  onBack: () => void;
  onEnter: (role: 'warga' | 'admin') => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease }
  })
};

const damageTypes = [
  {
    name: 'Pothole',
    nameId: 'Lubang Jalan',
    desc: 'Cekungan berbentuk mangkuk pada permukaan jalan yang disebabkan oleh erosi air, beban lalu lintas berlebih, atau material konstruksi yang buruk.',
    cause: 'Di Kecamatan Kemang, lubang jalan sering terjadi karena drainase yang kurang memadai dan beban truk material bangunan yang melewati jalan desa.',
    severity: 'Tinggi',
    color: '#ef4444',
    images: ['/images/pothole-1.png', '/images/pothole-2.png', '/images/pothole-3.png'],
  },
  {
    name: 'Linear Crack',
    nameId: 'Retak Memanjang',
    desc: 'Retakan yang membentang searah atau melintang terhadap arah jalan, biasanya terjadi karena penurunan tanah, kelelahan material, atau siklus panas-dingin.',
    cause: 'Kontur tanah Kemang yang berbukit menyebabkan pergerakan tanah dan tekanan struktural yang memicu retakan memanjang pada aspal.',
    severity: 'Sedang',
    color: '#facc15',
    images: ['/images/crack-long-1.png', '/images/crack-long-2.png', '/images/crack-long-3.png'],
  },
  {
    name: 'Alligator Crack',
    nameId: 'Retak Buaya',
    desc: 'Pola retakan saling terhubung menyerupai kulit buaya, menandakan kerusakan struktural serius pada lapisan bawah jalan.',
    cause: 'Kombinasi beban kendaraan berat dan resapan air hujan di area Kemang yang curah hujannya tinggi mempercepat degradasi fondasi jalan.',
    severity: 'Sangat Tinggi',
    color: '#ef4444',
    images: ['/images/crack-alligator-1.png', '/images/crack-alligator-2.png', '/images/crack-alligator-3.png'],
  },
];

function ImageSlider({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % images.length), 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="relative aspect-[16/10] overflow-hidden">
        {images.map((img, i) => (
          <img
            key={img}
            src={img}
            alt={`${alt} ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? 'scale(1)' : 'scale(1.05)',
            }}
          />
        ))}
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
              transform: i === current ? 'scale(1.3)' : 'scale(1)',
              border: 'none', cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AIInfoPage({ onBack, onEnter }: AIInfoPageProps) {
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
          <button onClick={() => onEnter('warga')} className="btn-primary text-sm px-5 py-2.5">
            Coba Lapor <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" className="mb-16">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-brand-blue)' }}>
              <BrainCircuit size={24} className="text-white" />
            </div>
            <span className="eyebrow" style={{ color: 'var(--color-brand-blue)' }}>Teknologi AI</span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="display-serif mb-4" style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05 }}>
            Computer Vision<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>untuk Infrastruktur.</em>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base leading-relaxed max-w-[600px]" style={{ color: 'var(--color-on-surface-muted)' }}>
            JALUR menggunakan model YOLOv11 — state-of-the-art dalam object detection — untuk menganalisis kerusakan jalan secara otomatis dari foto yang dikirim warga.
          </motion.p>
        </motion.div>

        {/* What is Computer Vision */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="tile p-8">
              <span className="eyebrow block mb-3" style={{ color: 'var(--color-brand-blue)' }}>Apa Itu Computer Vision?</span>
              <h2 className="display-serif text-2xl mb-4">Mesin yang bisa "melihat".</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>
                Computer Vision adalah cabang kecerdasan buatan yang memungkinkan komputer memahami dan menginterpretasikan gambar visual — sama seperti mata dan otak manusia, namun dengan kecepatan dan konsistensi yang jauh lebih tinggi.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>
                Dalam konteks JALUR, teknologi ini digunakan untuk mendeteksi jenis kerusakan jalan dari foto yang diambil warga menggunakan ponsel biasa — tidak perlu alat khusus atau keahlian teknis.
              </p>
            </div>
            <div className="tile p-8" style={{ background: 'var(--color-brand-blue)', color: '#fff' }}>
              <span className="eyebrow block mb-3" style={{ color: 'var(--color-brand-yellow)' }}>Model YOLOv11</span>
              <h2 className="display-serif text-2xl mb-4" style={{ color: '#fff' }}>You Only Look Once.</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                YOLO (You Only Look Once) adalah arsitektur neural network yang memproses gambar dalam satu kali inferensi — memungkinkan deteksi objek secara realtime dengan akurasi tinggi.
              </p>
              <div className="space-y-3 mt-6">
                {[
                  { label: 'Versi', value: 'YOLOv11n' },
                  { label: 'Kecepatan', value: '< 2 detik / foto' },
                  { label: 'Input', value: 'Foto JPG/PNG biasa' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Cara Kerja</span>
            <h2 className="display-serif text-3xl mb-8">Dari foto ke analisis, otomatis.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Upload Foto', desc: 'Warga mengirim foto kerusakan jalan melalui form laporan.', icon: <Camera size={28} /> },
              { step: '02', title: 'Preprocessing', desc: 'Gambar dikompresi dan dinormalisasi untuk model AI.', icon: <Settings size={28} /> },
              { step: '03', title: 'Inferensi AI', desc: 'YOLOv11 mendeteksi dan mengklasifikasi jenis kerusakan.', icon: <BrainCircuit size={28} /> },
              { step: '04', title: 'Skor RDS', desc: 'Road Damage Score dihitung dari hasil deteksi.', icon: <BarChart3 size={28} /> },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i + 1} className="tile p-6 text-center relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue)' }}>{s.icon}</div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full inline-block mb-3" style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}>{s.step}</span>
                <h3 className="text-sm font-bold mb-2">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>{s.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-1/2 -right-3 text-lg" style={{ color: 'var(--color-border)' }}>→</div>}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Damage Types */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>Jenis Kerusakan yang Dideteksi</span>
            <h2 className="display-serif text-3xl mb-8">Tiga kategori utama.</h2>
          </motion.div>

          <div className="space-y-6">
            {damageTypes.map((dt, i) => (
              <motion.div
                key={dt.name}
                variants={fadeUp} custom={i + 1}
                className="tile p-0 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-3 h-3 rounded-full" style={{ background: dt.color }} />
                      <span className="eyebrow" style={{ color: dt.color }}>{dt.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                        background: dt.color + '20', color: dt.color,
                      }}>Severity: {dt.severity}</span>
                    </div>
                    <h3 className="display-serif text-2xl mb-3">{dt.nameId}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>{dt.desc}</p>
                    <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
                      <span className="eyebrow block mb-1" style={{ fontSize: '9px' }}>Penyebab di Kemang</span>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>{dt.cause}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <ImageSlider images={dt.images} alt={dt.nameId} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Accuracy Stats */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="tile-ribbon p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
              <div>
                <span className="display-serif block text-5xl text-white mb-2">&lt;2s</span>
                <span className="eyebrow block" style={{ color: 'var(--color-brand-yellow)' }}>Waktu Inferensi</span>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Dari upload hingga hasil deteksi selesai</p>
              </div>
              <div>
                <span className="display-serif block text-5xl text-white mb-2">3</span>
                <span className="eyebrow block" style={{ color: 'var(--color-brand-yellow)' }}>Kelas Deteksi</span>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Pothole, Linear Crack, Alligator Crack</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="display-serif text-2xl mb-4">Ingin mencoba?</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-on-surface-muted)' }}>Upload foto kerusakan jalan dan lihat bagaimana AI menganalisisnya secara otomatis.</p>
          <button onClick={() => onEnter('warga')} className="btn-primary text-base px-8 py-4">
            Coba Lapor Sekarang <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
