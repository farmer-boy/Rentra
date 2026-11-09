import { useState } from 'react';
import { agreementsAPI } from '../../api/agreements';
import type { Agreement, AgreementAmendment } from '../../api/types';

export default function AgreementAmendmentsPanel({
  agreementId,
  amendments = [],
  tenantView = false,
  onUpdated,
}: {
  agreementId: string;
  amendments?: AgreementAmendment[];
  tenantView?: boolean;
  onUpdated: (agreement: Agreement) => void;
}) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AgreementAmendment | null>(null);
  const [reason, setReason] = useState('');
  if (!amendments.length) return null;

  const respond = async (amendmentId: string, decision: 'ACCEPT' | 'REJECT') => {
    if (decision === 'REJECT' && !reason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setBusyId(amendmentId);
    setError('');
    try {
      onUpdated(await agreementsAPI.respondToAmendment(agreementId, amendmentId, {
        decision,
        ...(decision === 'REJECT' ? { reason: reason.trim() } : {}),
      }));
      setSelected(null);
      setReason('');
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not save your response.');
    } finally { setBusyId(''); }
  };

  return <div className="mt-4 space-y-3">
    {amendments.map((amendment) => {
      return <div key={amendment.id} className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>Terms update</strong><span className={`rounded px-2 py-0.5 text-xs font-semibold ${amendment.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : amendment.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{amendment.status}</span></div>
      <p className="mt-2">Proposed rent: <strong>PKR {amendment.proposedMonthlyRent.toLocaleString()}</strong> · Deposit: <strong>PKR {amendment.proposedSecurityDeposit.toLocaleString()}</strong></p>
      {amendment.reason && <p className="mt-1 text-text-muted">Landlord’s note: {amendment.reason}</p>}
      {amendment.status === 'REJECTED' && amendment.decisionNote && <p className="mt-1 text-red-700">Rejection reason: {amendment.decisionNote}</p>}
      {tenantView && amendment.status === 'PENDING' && <div className="mt-3 flex gap-2"><button type="button" disabled={!!busyId} onClick={() => void respond(amendment.id, 'ACCEPT')} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busyId === amendment.id ? 'Saving…' : 'Accept update'}</button><button type="button" disabled={!!busyId} onClick={() => { setSelected(amendment); setError(''); }} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button></div>}
    </div>;
    })}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="reject-amendment-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl"><h2 id="reject-amendment-title" className="text-lg font-bold text-text">Reject proposed terms</h2><p className="mt-1 text-sm text-text-muted">Current rent and deposit stay unchanged. Give a rejection reason. You can review each other after a cancellation is approved.</p><div className="mt-4 space-y-3"><label className="block text-sm font-semibold text-text">Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button><button type="button" disabled={!!busyId || !reason.trim()} onClick={() => selected && void respond(selected.id, 'REJECT')} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm rejection</button></div></div></section></div>}
  </div>;
}
