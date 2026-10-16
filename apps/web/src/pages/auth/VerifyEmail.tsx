import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>(
    token ? 'ready' : 'error',
  );
  const [message, setMessage] = useState(
    token ? '' : 'This verification link is incomplete. Request a new one from your account.',
  );

  const verify = async () => {
    if (!token || status === 'loading' || status === 'success') return;
    setStatus('loading');
    setMessage('');
    try {
      const result = await authAPI.verifyEmail(token);
      setMessage(result.message || 'Your email address has been verified.');
      setStatus('success');
    } catch (requestError: unknown) {
      setMessage(getApiErrorMessage(requestError, 'We could not verify this email. Request a new link and try again.'));
      setStatus('error');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-9">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text2)] transition hover:text-[var(--green)]">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-dim)] text-[var(--green-soft)]">
          {status === 'success' ? <CheckCircle2 size={22} /> : <MailCheck size={22} />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {status === 'success' ? 'Email verified' : 'Verify your email'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
          {status === 'success'
            ? 'Your Rentra account email is confirmed.'
            : 'Confirm that you own this email address to finish verifying your Rentra account.'}
        </p>

        {message && (
          <div
            role={status === 'error' ? 'alert' : 'status'}
            className={`mt-5 rounded-xl border p-3 text-sm ${
              status === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-[var(--border)] bg-[var(--green-dim)] text-[var(--text)]'
            }`}
          >
            {message}
          </div>
        )}

        {(status === 'ready' || (status === 'error' && token)) && (
          <button
            type="button"
            onClick={() => void verify()}
            className="mt-6 w-full rounded-xl bg-[var(--green)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--green-hover)]"
          >
            {status === 'error' ? 'Try verification again' : 'Verify email address'}
          </button>
        )}
        {status === 'loading' && (
          <p role="status" className="mt-6 text-sm text-[var(--text2)]">Verifying your email…</p>
        )}
        {status === 'success' && (
          <Link to="/login" className="mt-6 inline-flex text-sm font-semibold text-[var(--green)] hover:text-[var(--green-hover)]">
            Continue to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
