import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/useTheme';
import Card from '../../components/ui/Card';
import { reviewsAPI } from '../../api/reviews';
import { toApiError } from '../../api/api-error';
import { rentraQueryKeys, useBookings, useMyReviews } from '../../hooks/useRentraQueries';

interface Review {
  id: string;
  userId: string;
  listingId: string;
  bookingId?: string | null;
  reviewType: 'PROPERTY' | 'LANDLORD';
  rating: number;
  comment: string | null;
  createdAt: string;
  listing?: { title?: string };
}

interface CompletedBooking {
  id: string;
  status: string;
  listingId: string;
  listing?: { title?: string } | null;
}

export default function ReviewsAndRatings() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const reviewsQuery = useMyReviews(user?.id ?? '');
  const bookingsQuery = useBookings<CompletedBooking>();
  const reviews = reviewsQuery.data as Review[] | undefined;
  const [selectedBooking, setSelectedBooking] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useMutation({
    mutationFn: (booking: CompletedBooking) => reviewsAPI.create({
      reviewType: 'PROPERTY',
      listingId: booking.listingId,
      bookingId: booking.id,
      rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: async (_review, booking) => {
      setSelectedBooking('');
      setRating(5);
      setComment('');
      toast.success('Your review was submitted.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rentraQueryKeys.reviewsByUser(user?.id ?? '') }),
        queryClient.invalidateQueries({ queryKey: rentraQueryKeys.listingReviews(booking.listingId) }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(toApiError(error).message || 'Your review could not be submitted.');
    },
  });
  const completedBookings = (bookingsQuery.data ?? []).filter(
    (booking) =>
      booking.status === 'COMPLETED' &&
      Boolean(booking.listingId) &&
      !reviews?.some(
        (review) => review.bookingId === booking.id && review.reviewType === 'PROPERTY',
      ),
  );
  const loading = Boolean(user?.id) && (reviewsQuery.isPending || bookingsQuery.isPending);
  const error = reviewsQuery.isError || bookingsQuery.isError;

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          My Reviews & Ratings
        </h1>
        <p className={`mt-1 text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Review completed stays. The backend checks rental eligibility and prevents duplicate reviews.
        </p>
      </div>

      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading completed stays and reviews...</p></Card>
        : error ? <Card className="p-5"><p role="alert" className="text-sm text-red-600">Your bookings or reviews could not be loaded.</p><button onClick={() => { void reviewsQuery.refetch(); void bookingsQuery.refetch(); }} className="mt-2 text-sm font-semibold text-emerald-700">Retry</button></Card>
          : <>
            {completedBookings.length > 0 && <Card className="mb-5 p-5">
              <h2 className="mb-3 font-bold">Review a completed stay</h2>
              <label className="block text-sm font-medium">
                Completed booking
                <select value={selectedBooking} onChange={(event) => setSelectedBooking(event.target.value)} className="mt-1 w-full rounded-lg border p-2">
                  <option value="">Choose a stay</option>
                  {completedBookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.listing?.title ?? 'Completed stay'}</option>)}
                </select>
              </label>
              {selectedBooking && <form onSubmit={(event) => {
                event.preventDefault();
                const booking = completedBookings.find((item) => item.id === selectedBooking);
                if (booking) createReview.mutate(booking);
              }} className="mt-4 space-y-3">
                <label className="block text-sm font-medium">
                  Rating
                  <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block rounded-lg border p-2">
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Comment (optional)
                  <textarea maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
                </label>
                <button disabled={createReview.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {createReview.isPending ? 'Submitting...' : 'Submit review'}
                </button>
              </form>}
            </Card>}

            <Card>
              <h2 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Reviews I've Given ({reviews?.length ?? 0})
              </h2>
              {!reviews?.length ? <p className="py-6 text-center text-sm text-gray-500">
                {completedBookings.length ? 'You have no reviews yet. You can review a completed stay above.' : 'No completed stays are currently eligible for review.'}
              </p> : <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-[#1f1f1f]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{review.listing?.title ?? 'Rental listing'}</div>
                        <p className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleDateString()} · {review.reviewType.toLowerCase()} review</p>
                      </div>
                      <span className="text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}</span>
                    </div>
                    {review.comment && <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{review.comment}</p>}
                  </div>
                ))}
              </div>}
            </Card>
          </>}
    </div>
  );
}
