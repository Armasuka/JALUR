import React from 'react';
const ease = [0.22, 1, 0.36, 1] as const;
import { ChevronLeft, ArrowRight, Upload, MapPin, BrainCircuit, CheckCircle, Camera, Crosshair, FileText, BarChart3 } from './icons';
import { motion } from 'motion/react';

interface HowToPageProps {
  onBack: () => void;
  onEnter: (role: 'warga' | 'admin') => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease }
  })
};

const steps = [
  {
    number: '01',
    icon: <Camera size={22} />,
    title: 'Foto Kerusakan',
    subtitle: 'Ambil foto jalan yang rusak',
    desc: 'Gunakan kamera ponsel Anda untuk mengambil foto kerusakan jalan. Pastikan foto jelas, tidak blur, dan memperlihatkan kerusakan dengan jelas. Anda bisa mengambil hingga 3 foto dari sudut berbeda untuk hasil deteksi yang lebih akurat.',
    tips: ['Ambil dari jarak 1-2 meter', 'Pastikan pencahayaan cukup', 'Hindari foto yang terlalu blur', 'Bisa upload hingga 3 foto'],
    color: '#3b82f6',
  },
  {
    number: '02',
    icon: <Crosshair size={22} />,
    title: 'Lokasi Otomatis',
    subtitle: 'GPS menentukan titik kerusakan',
    desc: 'Sistem akan secara otomatis mendeteksi lokasi GPS Anda saat membuat laporan. Anda juga bisa mengklik pada peta untuk menentukan lokasi secara manual jika GPS tidak akurat.',
    tips: ['Izinkan akses lokasi di browser', 'Pastikan GPS aktif', 'Bisa koreksi manual lewat peta', 'Alamat terisi otomatis'],
    color: '#22c55e',
  },
  {
    number: '03',
    icon: <FileText size={22} />,
    title: 'Isi Deskripsi',
    subtitle: 'Jelaskan kondisi kerusakan',
    desc: 'Tambahkan deskripsi singkat tentang kondisi jalan. Sertakan informasi seperti ukuran kerusakan, sudah berapa lama, dan apakah mengganggu arus lalu lintas.',
    tips: ['Jelaskan kondisi jalan', 'Sebutkan sejak kapan', 'Cantumkan email untuk notifikasi', 'Info tambahan sangat membantu'],
    color: '#f59e0b',
  },
  {
    number: '04',
    icon: <BrainCircuit size={22} />,
    title: 'AI Menganalisis',
    subtitle: 'YOLOv11 mendeteksi kerusakan',
    desc: 'Setelah laporan terkirim, AI kami (YOLOv11) akan menganalisis foto yang Anda kirim. Sistem akan mendeteksi jenis kerusakan — pothole, retak memanjang, atau retak buaya — secara otomatis.',
    tips: ['Proses kurang dari 2 detik', 'Deteksi 3 jenis kerusakan', 'Model YOLOv11n terlatih', 'Bounding box pada foto'],
    color: '#8b5cf6',
  },
  {
    number: '05',
    icon: <BarChart3 size={22} />,
    title: 'Skor & Tindak Lanjut',
    subtitle: 'Road Damage Score dihitung',
    desc: 'Setiap laporan mendapatkan Road Damage Score (RDS) dari 0 hingga 100. Skor ini membantu pihak berwenang memprioritaskan perbaikan. Laporan Anda akan muncul di peta publik dan bisa dilacak statusnya.',
    tips: ['Skor 0-39 = Parah', 'Skor 40-69 = Sedang', 'Skor 70-100 = Ringan', 'Pantau status di peta'],
    color: '#ef4444',
  },
];

