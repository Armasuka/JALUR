import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from '../types';
import kemangData from '../kemangPolygon.json';

interface MapDisplayProps {
  reports: Report[];
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
}

export default function MapDisplay({ reports, onBoundsChange }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [-6.4952, 106.7423],
      zoom: 13,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    if (kemangData) {
      L.geoJSON(kemangData as any, {
        style: {
          color: '#1e3a8a',
          weight: 3,
          fillColor: '#fef08a',
          fillOpacity: 0.15,
          dashArray: '8, 4',
        }
      }).addTo(map);
    }

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    // Notify parent of bounds changes
    const handleMove = () => onBoundsChange?.(map.getBounds());
    map.on('zoomend moveend', handleMove);
    handleMove();

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.eachLayer(layer => {
      if ((layer as any).options?.pane === 'markerPane') {
        map.removeLayer(layer);
      }
    });

    reports.forEach(report => {
      const color = report.rdsScore < 40 ? '#ef4444' : report.rdsScore < 70 ? '#f59e0b' : '#22c55e';

      const icon = L.divIcon({
        className: 'rds-dot',
        html: `<div style="
          width: 28px;
          height: 18px;
          background: ${color};
          border: 2px solid white;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
          font-family: monospace;
        ">${report.rdsScore > 0 ? report.rdsScore : '--'}</div>`,
        iconSize: [28, 18],
        iconAnchor: [14, 9],
      });

      L.marker([report.latitude, report.longitude], { icon })
        .bindPopup(`
          <div style="padding:8px;min-width:150px;">
            <p style="font-weight:600;margin:0 0 4px;">RDS: ${report.rdsScore || '--'}</p>
            <p style="font-size:12px;color:#666;margin:0;">${report.address || 'Kemang, Bogor'}</p>
          </div>
        `)
        .addTo(map);
    });
  }, [reports]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  );
}
