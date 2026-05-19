"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const readOnlyMarker = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface StoreMapViewProps {
  lat: number;
  lng: number;
}

export function StoreMapView({ lat, lng }: StoreMapViewProps) {
  const [mapKey, setMapKey] = useState<number>(0);

  useEffect(() => {
    // This forces React to create a brand new DOM element for the map 
    // whenever it mounts or hot-reloads, completely bypassing the 
    // "Map container is already initialized" error in StrictMode.
    setMapKey(Math.random());
  }, []);

  if (mapKey === 0) return null;

  return (
    <MapContainer
      key={mapKey}
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-[300px] w-full rounded-lg border"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={readOnlyMarker} />
    </MapContainer>
  );
}
