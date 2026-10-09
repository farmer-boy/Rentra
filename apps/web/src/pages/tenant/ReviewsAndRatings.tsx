import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import api from '../../api/client';

interface Review {
  id: string;
  userId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewsAndRatings() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      return () => { active = false; };
    }
    api.get<{ data?: Review[] }>('/reviews')
      .then(({ data }) => {
        const records = Array.isArray(data.data) ? data.data : [];
        if (active) setReviews(records.filter((review) => review.userId === user.id));
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user?.id]);

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          My Reviews & Ratings ⭐
        </h1>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Reviews recorded under your account</p>
      </div>

      <Card>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
          Reviews I've Given {!loading && !error ? `(${reviews.length})` : ''}
        </h2>
        {loading ? (
          <p className="py-6 text-center text-[12px] text-gray-500">Loading reviews…</p>
        ) : error || !user?.id ? (
          <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load your reviews right now.</p>
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-gray-500">No reviews are available for your account.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className={`p-4 border rounded-lg ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div>
                    <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>Listing {review.listingId}</div>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-yellow-500" aria-label={`${review.rating} out of 5 stars`}>
                    {'⭐'.repeat(Math.max(0, Math.min(5, review.rating)))}
                  </span>
                </div>
                <p className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
        <p className={`text-[11px] text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Aggregate tenant ratings are not provided by the backend API. Review submission is not available here because no tenant-specific eligible-listing workflow is provided.
        </p>
      </Card>
    </div>
  );
}
