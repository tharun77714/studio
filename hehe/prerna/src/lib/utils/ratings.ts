import { getStoreRating } from '@/lib/actions/supabase-actions';

export async function calculateStoreRating(storeId: string) {
  try {
    return await getStoreRating(storeId);
  } catch (error) {
    console.error('Error calculating store rating:', error);
    return { avgRating: 5, reviewCount: 0 };
  }
}
