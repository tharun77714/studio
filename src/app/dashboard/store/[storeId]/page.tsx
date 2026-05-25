"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JewelryCard, type JewelryItem as JewelryItemType } from '@/components/networks/jewelry-card';
import type { Store as StoreType } from '@/components/networks/store-card';
import {
  getProfile,
  getJewelryItemsByBusiness,
  getStoreReviews,
  getStoreRating,
  hasUserReviewedStore,
  submitStoreReview,
  updateStoreReview,
} from '@/lib/actions/supabase-actions';
import { ArrowLeft, MapPin, PackageSearch, AlertTriangle, ShoppingBag, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toggleFavoriteItem, getFavoriteItemIdsByUser } from '@/lib/actions/supabase-actions';
const StoreMapView = dynamic(() => import('@/components/networks/StoreMapView').then((mod) => mod.StoreMapView), {
  ssr: false,
});
import { useChat } from '@/contexts/ChatContext';

interface StoreReview {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile: currentUserProfile } = useAuth();
  const { openChatWithUser } = useChat();
  const storeId = params.storeId as string;

  const [storeDetails, setStoreDetails] = useState<StoreType | null>(null);
  const [storeItems, setStoreItems] = useState<JewelryItemType[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [avgRating, setAvgRating] = useState(5);
  const [reviewCount, setReviewCount] = useState(0);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteItemIds, setFavoriteItemIds] = useState<string[]>([]);

  // Parallax Setup
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  // Subtle parallax transform
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityParallax = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const filteredItems = storeItems.filter((item) => {
    const lower = searchTerm.trim().toLowerCase();
    if (!lower) return true;
    return (
      item.name.toLowerCase().includes(lower) ||
      (item.description || '').toLowerCase().includes(lower) ||
      (item.material || '').toLowerCase().includes(lower) ||
      (item.style || '').toLowerCase().includes(lower)
    );
  });

  async function refreshReviews() {
    const [{ data: reviewData }, ratingData] = await Promise.all([
      getStoreReviews(storeId),
      getStoreRating(storeId),
    ]);

    setReviews((reviewData as StoreReview[]) || []);
    setAvgRating(ratingData.avgRating);
    setReviewCount(ratingData.reviewCount);

    if (user) {
      const reviewed = await hasUserReviewedStore(storeId, user.id);
      setAlreadyReviewed(Boolean(reviewed.data));
    }
  }

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!storeId || typeof storeId !== 'string') {
        setError('Invalid store ID in URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: storeProfileData, error: profileError } = await getProfile(storeId);
        if (profileError || !storeProfileData || storeProfileData.role !== 'business') {
          setError('Store not found.');
          setIsLoading(false);
          return;
        }

        setStoreDetails({
          id: storeProfileData.id,
          name: storeProfileData.business_name || 'Business Name Not Set',
          address: storeProfileData.business_address_text || 'Address Not Set',
          type: storeProfileData.business_type || 'Type Not Set',
          latitude: storeProfileData.business_address_lat || 0,
          longitude: storeProfileData.business_address_lng || 0,
        });

        const { data: itemsData } = await getJewelryItemsByBusiness(storeId);
        setStoreItems(
          ((itemsData as any[]) || []).map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type || 'Jewelry',
            style: item.style,
            material: item.material,
            description: item.description,
            imageUrl: item.image_url,
            dataAiHint: `${item.style} ${item.name.split(' ')[0]}`,
          }))
        );

        await refreshReviews();
      } catch (caughtError) {
        console.error(caughtError);
        setError('An unexpected error occurred while loading this store.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [storeId, user]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || currentUserProfile?.role !== 'individual') {
        setFavoriteItemIds([]);
        return;
      }
      const { data, error } = await getFavoriteItemIdsByUser(user.id);
      if (error) {
        toast({ title: 'Favorites error', description: error.message, variant: 'destructive' });
        return;
      }
      setFavoriteItemIds(data || []);
    };
    loadFavorites();
  }, [user, currentUserProfile, toast]);

  const handleFavoriteToggle = async (item: JewelryItemType) => {
    if (!user || currentUserProfile?.role !== 'individual') {
      toast({ title: 'Favorites unavailable', description: 'Sign in as an individual to favorite items.', variant: 'destructive' });
      return;
    }
    const { data, error } = await toggleFavoriteItem(user.id, item.id, storeId);
    if (error) {
      toast({ title: 'Favorites error', description: error.message, variant: 'destructive' });
      return;
    }
    setFavoriteItemIds((prev) => {
      if (data) {
        if (prev.includes(item.id)) return prev;
        return [...prev, item.id];
      }
      return prev.filter((favoriteId) => favoriteId !== item.id);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (error || !storeDetails) {
    return (
      <Card className="mt-6 border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" /> Error Loading Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error || 'Store not found.'}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/dashboard/networks">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Networks
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-black overflow-hidden pb-32">
      {/* Restrained Parallax Hero */}
      <motion.div 
        style={{ y: yParallax, opacity: opacityParallax }}
        className="relative h-[50vh] min-h-[400px] w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-10" />
        <Image
          src={`https://placehold.co/1920x1080/1a1a1a/d4af37.png?text=${encodeURIComponent(storeDetails.name.charAt(0))}`}
          alt={`${storeDetails.name} banner`}
          layout="fill"
          objectFit="cover"
          priority
          className="opacity-60 mix-blend-overlay"
        />
        
        {/* Subtle glowing orb in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-primary/10 blur-[120px] rounded-full mix-blend-screen z-0" />
      </motion.div>

      {/* Main Content Layer */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        
        {/* Top Nav (Floating over hero) */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Floating Bento Overlay */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          
          {/* Main Store Identity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.25, 1] }}
            className="lg:col-span-2 rounded-[2rem] border border-white/5 bg-black/60 backdrop-blur-2xl p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <span className="text-xs tracking-widest uppercase text-white/50">{storeDetails.type}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
              {storeDetails.name}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-6 text-white/60 text-sm tracking-wide">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-primary" />
                <span>{storeDetails.address}</span>
              </div>
              
              {reviewCount > 0 && (
                <div className="flex items-center">
                  <Star className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500/20" /> 
                  <span>{avgRating.toFixed(1)} <span className="text-white/30 ml-1">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span></span>
                </div>
              )}
            </div>

            {currentUserProfile?.role === 'individual' && user?.id && (
              <div className="mt-10">
                <Button className="h-12 px-8 rounded-full bg-primary text-black hover:bg-primary/90 font-medium tracking-widest uppercase text-xs transition-shadow shadow-[0_0_20px_rgba(212,175,55,0.2)]" onClick={() => openChatWithUser(storeId)}>
                  Message Atelier
                </Button>
              </div>
            )}
          </motion.div>

          {/* Map Bento Cell */}
          {storeDetails.latitude && storeDetails.longitude && StoreMapView && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 1, 0.25, 1] }}
              className="rounded-[2rem] border border-white/5 bg-black/60 backdrop-blur-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col"
            >
              <div className="flex-grow rounded-xl overflow-hidden mb-4 relative min-h-[150px]">
                <div className="absolute inset-0 bg-primary/10 animate-pulse" /> {/* Placeholder while map loads */}
                <StoreMapView lat={storeDetails.latitude} lng={storeDetails.longitude} />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-xl" />
              </div>
              
              <div className="flex gap-3">
                <Button asChild variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary transition-colors text-xs tracking-wide">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${storeDetails.latitude},${storeDetails.longitude}`} target="_blank" rel="noreferrer">
                    Map View
                  </a>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1 bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors text-xs tracking-wide">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${storeDetails.latitude},${storeDetails.longitude}`} target="_blank" rel="noreferrer">
                    Directions
                  </a>
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Collections Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-white mb-2">Curated Collection</h2>
              <p className="text-white/40 text-sm tracking-wide">Explore the masterworks of {storeDetails.name}</p>
            </div>
            
            <div className="relative max-w-xs w-full md:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search collection..."
                className="pl-11 bg-black/40 border-white/10 text-white placeholder:text-white/30 rounded-full h-12 focus-visible:ring-primary/50 focus-visible:border-primary/50"
              />
            </div>
          </div>
          
          {storeItems.length > 0 ? (
            filteredItems.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {filteredItems.map((item, index) => {
                  const isFavorite = favoriteItemIds.includes(item.id);
                  return (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-black/40 border border-white/5 hover:border-primary/30 transition-colors duration-500"
                    >
                      <JewelryCard {...item} />
                      <button
                        type="button"
                        onClick={() => handleFavoriteToggle(item)}
                        className={`absolute right-4 top-4 rounded-full p-2 backdrop-blur-md border transition-all duration-300 ${
                          isFavorite 
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                            : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'
                        }`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-center py-20 tracking-wide">No pieces match your aesthetic criteria.</p>
            )
          ) : (
            <div className="flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-black/20 py-32">
              <PackageSearch className="mb-6 h-12 w-12 text-white/20" />
              <p className="text-lg text-white/40 tracking-wide">The atelier is currently preparing their collection.</p>
            </div>
          )}
        </motion.div>

        {/* Reviews Section */}
        <StoreReviews reviews={reviews} />

        {currentUserProfile?.role === 'individual' && user?.id && (
          <ReviewForm
            storeId={storeId}
            alreadyReviewed={alreadyReviewed}
            onReviewAdded={async () => {
              await refreshReviews();
              setAlreadyReviewed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StoreReviews({ reviews }: { reviews: StoreReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="border-t border-white/10 pt-16 mt-16 text-center">
        <h2 className="text-2xl font-medium text-white mb-2">Client Testimonials</h2>
        <div className="text-white/40 tracking-wide mt-4">No reviews recorded yet for this atelier.</div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-16 mt-16">
      <h2 className="mb-10 text-2xl font-medium text-white tracking-tight">Client Testimonials</h2>
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {reviews.map((review, i) => (
          <motion.div 
            key={review.id} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="break-inside-avoid rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium tracking-wide text-white">{review.reviewer_name || 'Anonymous Client'}</span>
                <div className="flex items-center">
                  <span className="text-sm text-yellow-500/80 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < review.rating ? "fill-yellow-500/80 text-yellow-500/80" : "text-white/20"}`} />
                    ))}
                  </span>
                </div>
              </div>
              <span className="text-xs text-white/30 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="text-sm text-white/60 leading-relaxed italic">&quot;{review.review_text}&quot;</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({
  storeId,
  alreadyReviewed,
  onReviewAdded,
}: {
  storeId: string;
  alreadyReviewed: boolean;
  onReviewAdded: () => Promise<void>;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    setSubmitting(true);
    const { error } = await submitStoreReview(storeId, rating, reviewText);
    setSubmitting(false);

    if (error) {
      toast({
        title: 'Failed to submit review',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Review submitted',
      description: 'Thank you for your review.',
    });
    setRating(5);
    setReviewText('');
    await onReviewAdded();
  };

  if (!user) {
    return <p className="mt-8 text-white/40 text-sm tracking-wide text-center">Sign in as a client to leave a testimonial.</p>;
  }

  if (alreadyReviewed) {
    return <p className="mt-8 text-white/40 text-sm tracking-wide text-center italic">Your testimonial has been recorded.</p>;
  }

  return (
    <motion.form 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit} 
      className="mt-16 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-xl p-8 md:p-12 max-w-3xl mx-auto shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-medium tracking-tight text-white mb-2">Leave a Testimonial</h3>
        <p className="text-white/40 text-sm tracking-wide">Share your experience with this atelier.</p>
      </div>
      
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className={`transition-all duration-300 hover:scale-110 ${star <= rating ? 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'text-white/20'}`}
            >
              <Star className={`h-8 w-8 ${star <= rating ? 'fill-yellow-500' : ''}`} />
            </button>
          ))}
        </div>
      </div>
      
      <textarea
        className="w-full rounded-2xl border border-white/10 bg-black/50 p-6 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50 resize-none shadow-inner mb-6 transition-all"
        rows={4}
        placeholder="Detail your experience, the craftsmanship, and service..."
        value={reviewText}
        onChange={(event) => setReviewText(event.target.value)}
        required
      />
      
      <div className="flex justify-center">
        <Button 
          type="submit" 
          disabled={submitting} 
          className="h-14 px-12 rounded-full bg-primary text-black hover:bg-primary/90 font-medium tracking-widest uppercase text-xs transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
        >
          {submitting ? 'Recording...' : 'Submit Testimonial'}
        </Button>
      </div>
    </motion.form>
  );
}
