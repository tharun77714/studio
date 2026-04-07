"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';
import { getBusinessReviews } from '@/lib/actions/supabase-actions';

export default function BusinessProfilePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    // Redirect to signin if not logged in or not a business
    if (!authLoading && (!user || profile?.role !== 'business')) {
      router.replace('/auth/business/signin');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    async function fetchReviews() {
      if (!profile) return;
      setLoadingReviews(true);
      const { data } = await getBusinessReviews(profile.id);
      if (data) setReviews(data);
      setLoadingReviews(false);
    }
    fetchReviews();
  }, [profile]);

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-lg text-center shadow-xl">
        <CardHeader>
          <Info className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-2xl">Profile Management Moved</CardTitle>
          <CardDescription>
            Your business profile, item listings, and other management tools have been consolidated into your main Networks dashboard for a more streamlined experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="btn-primary-sparkle">
            <Link href="/dashboard/networks">
              Go to Business Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-8 text-left">
            <h3 className="font-semibold mb-2">Customer Reviews</h3>
            {loadingReviews ? (
              <p className="text-muted-foreground">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mb-1">{review.review_text}</div>
                    <div className="text-xs text-muted-foreground">
                      {review.reviewer_name ? `By: ${review.reviewer_name}` : ''}
                      {review.reviewer_email ? ` (${review.reviewer_email})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
