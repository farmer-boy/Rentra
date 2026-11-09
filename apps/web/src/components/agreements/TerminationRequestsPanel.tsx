import { useState } from 'react';
import { agreementsAPI, type AgreementTerminationRequest } from '../../api/agreements';
import type { Agreement } from '../../api/types';
import AgreementTerminationReviewForm from './AgreementTerminationReviewForm';

export default function TerminationRequestsPanel({
  agreementId,
  tenantId,
  currentUserId,
  requests = [],
  onUpdated,
}: {
  agreementId: string;
  tenantId: string;
  currentUserId?: string;
  requests?: AgreementTerminationRequest[];
  onUpdated: (agreement: Agreement) => void;
}) {
  const [selected, setSelected] = useState<AgreementTerminationRequest | null>(null);
  const [contestSelected, setContestSelected] = useState<AgreementTerminationRequest | null>(null);
  const [contestReason, setContestReason] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const respond = async (request: AgreementTerminationRequest, decision: 'APPROVE' | 'REJECT') => {
    if (decision === 'REJECT' && !reason.trim()) {
      setError('Enter the rejection reason first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const agreement = await agreementsAPI.respondToTermination(agreementId, request.id, {
        decision,
        ...(decision === 'REJECT' ? { reason: reason.trim() } : {}),
      });
      onUpdated(agreement);
      setSelected(null);
      setReason('');
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'The cancellation response could not be saved.');
    } finally { setSaving(false); }
  };

  const respondToRejection = async (request: AgreementTerminationRequest, decision: 'ACCEPT_REJECTION' | 'CONTEST') => {
    if (decision === 'CONTEST' && !contestReason.trim()) {
      setError('Add a reason to contest the rejection.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onUpdated(await agreementsAPI.respondToTerminationOutcome(agreementId, request.id, decision, contestReason.trim() || undefined));
      setContestSelected(null);
      setContestReason('');
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not save your response.');
    } finally { setSaving(false); }
  };

  if (!requests.length) return null;
  const pending = requests.find((request) => request.status === 'PENDING');

  return <div className="mt-4 space-y-3">
    {requests.map((request) => {
      const isRequesterTenant = request.requestedById === tenantId;
      const isRequester = request.requestedById === currentUserId;
      const canRespond = request.status === 'PENDING' && !isRequester;
      return <div key={request.id} className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>Cancellation request · {isRequesterTenant ? 'Tenant' : 'Landlord'} requested</strong><span className={`rounded px-2 py-0.5 text-xs font-semibold ${request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : request.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{request.status}</span></div>
        <p className="mt-2">Request reason: {request.requestReason}</p>
        {request.responses?.map((response) => <div key={response.id} className="mt-2 border-t border-rose-200 pt-2">{response.decision === 'REJECTED' ? <p>Rejection by {response.responderId === tenantId ? 'tenant' : 'landlord'}: {response.reason}</p> : response.decision === 'CONTESTED' ? <p>Requester contested the rejection: {response.reason}</p> : response.decision === 'ACCEPTED_REJECTION' ? <p>Requester accepted the rejection.</p> : <p>Cancellation approved by {response.responderId === tenantId ? 'tenant' : 'landlord'}.</p>}</div>)}
        {request.decisionReason && !request.responses?.length && <p className="mt-1">Rejection reason: {request.decisionReason}</p>}
        {request.reviews?.map((review) => <p key={review.id} className="mt-1 text-green-800">Review from {review.reviewerId === tenantId ? 'tenant' : 'landlord'}: {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} · {review.comment}</p>)}
        {request.status === 'APPROVED' && <AgreementTerminationReviewForm agreementId={agreementId} request={request} currentUserId={currentUserId} />}
        {canRespond && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void respond(request, 'APPROVE')} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve cancellation</button><button type="button" disabled={saving} onClick={() => { setSelected(request); setError(''); }} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject and review</button></div>}
        {request.status === 'REJECTED' && isRequester && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void respondToRejection(request, 'ACCEPT_REJECTION')} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text">Accept this rejection</button><button type="button" disabled={saving} onClick={() => { setContestSelected(request); setError(''); }} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white">Contest rejection</button></div>}
      </div>;
    })}
    {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="reject-termination-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <h2 id="reject-termination-title" className="text-lg font-bold text-text">Reject cancellation request</h2>
        <p className="mt-1 text-sm text-text-muted">The agreement stays active. Add the rejection reason and a review for the other party.</p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-text">Rejection reason<textarea required maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button><button type="button" disabled={saving || !reason.trim()} onClick={() => selected && void respond(selected, 'REJECT')} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Confirm rejection'}</button></div>
        </div>
      </section>
    </div>}
    {contestSelected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setContestSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="contest-termination-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl"><h2 id="contest-termination-title" className="text-lg font-bold text-text">Contest the rejection?</h2><p className="mt-1 text-sm text-text-muted">The cancellation request will go back to the other party for another decision. Each rejection stays in the history.</p><label className="mt-4 block text-sm font-semibold text-text">Why are you contesting this rejection?<textarea value={contestReason} onChange={(event) => setContestReason(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setContestSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button><button type="button" disabled={saving || !contestReason.trim()} onClick={() => contestSelected && void respondToRejection(contestSelected, 'CONTEST')} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Sending…' : 'Send contest'}</button></div></section></div>}
    {pending && pending.requestedById === currentUserId && <p className="text-xs text-text-muted">Your cancellation request is waiting for the other party’s response.</p>}
  </div>;
}
