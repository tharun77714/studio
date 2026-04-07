"use client";

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface StoreLocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelectAction: (location: { lat: number; lng: number }) => void;
}

function LocationMarker({
  position,
  onMove,
}: {
  position: { lat: number; lng: number };
  onMove: (location: { lat: number; lng: number }) => void;
}) {
  const map = useMapEvents({
    click(event) {
      onMove({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return <Marker position={position} icon={DefaultIcon} draggable eventHandlers={{ dragend: (event) => onMove(event.target.getLatLng()) }} />;
}

export function StoreLocationPicker({ initialLocation, onLocationSelectAction }: StoreLocationPickerProps) {
  const { toast } = useToast();
  const [latInput, setLatInput] = useState((initialLocation?.lat ?? 17.720378).toString());
  const [lngInput, setLngInput] = useState((initialLocation?.lng ?? 83.224887).toString());
  const [loadingGeolocation, setLoadingGeolocation] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setLatInput(initialLocation.lat.toString());
      setLngInput(initialLocation.lng.toString());
    }
  }, [initialLocation]);

  const parsedLat = Number(latInput);
  const parsedLng = Number(lngInput);
  const position = useMemo(
    () => ({
      lat: Number.isNaN(parsedLat) ? 17.720378 : parsedLat,
      lng: Number.isNaN(parsedLng) ? 83.224887 : parsedLng,
    }),
    [parsedLat, parsedLng]
  );

  const updatePosition = (location: { lat: number; lng: number }) => {
    setLatInput(location.lat.toString());
    setLngInput(location.lng.toString());
  };

  const handleUseMyLocation = () => {
    setLoadingGeolocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        updatePosition({ lat: nextLat, lng: nextLng });
        setLoadingGeolocation(false);
      },
      () => {
        toast({
          title: 'Geolocation Error',
          description: 'Could not retrieve your current location.',
          variant: 'destructive',
        });
        setLoadingGeolocation(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <Button type="button" onClick={handleUseMyLocation} disabled={loadingGeolocation}>
        {loadingGeolocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
        Use My Current Location
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Input value={latInput} onChange={(event) => setLatInput(event.target.value)} placeholder="Latitude" />
        <Input value={lngInput} onChange={(event) => setLngInput(event.target.value)} placeholder="Longitude" />
      </div>

      <Button type="button" variant="secondary" onClick={() => onLocationSelectAction(position)}>
        Save Location
      </Button>

      <div className="h-[320px] w-full overflow-hidden rounded-lg border">
        <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker position={position} onMove={updatePosition} />
        </MapContainer>
      </div>
    </div>
  );
}
