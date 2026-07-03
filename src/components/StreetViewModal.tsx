import React from 'react';
import { Report } from '../types';
import MapPin from './icons/MapPin';
import ExternalLink from './icons/ExternalLink';
import StreetView from './icons/StreetView';

interface StreetViewModalProps {
  report: Report | null;
  onClose: () => void;
}

export default function StreetViewModal({ report, onClose }: StreetViewModalProps) {
  if (!report) return null;

  const googleMapsUrl = `https://www.google.com/maps?q=${report.latitude},${report.longitude}&layer=sv`;
  const osmStaticUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${report.latitude},${report.longitude}&zoom=17&size=600x400&markers=${report.latitude},${report.longitude},red-pushpin`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '580px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <StreetView size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Lokasi Laporan
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {report.kodeUnik || 'Laporan'} · {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4b5563',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Map Preview */}
        <div style={{
          background: '#f3f4f6',
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          gap: '16px',
        }}>
          {/* Satellite Map Preview */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '3px solid white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            position: 'relative',
          }}>
            <img
              src={osmStaticUrl}
              alt="Lokasi satelit"
              style={{
                width: '100%',
                height: '280px',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const container = e.currentTarget.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div style="width:100%;height:280px;background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style="font-size:13px;color:#6b7280;">Gagal memuat peta</span>
                    </div>
                  `;
                }
              }}
            />
            {/* Overlay badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <MapPin size={14} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>
                Titik Laporan
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px 20px',
            width: '100%',
            maxWidth: '520px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#4b5563' }}>
              Klik tombol di bawah untuk melihat lokasi di Google Maps dengan opsi Street View
            </p>

            {/* Tombol utama */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 4px 14px rgba(26,115,232,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,115,232,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,115,232,0.35)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V7"/>
                <path d="M21 7L12 2L3 7"/>
                <path d="M12 12V22"/>
                <path d="M12 12L19 7"/>
                <path d="M12 12L5 7"/>
              </svg>
              Buka di Google Maps
              <ExternalLink size={14} />
            </a>

            <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              Di Google Maps, klik ikon Pegman (orang) di kanan bawah untuk melihat Street View
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#374151'}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
