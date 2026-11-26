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
  agreementName?: string;
}

const landlordCategories = [
  ['behaviour', 'Behaviour'],
  ['responsiveness', 'Responsiveness'],
  ['maintenance', 'Maintenance'],
  ['propertyAccuracy', 'Property accuracy'],
  ['agreementFairness', 'Agreement fairness'],
  ['privacy', 'Privacy'],
] as const;

const tenantCategories = [
  ['behaviour', 'Behaviour'],
  ['rentPayment', 'Rent payment'],
  ['propertyCare', 'Property care'],
  ['communication', 'Communication'],
  ['ruleFollowing', 'Rule following'],
  ['moveOut', 'Move-out'],
] as const;

const quickTagOptions = ['Helpful', 'Responsive', 'Late repairs', 'Fair terms', 'Clean tenant', 'Paid on time', 'Cared for property', 'Poor communication', 'Smooth handover'];

export default function AgreementReviewCard({
  agreement,
}: {
  agreement: ReviewAgreement;
}) {
  const queryClient = useQueryClient();
  const eligibilityQuery = useQuery({
    queryKey: ['reviews', 'eligibility', agreement.id],
    queryFn: () => reviewsAPI.getEligibility(agreement.id),
    refetchInterval: (query) => query.state.data?.eligible || query.state.data?.alreadyReviewed ? false : 5000,
  });
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [quickTags, setQuickTags] = useState<string[]>([]);
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
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['trust-score'] }),
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
    agreement.agreementName ?? agreement.listing?.title ?? agreement.property?.title ?? 'Completed rental';
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
        <div className="mt-3"><p role="alert" className="text-sm text-red-700">Review eligibility could not be checked.</p><button type="button" onClick={() => void eligibilityQuery.refetch()} className="mt-1 text-sm font-semibold text-emerald-700">Retry eligibility check</button></div>
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
              quickTags,
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
              Would you rent with this person again?
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
            Comment (optional, up to 500 characters)
            <textarea
              maxLength={500}
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-text">Quick tags (optional)</legend>
            <div className="mt-2 flex flex-wrap gap-2">{quickTagOptions.map((tag) => <button key={tag} type="button" aria-pressed={quickTags.includes(tag)} onClick={() => setQuickTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : current.length < 5 ? [...current, tag] : current)} className={`rounded-full border px-3 py-1 text-xs ${quickTags.includes(tag) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'}`}>{tag}</button>)}</div>
          </fieldset>
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
