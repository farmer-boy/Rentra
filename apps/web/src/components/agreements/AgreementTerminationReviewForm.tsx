import { useState } from 'react';
import { agreementsAPI, type AgreementTerminationRequest } from '../../api/agreements';

export default function AgreementTerminationReviewForm({
  agreementId,
  request,
  currentUserId,
}: {
  agreementId: string;
  request: AgreementTerminationRequest;
  currentUserId?: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const ownReview = request.reviews?.find((review) => review.reviewerId === currentUserId);
  if (!currentUserId || ownReview || submitted) return ownReview || submitted ? <p className="mt-2 text-xs text-green-800">Your cancellation review is saved.</p> : null;

  const submit = async () => {
    if (!comment.trim()) { setError('Please add a review comment.'); return; }
    setSaving(true);
    setError('');
    try {
      await agreementsAPI.reviewCancellation(agreementId, request.id, { rating, comment: comment.trim() });
      setSubmitted(true);
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not save your review.');
    } finally { setSaving(false); }
  };

  return <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
    <p className="text-sm font-semibold text-green-900">Cancellation agreed. Review the other party</p>
    <div className="mt-2 flex flex-wrap items-end gap-3">
      <label className="text-xs font-semibold text-text">Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm">{[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} star{star === 1 ? '' : 's'}</option>)}</select></label>
      <label className="min-w-[220px] flex-1 text-xs font-semibold text-text">Review comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></label>
      <button type="button" disabled={saving || !comment.trim()} onClick={() => void submit()} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Submit review'}</button>
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </div>;
}
