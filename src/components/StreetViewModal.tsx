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
  // Generate static map using OSM tiles directly
  const zoom = 17;
  const lat = report.latitude;
  const lon = report.longitude;

  // Calculate tile coordinates
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);

  // Build tile URLs for 3x3 grid
  const tileBase = 'https://tile.openstreetmap.org';
  const tiles = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push(`${tileBase}/${zoom}/${xtile + dx}/${ytile + dy}.png`);
    }
  }

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
          {/* Satellite Map Preview - OSM Tiles */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '3px solid white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            position: 'relative',
            background: '#e5e7eb',
          }}>
            {/* 3x3 Tile Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              width: '100%',
              height: '280px',
            }}>
              {tiles.map((tileUrl, i) => (
                <img
                  key={i}
                  src={tileUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    gridColumn: (i % 3) + 1,
                    gridRow: Math.floor(i / 3) + 1,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ))}
            </div>
            {/* Marker overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}>
              <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
                <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="#ef4444"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            </div>
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
