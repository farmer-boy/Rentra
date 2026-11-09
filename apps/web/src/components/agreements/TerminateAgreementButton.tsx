import { useState, type FormEvent } from 'react';
import { agreementsAPI } from '../../api/agreements';
import type { AgreementTerminationRequest } from '../../api/agreements';

interface TerminateAgreementButtonProps {
  agreementId: string;
  onRequested: (request: AgreementTerminationRequest) => void;
}

const getErrorMessage = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message ?? 'The agreement could not be cancelled. Please try again.';
};

export default function TerminateAgreementButton({ agreementId, onRequested }: TerminateAgreementButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setOpen(false);
    setReason('');
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError('Please enter a reason before cancelling the agreement.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const request = await agreementsAPI.terminate(agreementId, normalizedReason);
      onRequested(request);
      setOpen(false);
      setReason('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        Request agreement cancellation
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="terminate-agreement-title" className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <h2 id="terminate-agreement-title" className="text-lg font-bold text-text">Request agreement cancellation?</h2>
            <p className="mt-1 text-sm text-text-muted">The other party must approve this request. The agreement remains active until then.</p>
            <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
              <label htmlFor="agreement-termination-reason" className="block text-sm font-semibold text-text">Reason for cancellation <span aria-hidden="true">*</span></label>
              <textarea
                id="agreement-termination-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                minLength={1}
                maxLength={1000}
                rows={4}
                aria-describedby={error ? 'agreement-termination-error' : undefined}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Explain why you are cancelling this agreement"
              />
              {error && <p id="agreement-termination-error" role="alert" className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close} disabled={saving} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-muted disabled:opacity-50">Keep agreement</button>
                <button type="submit" disabled={saving || !reason.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Sending…' : 'Send cancellation request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
