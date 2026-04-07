"use client";

import Link from 'next/link';
import type { Store as StoreType } from './store-card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface GoogleMapViewProps {
  stores: StoreType[];
  center?: { lat: number; lng: number } | null;
  searchActive: boolean;
}

function buildMapUrl(center: { lat: number; lng: number }, stores: StoreType[]) {
  const points = stores
    .filter((store) => store.latitude && store.longitude)
    .map((store) => `${store.latitude},${store.longitude}`);

  const markerQuery = points.length > 0 ? `&mlat=${center.lat}&mlon=${center.lng}` : '';
  return `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.3}%2C${center.lat - 0.3}%2C${center.lng + 0.3}%2C${center.lat + 0.3}&layer=mapnik${markerQuery}`;
}

export function GoogleMapView({ stores, center }: GoogleMapViewProps) {
  const fallbackCenter = center
    ? center
    : stores.length > 0
      ? { lat: stores[0].latitude, lng: stores[0].longitude }
      : { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="space-y-4">
      <iframe
        title="Store map"
        src={buildMapUrl(fallbackCenter, stores)}
        className="h-[350px] w-full rounded-lg border"
      />

      {stores.length > 0 && (
        <div className="space-y-2">
          {stores.slice(0, 5).map((store) => (
            <div key={store.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{store.name}</div>
                <div className="text-xs text-muted-foreground">{store.address}</div>
              </div>
              <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link href={`/dashboard/store/${store.id}`}>
                  View Store <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
