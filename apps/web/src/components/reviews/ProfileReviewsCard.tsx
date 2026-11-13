import { useQuery } from '@tanstack/react-query';
import Card from '../ui/Card';
import { reviewsAPI } from '../../api/reviews';

interface ReceivedReview {
  id: string;
  rating: number;
  comment: string | null;
  agreementId?: string | null;
  createdAt: string;
  verifiedRental?: boolean;
  reviewType: 'LANDLORD' | 'TENANT' | 'AGREEMENT';
  user?: { fullName: string };
}

interface ReviewSummary {
  data?: ReceivedReview[];
  averageRating?: number;
  count?: number;
}

export default function ProfileReviewsCard({ userId }: { userId: string }) {
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'profile-user', userId],
    queryFn: () => reviewsAPI.getForUser(userId) as Promise<ReviewSummary>,
    enabled: Boolean(userId),
  });
  const summary = reviewsQuery.data;

  return (
    <Card className="md:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-bold text-text">
            Verified rental reviews
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            Reviews received across your tenant and landlord activity.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-text">
            {typeof summary?.averageRating === 'number'
              ? summary.averageRating.toFixed(2)
              : '—'}{' '}
            / 5
          </p>
          <p className="text-xs text-text-muted">
            {summary?.count ?? 0} review{summary?.count === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      {reviewsQuery.isPending ? (
        <p className="mt-4 text-sm text-text-muted">Loading reviews...</p>
      ) : reviewsQuery.isError ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Reviews could not be loaded.
        </p>
      ) : !summary?.data?.length ? (
        <p className="mt-4 rounded-lg bg-surface-2 p-4 text-center text-sm text-text-muted">
          No reviews have been received yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {summary.data.slice(0, 5).map((review) => (
            <article
              key={review.id}
              className="rounded-lg border border-border bg-surface-2 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text">
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
                <span className="font-bold text-amber-600">
                  {review.rating.toFixed(2)} / 5
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-text-muted">{review.comment}</p>
              )}
              {review.verifiedRental && (
                <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">
                  Verified Rental
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
