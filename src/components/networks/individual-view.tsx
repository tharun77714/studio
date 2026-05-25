"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JewelryCard } from './jewelry-card';
// import { MapPlaceholder } from './map-placeholder'; // Replaced by GoogleMapView
import { motion } from 'framer-motion';
import { GoogleMapView } from './google-map-view'; // Import the new map component
import { Search, Lightbulb, GalleryVertical, Compass, Loader2, Store as StoreIcon, LocateFixed, AlertTriangle, Building, Map } from 'lucide-react'; // Added Map icon
import type { SuggestJewelryOutput } from '@/ai/flows/suggest-jewelry';
import { suggestJewelryAction } from '@/lib/actions/ai-actions';
import { getRegisteredBusinesses } from '@/lib/actions/supabase-actions'; 
import { useToast } from "@/hooks/use-toast"
import { Separator } from '../ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getDistance, cn } from '@/lib/utils';
import type { Store as StoreType } from './store-card'; 
import { StoreCard } from './store-card';
import { AddressAutocompleteInput } from '@/components/common/address-autocomplete-input';
import type { Profile } from '@/contexts/AuthContext'; // Ensure correct Profile type import

const mockFeaturedJewelry = [
  { id: '1', name: 'Elegant Diamond Necklace', type: 'Necklace', style: 'Classic', material: 'Diamond, White Gold', description: 'A timeless piece for special occasions.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'diamond necklace' },
  { id: '2', name: 'Bohemian Feather Earrings', type: 'Earrings', style: 'Boho', material: 'Silver, Feather', description: 'Lightweight and stylish for a free spirit.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'boho earrings' },
  { id: '3', name: 'Minimalist Gold Bangle', type: 'Bracelet', style: 'Minimalist', material: 'Gold', description: 'Sleek and modern, perfect for everyday wear.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'gold bangle' },
  { id: '4', name: 'Vintage Sapphire Ring', type: 'Ring', style: 'Vintage', material: 'Sapphire, Platinum', description: 'An exquisite ring with a touch of history.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'sapphire ring' },
];

const NEARBY_RADIUS_KM = 50;


export function IndividualNetworkView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<SuggestJewelryOutput['suggestions']>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // Changed to lat/lng
  const [searchedLocationCoords, setSearchedLocationCoords] = useState<{ lat: number; lng: number } | null>(null); // Changed to lat/lng
  
  const [allRegisteredStores, setAllRegisteredStores] = useState<StoreType[]>([]);
  const [displayedStores, setDisplayedStores] = useState<StoreType[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeSearchType, setActiveSearchType] = useState<'ai' | 'store_keyword' | 'store_gps' | 'store_address_radius' | 'none'>('none');
  const [searchOrigin, setSearchOrigin] = useState<'manual' | 'autocomplete_address'>('manual');


  const { toast } = useToast();

  const transformProfileToStore = (profile: Profile): StoreType => {
    return {
      id: profile.id,
      name: profile.business_name || 'Unnamed Business',
      address: profile.business_address_text || 'Address not available',
      type: profile.business_type || 'N/A',
      latitude: profile.business_address_lat || 0, // Keep these for store card/list
      longitude: profile.business_address_lng || 0, // Keep these for store card/list
      distance: undefined,
    };
  };
  
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true);
      const { data: businessProfiles, error } = await getRegisteredBusinesses();
      if (error) {
        toast({
          title: "Store Loading Error",
          description: `Could not load registered businesses: ${error.message}. RLS policies might need adjustment.`,
          variant: "destructive"
        });
        setAllRegisteredStores([]);
        setDisplayedStores([]);
      } else if (businessProfiles) {
        const stores = businessProfiles.map(transformProfileToStore);
        setAllRegisteredStores(stores);
        setDisplayedStores(stores); 
      } else {
        setAllRegisteredStores([]);
        setDisplayedStores([]);
      }
      setIsLoadingStores(false);
    };
    fetchStores();
  }, [toast]);


  const handleSearchSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!searchTerm.trim()) {
      toast({ title: "Search term empty", description: "Please enter what you're looking for.", variant: "destructive" });
      return;
    }

    setIsLoadingAi(true);
    setAiSuggestions([]);
    setLocationError(null); 
    
    const currentSearchOrigin = searchOrigin;
    setSearchOrigin('manual'); 

    const lowerSearchTerm = searchTerm.toLowerCase();

    if (currentSearchOrigin === 'autocomplete_address' && searchedLocationCoords) {
      setActiveSearchType('store_address_radius');
      setUserLocation(null); // Clear GPS location if address search is used
      if (allRegisteredStores.length === 0 && !isLoadingStores) {
        toast({ title: "No Registered Stores Found", description: "No businesses are currently listed in the system to search within." });
        setDisplayedStores([]);
      } else {
        const foundStores = allRegisteredStores.map(store => {
            const distance = getDistance(searchedLocationCoords.lat, searchedLocationCoords.lng, store.latitude, store.longitude);
            return { ...store, distance };
          }).filter(store => store.distance <= NEARBY_RADIUS_KM)
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        
        setDisplayedStores(foundStores);
        if (foundStores.length > 0) {
          toast({
            title: "Nearby Stores Found",
            description: `Found ${foundStores.length} registered store(s) within ${NEARBY_RADIUS_KM}km of "${searchTerm}".`,
          });
        } else {
          toast({
            title: "No Stores Found Nearby",
            description: `No registered stores found within ${NEARBY_RADIUS_KM}km of "${searchTerm}".`,
          });
        }
      }
    } else {
        let isStoreSearchIntent = false;
        const storeKeywords = ['store', 'shop', 'jeweler', 'near', 'in ', 'street', 'road', 'ave', 'avenue', 'blvd', 'boulevard', 'ln', 'lane', 'dr', 'drive', 'rd', 'market', 'center', 'plaza'];
        isStoreSearchIntent = storeKeywords.some(keyword => lowerSearchTerm.includes(keyword)) ||
                              allRegisteredStores.some(store => store.name.toLowerCase().includes(lowerSearchTerm) || store.address.toLowerCase().includes(lowerSearchTerm)) ||
                              (/\d/.test(lowerSearchTerm) && /[a-zA-Z]/.test(lowerSearchTerm) && lowerSearchTerm.length > 5);

        if (isStoreSearchIntent) {
          setActiveSearchType('store_keyword');
          setUserLocation(null); 
          setSearchedLocationCoords(null);
          const foundStores = allRegisteredStores.filter(store => 
            store.name.toLowerCase().includes(lowerSearchTerm) || 
            store.address.toLowerCase().includes(lowerSearchTerm)
          ).map(s => ({...s, distance: undefined })); 
          setDisplayedStores(foundStores);
          
          if (foundStores.length > 0) {
            toast({
              title: "Store Search Results",
              description: `Found ${foundStores.length} registered store(s) matching "${searchTerm}".`,
            });
          } else {
            toast({
              title: "No Stores Found",
              description: `No registered stores match "${searchTerm}".`,
            });
          }
        } else { 
          setActiveSearchType('ai');
          setUserLocation(null); 
          setSearchedLocationCoords(null);
          setDisplayedStores(allRegisteredStores.map(s => ({...s, distance: undefined }))); 
          try {
            const result = await suggestJewelryAction({ searchQuery: searchTerm });
            if (result && result.suggestions) {
              setAiSuggestions(result.suggestions);
              if (result.suggestions.length === 0) {
                toast({ title: "No Jewelry Suggestions Found", description: "Try a different search term for jewelry." });
              }
            } else {
              toast({ title: "AI Suggestion Error", description: "Could not fetch jewelry suggestions.", variant: "destructive" });
            }
          } catch (error) {
            console.error("AI Suggestion Error:", error);
            toast({ title: "AI Suggestion Error", description: "An unexpected error occurred while fetching jewelry suggestions.", variant: "destructive" });
          }
        }
    }
    setIsLoadingAi(false);
  };

  const handleFindNearbyStores = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      toast({ title: "Geolocation Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setAiSuggestions([]); 
    setActiveSearchType('store_gps');
    setSearchedLocationCoords(null); // Clear address search coords
    setSearchTerm(""); // Clear search term

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        if (allRegisteredStores.length === 0 && !isLoadingStores) {
            toast({ title: "No Registered Stores", description: "No businesses are currently listed in the system to search." });
            setDisplayedStores([]);
            setIsLocating(false);
            return;
        }
        
        const storesFound = allRegisteredStores.map(store => {
          const distance = getDistance(latitude, longitude, store.latitude, store.longitude);
          return { ...store, distance };
        }).filter(store => store.distance <= NEARBY_RADIUS_KM)
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

        setDisplayedStores(storesFound);
        setIsLocating(false);
        if (storesFound.length > 0) {
          toast({ title: "Nearby Registered Stores Found", description: `Found ${storesFound.length} registered store(s) within ${NEARBY_RADIUS_KM}km.` });
        } else {
          toast({ title: "No Nearby Registered Stores", description: `No registered stores found within ${NEARBY_RADIUS_KM}km of your location.` });
        }
      },
      (error) => {
        let message = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Permission denied. Please allow location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "The request to get user location timed out.";
        }
        setLocationError(message);
        setUserLocation(null);
        setDisplayedStores(allRegisteredStores.map(s => ({...s, distance: undefined }))); 
        toast({ title: "Location Error", description: message, variant: "destructive" });
        setIsLocating(false);
      }
    );
  };

  const isLoadingCombinedState = isLoadingAi || isLocating || isLoadingStores;
  
  const currentLoadingMessage = useMemo(() => {
    if (isLoadingStores) return "Loading Registered Stores...";
    if (isLocating) return "Getting your location & finding registered stores...";
    if (isLoadingAi && (activeSearchType === 'store_keyword' || activeSearchType === 'store_address_radius')) return "Searching Registered Stores...";
    if (isLoadingAi && activeSearchType === 'ai') return "AI Suggestions Loading...";
    return "Loading...";
  }, [isLoadingStores, isLocating, isLoadingAi, activeSearchType]);

  const registeredStoresTitleDescription = useMemo(() => {
    if (activeSearchType === 'store_gps' && userLocation) {
        return `Showing stores within ${NEARBY_RADIUS_KM}km of your current location, sorted by distance.`;
    }
    if (activeSearchType === 'store_address_radius' && searchedLocationCoords) {
        return `Showing stores within ${NEARBY_RADIUS_KM}km of "${searchTerm}", sorted by distance.`;
    }
    if (activeSearchType === 'store_keyword') {
        return `Showing registered stores matching "${searchTerm}".`;
    }
    return "Browse all registered businesses. Click a store to see their items. Use search or GPS to filter.";
  }, [activeSearchType, userLocation, searchedLocationCoords, searchTerm]);

  const mapCenter = useMemo(() => {
    if (activeSearchType === 'store_gps' && userLocation) return userLocation;
    if (activeSearchType === 'store_address_radius' && searchedLocationCoords) return searchedLocationCoords;
    // If only one store is displayed from keyword search, center on it.
    if (activeSearchType === 'store_keyword' && displayedStores.length === 1 && displayedStores[0].latitude && displayedStores[0].longitude) {
        return { lat: displayedStores[0].latitude, lng: displayedStores[0].longitude };
    }
    return null; // Let GoogleMapView handle default or fitBounds
  }, [activeSearchType, userLocation, searchedLocationCoords, displayedStores]);
  
  const isMapSearchActive = activeSearchType === 'store_gps' || activeSearchType === 'store_address_radius' || (activeSearchType === 'store_keyword' && displayedStores.length > 0);


  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Cinematic Hero Map & Search Bento Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.25, 1] }}
        className="relative w-full h-[60vh] min-h-[450px] max-h-[700px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
      >
        <div className="absolute inset-0 bg-black">
           <GoogleMapView stores={displayedStores.filter(s => s.latitude && s.longitude)} center={mapCenter} searchActive={isMapSearchActive} />
        </div>
        
        {/* Floating Glass Search Panel */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center px-4 pointer-events-none z-10">
          <div className="w-full max-w-3xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
            <h2 className="text-white font-medium text-lg mb-3 tracking-wide flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Global Boutique Network
            </h2>
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow relative">
                <AddressAutocompleteInput
                  onPlaceSelectedAction={(place) => {
                    if (place) {
                      setSearchTerm(place.address);
                      setSearchedLocationCoords({ lat: place.latitude, lng: place.longitude });
                      setSearchOrigin('autocomplete_address');
                    }
                  }}
                  initialValue={searchTerm}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary px-4"
                  placeholder="Enter a city or luxury boutique name..."
                />
              </div>
              <Button type="submit" disabled={isLoadingCombinedState} className="h-12 px-8 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] font-medium tracking-wide uppercase text-xs">
                {(isLoadingAi && !isLocating && !isLoadingStores) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Explore"}
              </Button>
            </form>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleFindNearbyStores} disabled={isLoadingCombinedState} variant="ghost" className="text-xs tracking-wider uppercase text-white/60 hover:text-primary hover:bg-white/5 rounded-lg h-8 transition-colors">
                {isLocating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <LocateFixed className="mr-2 h-3 w-3" />}
                Use Device Location
              </Button>
            </div>
          </div>
        </div>

        {/* Loading Overlay within Map */}
        {isLoadingCombinedState && activeSearchType !== 'ai' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white">
             <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
             <p className="tracking-widest uppercase text-xs font-medium text-white/80">{currentLoadingMessage}</p>
          </div>
        )}
      </motion.div>

      {/* Main Grid Below Hero */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left/Main Column: Registered Stores */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 1, 0.25, 1] }}
          className="xl:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-xl font-medium tracking-wide flex items-center gap-2 text-foreground">
              <Building className="h-5 w-5 text-primary" />
              Registered Boutiques
            </h3>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {displayedStores.length} found
            </span>
          </div>
          
          {isLoadingStores ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-[1.5rem] bg-white/5" />)}
             </div>
          ) : displayedStores.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedStores.map((store) => (
                  <Link href={`/dashboard/store/${store.id}`} key={store.id} legacyBehavior>
                      <a className="block group">
                        <div className="h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_15px_35px_rgba(212,175,55,0.12)] rounded-[1.5rem] border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          <StoreCard store={store} />
                        </div>
                      </a>
                  </Link>
                ))}
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-24 border border-white/5 rounded-[1.5rem] bg-black/20 backdrop-blur-md">
                 <StoreIcon className="h-12 w-12 text-white/10 mb-4" />
                 <p className="text-white/60 tracking-wide text-sm">No luxury boutiques found matching your criteria.</p>
             </div>
          )}
        </motion.div>

        {/* Right Column: AI / Gallery */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.25, 1] }}
          className="flex flex-col gap-6"
        >
          {activeSearchType === 'ai' && aiSuggestions.length > 0 ? (
             <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(212,175,55,0.05)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full" />
               <h3 className="text-lg font-medium tracking-wide flex items-center gap-2 text-primary mb-6 relative z-10">
                 <Lightbulb className="h-5 w-5" />
                 AI Style Analysis
               </h3>
               <ScrollArea className="w-full h-[500px] relative z-10">
                  <div className="flex flex-col gap-4 pr-4">
                      {aiSuggestions.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-primary/30 transition-colors">
                        <JewelryCard 
                            id={index.toString()} 
                            name={`${item.style} ${item.type}`} 
                            type={item.type}
                            style={item.style}
                            material={item.material}
                            description={item.description}
                            imageUrl={`https://placehold.co/300x200.png`} 
                            dataAiHint={`${item.style} ${item.type}`}
                        />
                      </div>
                      ))}
                  </div>
               </ScrollArea>
             </div>
          ) : (
             <div className="rounded-[1.5rem] border border-white/5 bg-black/20 p-6 backdrop-blur-md">
               <h3 className="text-lg font-medium tracking-wide flex items-center gap-2 mb-6 text-foreground">
                 <GalleryVertical className="h-5 w-5 text-accent" />
                 Curated Selection
               </h3>
               <div className="flex flex-col gap-4">
                  {mockFeaturedJewelry.slice(0, 2).map(item => (
                      <div key={item.id} className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden group hover:border-white/10 transition-colors">
                        <JewelryCard {...item} />
                      </div>
                  ))}
               </div>
               <Button variant="ghost" className="w-full mt-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary">
                 View Full Gallery
               </Button>
             </div>
          )}
        </motion.div>
      </div>

      {locationError && !isLocating && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-destructive/30 bg-destructive/10 rounded-xl flex items-center gap-3 mt-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive tracking-wide">{locationError}</p>
        </motion.div>
      )}
    </div>
  );
}
