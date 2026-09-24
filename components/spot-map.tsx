'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TokunoshimaSpot } from '@/lib/tokunoshima-spots';

// カテゴリ別のマーカー色
const categoryColors: Record<string, string> = {
  beach: '#0ea5e9', // 海水浴場: 水色
  surf: '#f97316', // サーフ: オレンジ
  fishing: '#10b981', // 釣り場: 緑
};

const categoryLabels: Record<string, string> = {
  beach: '海水浴場',
  surf: 'サーフ',
  fishing: '釣り場',
};

// カスタムdivアイコンを生成
function createIcon(category: string) {
  const color = categoryColors[category] || '#64748b';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

interface SpotMapProps {
  spots: TokunoshimaSpot[];
  center: [number, number];
  zoom?: number;
}

// 表示するスポットに合わせて地図の範囲を自動調整
function FitBounds({ spots }: { spots: TokunoshimaSpot[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length === 0) return;
    const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [spots, map]);
  return null;
}

export default function SpotMap({ spots, center, zoom = 11 }: SpotMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds spots={spots} />
      {spots.map((spot, index) => (
        <Marker
          key={`${spot.name}-${index}`}
          position={[spot.lat, spot.lng]}
          icon={createIcon(spot.category)}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px' }}>
                {spot.name}
              </p>
              <p style={{ fontSize: '11px', color: '#0ea5e9', margin: '0 0 4px' }}>
                {categoryLabels[spot.category]} ・ {spot.town}
              </p>
              <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 6px', lineHeight: 1.5 }}>
                {spot.description}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#0ea5e9', textDecoration: 'underline' }}
              >
                Googleマップで開く
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
