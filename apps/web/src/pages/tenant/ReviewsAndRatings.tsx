import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import { reviewsAPI } from '../../api/reviews';
import { toApiError } from '../../api/api-error';
import {
  rentraQueryKeys,
  useBookings,
  useMyReviews,
} from '../../hooks/useRentraQueries';
import { agreementsAPI } from '../../api/agreements';
import AgreementReviewCard from '../../components/agreements/AgreementReviewCard';

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

interface ReviewAgreement {
  id: string;
  status: string;
  endDate: string | null;
  listing?: { title?: string } | null;
  property?: { title?: string } | null;
}

interface ReceivedReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewType: 'LANDLORD' | 'TENANT' | 'AGREEMENT';
  agreementId?: string | null;
  createdAt: string;
  verifiedRental?: boolean;
  user?: { id: string; fullName: string };
  behaviour?: number | null;
  communication?: number | null;
  propertyCondition?: number | null;
  honesty?: number | null;
  maintenance?: number | null;
  responseTime?: number | null;
  rentPayment?: number | null;
  propertyCare?: number | null;
  cleanliness?: number | null;
  agreementCompliance?: number | null;
}

const reviewCategoryLabels: Record<string, string> = {
  behaviour: 'Behaviour & Attitude',
  communication: 'Communication',
  propertyCondition: 'Property Condition',
  honesty: 'Honesty & Transparency',
  maintenance: 'Maintenance & Support',
  responseTime: 'Response Time',
  rentPayment: 'Rent Payment Punctuality',
  propertyCare: 'Property Care',
  cleanliness: 'Cleanliness',
  agreementCompliance: 'Rules & Agreement Compliance',
};

