 "use client";

 import { useEffect, useState } from 'react';
 import { useRouter } from 'next/navigation';
 import { useAuth } from '@/hooks/useAuth';
 import { Card } from '@/components/ui/card';
 import { getBusinessReviews } from '@/lib/actions/supabase-actions';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

export default function BusinessReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.replace('/');
      return;
    }

    async function fetchReviews() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await getBusinessReviews(user.id);
      setReviews((data as Review[]) || []);
      setLoading(false);
    }

    fetchReviews();
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  const stats = {
    total: reviews.length,
    averageRating: reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0,
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Business Reviews</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Reviews</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Average Rating</div>
          <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)} ★</div>
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No reviews found.</p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mb-2 text-sm">{review.review_text}</p>
                  <p className="text-xs text-muted-foreground">
                    By: {review.reviewer_name || 'Anonymous'}
                    {review.reviewer_email ? ` (${review.reviewer_email})` : ''}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
