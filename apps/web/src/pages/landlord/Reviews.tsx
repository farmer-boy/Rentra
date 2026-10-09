import { useEffect, useState } from 'react';
import { MessageCircle, Star } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

interface Listing { id: string; title: string }
interface Review { id: string; rating: number; comment: string; createdAt: string; user?: { fullName: string } }
interface DisplayReview extends Review { property: string }

const LandlordReviews = () => {
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) { setError('Sign in to view reviews.'); setLoading(false); return; }
    const load = async () => {
      try {
        const { data: listingsResponse } = await api.get('/listings/landlord/my-listings');
        const listings: Listing[] = listingsResponse.data ?? [];
        const reviewGroups = await Promise.all(listings.map(async (listing) => {
          const { data } = await api.get(`/reviews/listing/${listing.id}`);
          return ((data.data ?? []) as Review[]).map((review) => ({ ...review, property: listing.title }));
        }));
        setReviews(reviewGroups.flat());
      } catch (requestError: any) {
        setError(requestError.response?.data?.message || 'Reviews could not be loaded.');
      } finally { setLoading(false); }
    };
    void load();
  }, [user?.id]);

  const average = reviews.length ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Property Reviews</h1><p className="text-gray-600 dark:text-gray-300">Reviews submitted for your properties</p></div>
      {loading ? <p className="text-sm text-gray-500">Loading reviews...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : (
        <>
          {reviews.length > 0 && <Card className="p-6"><p className="text-gray-600 dark:text-gray-400">Average rating</p><div className="mt-2 flex items-center gap-2"><span className="text-4xl font-bold">{average}</span><Star size={21} className="fill-yellow-400 text-yellow-400" /></div><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p></Card>}
          <div className="space-y-4">
            {reviews.length === 0 ? <Card className="p-6 text-sm text-gray-500">No reviews have been submitted for your properties.</Card> : reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3"><div><h3 className="font-semibold text-gray-900 dark:text-white">{review.user?.fullName || 'Tenant'}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400"><MessageCircle size={14} className="inline mr-1" />{review.property}</p></div><div className="flex items-center gap-1"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="font-semibold">{review.rating}</span></div></div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p><p className="mt-3 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LandlordReviews;
