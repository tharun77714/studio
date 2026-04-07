"use client";

interface StoreMapProps {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export function StoreMap({ lat, lng }: StoreMapProps) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return <iframe title="Store map" src={src} style={{ height: '250px', width: '100%', borderRadius: 12 }} className="border" />;
}
