"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
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
import { Separator } from '@/components/ui/separator';
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
    <div className="space-y-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{storeDetails.name}</h1>
      </div>

      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-48 w-full bg-secondary/30 md:h-64">
          <Image
            src={`https://placehold.co/1200x400.png?text=${encodeURIComponent(storeDetails.name)}`}
            alt={`${storeDetails.name} banner`}
            layout="fill"
            objectFit="cover"
            priority
            data-ai-hint="store banner"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4">
            <ShoppingBag className="mb-3 h-16 w-16 text-white/90" />
            <h1 className="font-headline text-center text-3xl font-bold text-white md:text-5xl">
              {storeDetails.name}
            </h1>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-2 flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-5 w-5 shrink-0 text-primary" />
            <span>{storeDetails.address}</span>
          </div>
          <p className="text-sm text-foreground">
            Registered as: <span className="ml-1 font-semibold">{storeDetails.type}</span>{' '}
            {reviewCount > 0 && (
              <span className="text-muted-foreground">
                • <Star className="inline h-4 w-4 text-yellow-500" /> {avgRating.toFixed(1)} ({reviewCount}{' '}
                {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </p>
          {currentUserProfile?.role === 'individual' && user?.id && (
            <div className="mt-4">
              <Button className="btn-primary-sparkle" onClick={() => openChatWithUser(storeId)}>
                Chat with Store
              </Button>
            </div>
          )}
          {storeDetails.latitude && storeDetails.longitude && StoreMapView && (
            <div className="mt-6 space-y-3">
              <StoreMapView lat={storeDetails.latitude} lng={storeDetails.longitude} />
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${storeDetails.latitude},${storeDetails.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Map
                  </a>
                </Button>
                <Button asChild variant="default" size="sm">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${storeDetails.latitude},${storeDetails.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Drive There
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <PackageSearch className="h-7 w-7 text-accent" /> Items from {storeDetails.name}
            </h2>
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search items in this store..."
                className="pl-10"
              />
            </div>
          </div>
        {storeItems.length > 0 ? (
          filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const isFavorite = favoriteItemIds.includes(item.id);
                return (
                  <div key={item.id} className="relative group">
                    <JewelryCard {...item} />
                    <button
                      type="button"
                      onClick={() => handleFavoriteToggle(item)}
                      className={`absolute right-3 top-3 rounded-full p-1 shadow transition ${
                        isFavorite ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 group-hover:text-rose-500'
                      }`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No items match your search.</p>
          )
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed bg-muted/20 py-12">
            <PackageSearch className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">This store hasn't listed any items yet.</p>
          </Card>
        )}
      </div>

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
  );
}

function StoreReviews({ reviews }: { reviews: StoreReview[] }) {
  if (reviews.length === 0) {
    return <div className="mt-6 text-muted-foreground">No reviews yet.</div>;
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="mb-4 text-2xl font-semibold">Customer Reviews</h2>
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-lg text-yellow-500">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">{review.rating}/5</span>
              </div>
              <span className="text-sm font-medium">{review.reviewer_name || 'Anonymous'}</span>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
          </div>
          <div className="text-sm text-gray-700">{review.review_text}</div>
        </div>
      ))}
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
    return <p className="mt-6 text-muted-foreground">Sign in to leave a review.</p>;
  }

  if (alreadyReviewed) {
    return <p className="mt-6 text-muted-foreground">You have already submitted a review for this store.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t pt-4">
      <h3 className="mb-2 font-semibold">Leave a Review</h3>
      <div className="mb-2 flex items-center gap-2">
        <span>Rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="mb-2 w-full rounded border p-2"
        rows={3}
        placeholder="Write your review..."
        value={reviewText}
        onChange={(event) => setReviewText(event.target.value)}
        required
      />
      <Button type="submit" disabled={submitting} className="btn-primary-sparkle">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
