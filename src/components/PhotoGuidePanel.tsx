import React, { useState } from 'react';
const ease = [0.22, 1, 0.36, 1] as const;
import { ChevronRight, Camera, Ruler, Sun, Target, Scale } from './icons';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoGuidePanelProps {
  defaultOpen?: boolean;
}

const tips = [
  {
    title: 'Jarak ideal',
    desc: 'Ambil foto dari jarak ~1-2 meter. Terlalu dekat membuat kerusakan tidak terlihat utuh, terlalu jauh membuat detail tidak jelas.',
    Icon: Ruler,
  },
  {
    title: 'Pencahayaan',
    desc: 'Gunakan cahaya alami (siang hari). Hindari foto Gegen starkON atau backlit yang membuat kerusakan sulit terlihat.',
    Icon: Sun,
  },
  {
    title: 'Fokus & ketajaman',
    desc: 'Pastikan foto tidak blur. Tekan ringan pada layar untuk mengunci fokus pada titik kerusakan.',
    Icon: Target,
  },
  {
    title: 'Tunjukkan ukuran',
    desc: 'Foto dari angle yang menunjukkan kedalaman atau lebar kerusakan. Jika memungkinkan, letakkan objek recognizable (botol, uang koin) sebagai skala.',
    Icon: Scale,
  },
];

export default function PhotoGuidePanel({ defaultOpen = false }: PhotoGuidePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-brand-blue-50)',
        border: '1px solid var(--color-brand-blue-100)',
      }}
    >
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-80"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-brand-blue)', color: 'var(--color-brand-yellow)' }}
          >
            <Camera className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-brand-blue)' }}>
              Panduan Foto yang Baik
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-on-surface-muted)' }}>
              Tips agar AI dapat menganalisis dengan akurat
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
              style={{ borderTop: '1px solid var(--color-brand-blue-100)' }}
            >
              {tips.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 pt-4"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-brand-blue-50)' }}
                  >
                    <tip.Icon className="w-4 h-4" style={{ color: 'var(--color-brand-blue)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-brand-blue)' }}>
                      {tip.title}
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-on-surface-muted)' }}>
                      {tip.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}