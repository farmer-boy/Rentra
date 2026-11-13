import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reviewsAPI } from '../../api/reviews';
import type { CreateReviewRequest } from '../../api/types';

interface ReviewAgreement {
  id: string;
  status: string;
  endDate: string | null;
  listing?: { title?: string } | null;
  property?: { title?: string } | null;
}

const landlordCategories = [
  ['behaviour', 'Behaviour & Attitude'],
  ['communication', 'Communication'],
  ['propertyCondition', 'Property Condition'],
  ['honesty', 'Honesty & Transparency'],
  ['maintenance', 'Maintenance & Support'],
  ['responseTime', 'Response Time'],
] as const;

const tenantCategories = [
  ['behaviour', 'Behaviour & Attitude'],
  ['rentPayment', 'Rent Payment Punctuality'],
  ['propertyCare', 'Property Care'],
  ['cleanliness', 'Cleanliness'],
  ['communication', 'Communication'],
  ['agreementCompliance', 'Rules & Agreement Compliance'],
] as const;

export default function AgreementReviewCard({
  agreement,
}: {
  agreement: ReviewAgreement;
}) {
  const queryClient = useQueryClient();
  const eligibilityQuery = useQuery({
    queryKey: ['reviews', 'eligibility', agreement.id],
    queryFn: () => reviewsAPI.getEligibility(agreement.id),
  });
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const categories =
    eligibilityQuery.data?.reviewType === 'TENANT'
      ? tenantCategories
      : landlordCategories;
  const createReview = useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsAPI.create(data),
    onSuccess: async () => {
      toast.success('Your verified rental review was submitted.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['agreements'] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = (
        error as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(', ')
          : (message ?? 'Your review could not be submitted.'),
      );
    },
  });

  const eligibility = eligibilityQuery.data;
  const agreementName =
    agreement.listing?.title ?? agreement.property?.title ?? 'Completed rental';
  const allRated = categories.every(([key]) => ratings[key] !== undefined);

  return (
    <article className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-text">{agreementName}</h3>
          <p className="mt-1 text-xs text-text-muted">
            Agreement ended{' '}
            {agreement.endDate
              ? new Date(agreement.endDate).toLocaleDateString()
              : ''}
          </p>
        </div>
        {eligibility?.alreadyReviewed && (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            Review submitted
          </span>
        )}
      </div>

      {eligibilityQuery.isPending ? (
        <p className="mt-3 text-sm text-text-muted">
          Checking review eligibility...
        </p>
      ) : eligibilityQuery.isError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          Review eligibility could not be checked.
        </p>
      ) : eligibility?.eligible ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (wouldRecommend === null || !allRated) return;
            const categoryRatings = Object.fromEntries(
              categories.map(([key]) => [key, ratings[key]]),
            );
            createReview.mutate({
              agreementId: agreement.id,
              reviewType: eligibility.reviewType,
              ...categoryRatings,
              comment: comment.trim() || undefined,
              wouldRecommend,
            });
          }}
        >
          <p className="text-sm font-semibold text-text">
            Rate your{' '}
            {eligibility.reviewType === 'TENANT' ? 'tenant' : 'landlord'}:{' '}
            {eligibility.target.fullName}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map(([key, label]) => (
              <fieldset
                key={key}
                className="rounded-lg border border-border p-3"
              >
                <legend className="px-1 text-sm font-medium text-text">
                  {label}
                </legend>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${label}: ${value} star${value === 1 ? '' : 's'}`}
                      aria-pressed={ratings[key] === value}
                      onClick={() =>
                        setRatings((current) => ({ ...current, [key]: value }))
                      }
                      className={`rounded p-1 text-xl leading-none transition ${
                        ratings[key] !== undefined && value <= ratings[key]
                          ? 'text-amber-500'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-1 text-xs text-text-muted">
                    {ratings[key] ? `${ratings[key]} / 5` : 'Not rated'}
                  </span>
                </div>
              </fieldset>
            ))}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-text">
              Would you recommend this person?
            </legend>
            <div className="mt-2 flex gap-2">
              {[true, false].map((choice) => (
                <button
                  key={String(choice)}
                  type="button"
                  aria-pressed={wouldRecommend === choice}
                  onClick={() => setWouldRecommend(choice)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    wouldRecommend === choice
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-muted'
                  }`}
                >
                  {choice ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-medium text-text">
            Written review (optional)
            <textarea
              maxLength={2000}
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={
              !allRated || wouldRecommend === null || createReview.isPending
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createReview.isPending
              ? 'Submitting...'
              : 'Submit verified review'}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-text-muted">
          {eligibility?.reason ?? 'This agreement is not eligible for review.'}
        </p>
      )}
    </article>
  );
}