const faqs = [
  {
    q: 'Apakah saya perlu login untuk melapor?',
    a: 'Tidak, Anda hanya perlu masuk sebagai "Warga" tanpa login. Cukup sertakan email untuk notifikasi tindak lanjut.'
  },
  {
    q: 'Berapa lama proses analisis AI?',
    a: 'Proses deteksi AI memakan waktu kurang dari 2 detik setelah foto diupload. Hasilnya langsung terlihat di halaman riwayat.'
  },
  {
    q: 'Apakah data lokasi saya aman?',
    a: 'Lokasi GPS hanya digunakan untuk menandai titik kerusakan di peta. Kami tidak menyimpan data pribadi selain email dan lokasi laporan.'
  },
  {
    q: 'Bagaimana cara melihat status laporan saya?',
    a: 'Setelah melapor, Anda bisa menggunakan kode unik yang diberikan untuk melacak status laporan di halaman Riwayat.'
  },
  {
    q: 'Apakah bisa melapor dari luar Kecamatan Kemang?',
    a: 'Saat ini JALUR difokuskan untuk wilayah Kecamatan Kemang, Bogor. Namun sistem tetap bisa menerima laporan dari lokasi lain.'
  },
  {
    q: 'Apa yang terjadi setelah saya melapor?',
    a: 'Laporan Anda akan ditampilkan di peta publik, dianalisis AI untuk mendapatkan skor kerusakan, lalu ditinjau oleh admin kecamatan untuk tindak lanjut.'
  },
];

export default function HowToPage({ onBack, onEnter }: HowToPageProps) {
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
            Mulai Lapor <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" className="mb-16 text-center">
          <motion.span variants={fadeUp} custom={0} className="eyebrow inline-block mb-3" style={{ color: 'var(--color-brand-blue)' }}>
            Panduan Lengkap
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="display-serif mb-4" style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05 }}>
            Lapor dalam<br /><em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-brand-blue)' }}>5 langkah mudah.</em>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base leading-relaxed max-w-[550px] mx-auto" style={{ color: 'var(--color-on-surface-muted)' }}>
            Tidak perlu keahlian khusus. Siapa pun bisa berkontribusi memperbaiki jalan di Kecamatan Kemang melalui JALUR.
          </motion.p>
        </motion.div>

        {/* Timeline Steps */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-px" style={{ background: 'var(--color-border)' }} />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                custom={i}
                className={`flex flex-col md:flex-row items-start gap-6 mb-12 ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                  <div className={`tile p-6 md:p-8 inline-block text-left`} style={{ maxWidth: '480px' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: step.color + '15', color: step.color }}>{step.icon}</div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: step.color, color: '#fff' }}>{step.number}</span>
                    </div>
                    <h3 className="display-serif text-xl mb-1">{step.title}</h3>
                    <p className="text-xs font-semibold mb-3" style={{ color: step.color }}>{step.subtitle}</p>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-on-surface-muted)' }}>{step.desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {step.tips.map(tip => (
                        <div key={tip} className="flex items-start gap-1.5">
                          <CheckCircle size={12} className="shrink-0 mt-0.5" />
                          <span className="text-[11px]" style={{ color: 'var(--color-on-surface-muted)' }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full shrink-0 z-10" style={{ background: step.color, boxShadow: `0 0 0 6px var(--color-surface-cream), 0 0 0 7px ${step.color}40` }}>
                  <span className="text-white font-bold text-sm">{step.number}</span>
                </div>

                {/* Empty space for alignment */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          className="mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-blue)' }}>FAQ</span>
            <h2 className="display-serif text-3xl">Pertanyaan yang Sering Ditanyakan</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[900px] mx-auto">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 1} className="tile p-6">
                <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-brand-blue)' }}>{faq.q}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>{faq.a}</p>
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
            <span className="eyebrow block mb-2" style={{ color: 'var(--color-brand-yellow)' }}>Sudah Paham?</span>
            <h3 className="display-serif text-2xl md:text-3xl text-white">Yuk, mulai berkontribusi sekarang.</h3>
          </div>
          <button onClick={() => onEnter('warga')} className="btn-primary text-base px-8 py-4 shrink-0">
            Mulai Lapor <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
