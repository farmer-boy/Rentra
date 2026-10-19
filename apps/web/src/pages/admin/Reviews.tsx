import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { reviewsAPI } from '../../api/reviews';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { fullName?: string } | null;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await reviewsAPI.getAll();
      setReviews(records as Review[]);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Reviews could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const mutedText = 'text-text-muted';

  return (
    <section>
      <header className="mb-6">
        <h1 className={`text-xl font-bold text-text`}>Reviews</h1>
        <p className={`mt-1 text-sm ${mutedText}`}>Reviews submitted on rental listings.</p>
      </header>
      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          <span>{error}</span>
          <button type="button" onClick={() => void loadReviews()} className="font-semibold underline">Retry</button>
        </div>
      )}
      {loading ? (
        <p className={`text-sm ${mutedText}`}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className={`p-8 text-center border rounded-xl border-border bg-surface`}>
          <Star className={`mx-auto mb-3 ${mutedText}`} size={28} />
          <p className={`font-semibold text-text`}>No reviews yet</p>
          <p className={`mt-1 text-sm ${mutedText}`}>Submitted reviews will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className={`p-4 border rounded-xl border-border bg-surface`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`font-semibold text-text`}>
                  {review.user?.fullName || 'User'}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star size={14} fill="currentColor" /> {review.rating}/5
                </span>
              </div>
              <p className={`mt-2 text-sm ${mutedText}`}>{review.comment || 'No written comment.'}</p>
              <p className={`mt-2 text-xs ${mutedText}`}>{new Date(review.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
