import { useState } from 'react';
import { disputesAPI } from '../../api/disputes';

export default function AgreementTerminationDisputeButton({ agreementId }: { agreementId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!reason.trim() || !description.trim()) { setError('Please complete both fields.'); return; }
    setSaving(true);
    setError('');
    try {
      await disputesAPI.create({ type: 'AGREEMENT_TERMINATION', agreementId, reason: reason.trim(), description: description.trim() });
      setOpen(false);
      setSuccess(true);
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Could not submit the dispute.');
    } finally { setSaving(false); }
  };

  return <>
    {success ? <p className="mt-3 text-sm font-semibold text-green-700">Dispute sent to Rentra admins for review.</p> : <button type="button" onClick={() => setOpen(true)} className="mt-4 rounded-lg border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50">Open dispute with admin</button>}
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="agreement-dispute-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl"><h2 id="agreement-dispute-title" className="text-lg font-bold text-text">Ask Rentra to resolve this agreement issue</h2><p className="mt-1 text-sm text-text-muted">Both sides have reached the rejection threshold. An admin will review your dispute.</p><div className="mt-4 space-y-3"><label className="block text-sm font-semibold text-text">Dispute reason<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label><label className="block text-sm font-semibold text-text">Explain the issue<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} rows={4} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Back</button><button type="button" disabled={saving || !reason.trim() || !description.trim()} onClick={() => void submit()} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Sending…' : 'Send dispute'}</button></div></div></section></div>}
  </>;
}
