import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { StoreMap } from './StoreMap';

interface StoreDirectionsMapProps {
  storeName: string;
  storeLat: number;
  storeLng: number;
}

export const StoreDirectionsMap: React.FC<StoreDirectionsMapProps> = ({ storeName, storeLat, storeLng }) => {
  const handleOpenDirections = () => {
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${storeLat}%2C${storeLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-4">
      <StoreMap lat={storeLat} lng={storeLng} name={storeName} />
      <Button onClick={handleOpenDirections} variant="outline" className="w-full">
        <ExternalLink className="mr-2 h-4 w-4" /> Open in OpenStreetMap
      </Button>
    </div>
  );
};

export default StoreDirectionsMap;