export default function ReviewsAndRatings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const reviewsQuery = useMyReviews(user?.id ?? '');
  const bookingsQuery = useBookings<CompletedBooking>();
  const agreementsQuery = useQuery({
    queryKey: ['agreements', 'mine'],
    queryFn: () => agreementsAPI.mine<ReviewAgreement>(),
    enabled: Boolean(user?.id),
  });
  const receivedReviewsQuery = useQuery({
    queryKey: ['reviews', 'received', user?.id],
    queryFn: () => reviewsAPI.getMyReceived(),
    enabled: Boolean(user?.id),
  });
  const reviews = reviewsQuery.data as Review[] | undefined;
  const receivedReviews = (
    receivedReviewsQuery.data as { data?: ReceivedReview[] } | undefined
  )?.data;
  const receivedSummary = receivedReviewsQuery.data as
    | {
        averageRating?: number;
        count?: number;
        categoryAverages?: {
          landlord?: Record<string, number | null>;
          tenant?: Record<string, number | null>;
        };
      }
    | undefined;
  const completedAgreements = (agreementsQuery.data ?? []).filter((agreement) =>
    ['ENDED', 'EXPIRED'].includes(agreement.status),
  );
  const [selectedBooking, setSelectedBooking] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useMutation({
    mutationFn: (booking: CompletedBooking) =>
      reviewsAPI.create({
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
        queryClient.invalidateQueries({
          queryKey: rentraQueryKeys.reviewsByUser(user?.id ?? ''),
        }),
        queryClient.invalidateQueries({
          queryKey: rentraQueryKeys.listingReviews(booking.listingId),
        }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        toApiError(error).message || 'Your review could not be submitted.',
      );
    },
  });
  const completedBookings = (bookingsQuery.data ?? []).filter(
    (booking) =>
      booking.status === 'COMPLETED' &&
      Boolean(booking.listingId) &&
      !reviews?.some(
        (review) =>
          review.bookingId === booking.id && review.reviewType === 'PROPERTY',
      ),
  );
  const loading =
    Boolean(user?.id) &&
    (reviewsQuery.isPending ||
      bookingsQuery.isPending ||
      agreementsQuery.isPending);
  const error =
    reviewsQuery.isError || bookingsQuery.isError || agreementsQuery.isError;

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight text-text`}>
          My Reviews & Ratings
        </h1>
        <p className={`mt-1 text-[13px] text-text-muted`}>
          Review completed stays. The backend checks rental eligibility and
          prevents duplicate reviews.
        </p>
      </div>

      {loading ? (
        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Loading completed stays and reviews...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-5">
          <p role="alert" className="text-sm text-red-600">
            Your bookings or reviews could not be loaded.
          </p>
          <button
            onClick={() => {
              void reviewsQuery.refetch();
              void bookingsQuery.refetch();
            }}
            className="mt-2 text-sm font-semibold text-emerald-700"
          >
            Retry
          </button>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="font-bold">Review a completed rental agreement</h2>
              <p className="mt-1 text-sm text-text-muted">
                Both parties can leave one verified review after the agreement
                ends.
              </p>
            </div>
            {completedAgreements.length ? (
              <div className="space-y-3">
                {completedAgreements.map((agreement) => (
                  <AgreementReviewCard
                    key={agreement.id}
                    agreement={agreement}
                  />
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-sm text-text-muted">
                No completed rental agreements are currently eligible for
                reviews.
              </p>
            )}
          </Card>

          {completedBookings.length > 0 && (
            <Card className="mb-5 p-5">
              <h2 className="mb-3 font-bold">Review a completed stay</h2>
              <label className="block text-sm font-medium">
                Completed booking
                <select
                  value={selectedBooking}
                  onChange={(event) => setSelectedBooking(event.target.value)}
                  className="mt-1 w-full rounded-lg border p-2"
                >
                  <option value="">Choose a stay</option>
                  {completedBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.listing?.title ?? 'Completed stay'}
                    </option>
                  ))}
                </select>
              </label>
              {selectedBooking && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const booking = completedBookings.find(
                      (item) => item.id === selectedBooking,
                    );
                    if (booking) createReview.mutate(booking);
                  }}
                  className="mt-4 space-y-3"
                >
                  <label className="block text-sm font-medium">
                    Rating
                    <select
                      value={rating}
                      onChange={(event) =>
                        setRating(Number(event.target.value))
                      }
                      className="mt-1 block rounded-lg border p-2"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} / 5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Comment (optional)
                    <textarea
                      maxLength={2000}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="mt-1 block w-full rounded-lg border p-2"
                    />
                  </label>
                  <button
                    disabled={createReview.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50"
                  >
                    {createReview.isPending ? 'Submitting...' : 'Submit review'}
                  </button>
                </form>
              )}
            </Card>
          )}

          <Card>
            <h2 className={`mb-4 text-lg font-bold text-text`}>
              Reviews I've Given ({reviews?.length ?? 0})
            </h2>
            {!reviews?.length ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {completedBookings.length
                  ? 'You have no reviews yet. You can review a completed stay above.'
                  : 'No completed stays are currently eligible for review.'}
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border p-4 bg-surface-2"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-bold text-text`}>
                          {review.listing?.title ?? 'Rental listing'}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()} ·{' '}
                          {review.reviewType.toLowerCase()} review
                        </p>
                      </div>
                      <span
                        className="text-amber-500"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {'★'.repeat(review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className={`text-xs text-text-muted`}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-text">
                  Reviews I've Received
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Reviews for your tenant and landlord activity stay on this one
                  account.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-text">
                  {typeof receivedSummary?.averageRating === 'number'
                    ? receivedSummary.averageRating.toFixed(2)
                    : '—'}{' '}
                  / 5
                </p>
                <p className="text-xs text-text-muted">
                  {receivedSummary?.count ?? 0} review
                  {receivedSummary?.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {receivedSummary?.categoryAverages && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [
                      'Landlord reviews',
                      receivedSummary.categoryAverages.landlord,
                    ],
                    ['Tenant reviews', receivedSummary.categoryAverages.tenant],
                  ] as const
                ).map(([title, categories]) => {
                  const values = Object.entries(categories ?? {}).filter(
                    (entry): entry is [string, number] =>
                      typeof entry[1] === 'number',
                  );
                  return values.length ? (
                    <div
                      key={title}
                      className="rounded-lg border border-border p-3"
                    >
                      <h3 className="mb-2 text-sm font-semibold text-text">
                        {title}
                      </h3>
                      <div className="space-y-1.5">
                        {values.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between gap-2 text-xs"
                          >
                            <span className="text-text-muted">
                              {reviewCategoryLabels[key] ?? key}
                            </span>
                            <span className="font-semibold text-text">
                              {value.toFixed(2)} / 5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {receivedReviewsQuery.isPending ? (
              <p className="py-4 text-center text-sm text-text-muted">
                Loading received reviews...
              </p>
            ) : receivedReviewsQuery.isError ? (
              <p role="alert" className="py-4 text-center text-sm text-red-700">
                Received reviews could not be loaded.
              </p>
            ) : !receivedReviews?.length ? (
              <p className="py-6 text-center text-sm text-text-muted">
                No reviews have been received yet.
              </p>
            ) : (
              <div className="space-y-3">
                {receivedReviews.map((review) => {
                  const categoryValues =
                    review.reviewType === 'TENANT'
                      ? [
                          ['Behaviour', review.behaviour],
                          ['Rent payment', review.rentPayment],
                          ['Property care', review.propertyCare],
                          ['Cleanliness', review.cleanliness],
                          ['Communication', review.communication],
                          ['Agreement compliance', review.agreementCompliance],
                        ]
                      : [
                          ['Behaviour', review.behaviour],
                          ['Communication', review.communication],
                          ['Property condition', review.propertyCondition],
                          ['Honesty', review.honesty],
                          ['Maintenance', review.maintenance],
                          ['Response time', review.responseTime],
                        ];
                  return (
                    <article
                      key={review.id}
                      className="rounded-lg border border-border bg-surface-2 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text">
                            {review.user?.fullName ?? 'Rentra user'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {review.reviewType === 'TENANT'
                              ? 'Landlord review'
                              : review.reviewType === 'LANDLORD'
                                ? 'Tenant review'
                                : 'Agreement review'}{' '}
                            · {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          {review.agreementId && (
                            <p className="mt-1 text-[10px] text-text-muted">
                              Rental agreement · {review.agreementId}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text">
                            {review.rating.toFixed(2)} / 5
                          </span>
                          {review.verifiedRental && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">
                              Verified rental
                            </span>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-text-muted">
                          {review.comment}
                        </p>
                      )}
                      {review.reviewType !== 'AGREEMENT' && (
                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          {categoryValues
                            .filter(([, value]) => typeof value === 'number')
                            .map(([label, value]) => (
                              <div
                                key={label}
                                className="flex justify-between gap-2"
                              >
                                <span className="text-text-muted">{label}</span>
                                <span className="font-semibold text-text">
                                  {value} / 5
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
