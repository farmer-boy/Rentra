import { useState, type FormEvent } from 'react';
import { agreementsAPI } from '../../api/agreements';
import type { AgreementAmendment } from '../../api/types';

export default function ProposeAgreementTermsButton({
  agreementId,
  monthlyRent,
  securityDeposit,
  onProposed,
}: {
  agreementId: string;
  monthlyRent: number;
  securityDeposit: number | null;
  onProposed: (amendment: AgreementAmendment) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rent, setRent] = useState(String(monthlyRent));
  const [deposit, setDeposit] = useState(String(securityDeposit ?? 0));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const amendment = await agreementsAPI.proposeTerms(agreementId, {
        proposedMonthlyRent: Number(rent),
        proposedSecurityDeposit: Number(deposit),
        reason: reason.trim() || undefined,
      });
      onProposed(amendment as AgreementAmendment);
      setOpen(false);
    } catch (cause) {
      const message = (cause as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'The update request could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="mt-4 mr-2 rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5">Update rent / deposit</button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="amendment-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <h2 id="amendment-title" className="text-lg font-bold text-text">Propose agreement updates</h2>
        <p className="mt-1 text-sm text-text-muted">The current terms stay in effect until the tenant accepts.</p>
        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-text">Monthly rent (PKR)<input required type="number" min="0" step="1" value={rent} onChange={(event) => setRent(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>
          <label className="block text-sm font-medium text-text">Security deposit (PKR)<input required type="number" min="0" step="1" value={deposit} onChange={(event) => setDeposit(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>
          <label className="block text-sm font-medium text-text">Note for tenant (optional)<textarea maxLength={1000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Close</button><button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Sending…' : 'Send request'}</button></div>
        </form>
      </section>
    </div>}
  </>;
}
