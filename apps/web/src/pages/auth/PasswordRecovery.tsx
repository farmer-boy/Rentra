import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';

export default function PasswordRecovery() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isResetPage = location.pathname === '/reset-password';
  const token = searchParams.get('token')?.trim() ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const resetTokenMissing = isResetPage && !token;

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await authAPI.requestPasswordReset(email.trim());
      setMessage(result.message || 'If the account can receive email, a reset link has been sent.');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'We could not send a reset link. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await authAPI.resetPassword(token, password);
      setMessage(result.message || 'Your password has been reset. You can now sign in.');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'We could not reset your password. Request a fresh link and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetComplete = isResetPage && Boolean(message);
  const showResetForm = isResetPage && Boolean(token) && !resetComplete;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-9">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text2)] transition hover:text-[var(--green)]">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-dim)] text-[var(--green-soft)]">
          {showResetForm ? <KeyRound size={22} /> : <Mail size={22} />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {isResetPage ? (resetTokenMissing ? 'Reset link is missing' : resetComplete ? 'Password updated' : 'Choose a new password') : 'Forgot your password?'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
          {isResetPage
            ? resetTokenMissing
              ? 'This reset link is incomplete. Request a new one and use the link in your email.'
              : resetComplete
                ? 'Your password has been changed successfully. Sign in with your new password.'
                : 'Use a new password with at least 6 characters.'
            : 'Enter your account email and we will send you a secure password reset link.'}
        </p>

        {message && (
          <div role="status" className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--green-dim)] p-3 text-sm text-[var(--text)]">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isResetPage && (
          <form onSubmit={(event) => void submitRequest(event)} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border px-3.5 py-3 text-sm"
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[var(--green)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--green-hover)] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Sending link…' : 'Send reset link'}
            </button>
          </form>
        )}

        {showResetForm && (
          <form onSubmit={(event) => void submitReset(event)} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              New password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border px-3.5 py-3 text-sm"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Confirm new password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border px-3.5 py-3 text-sm"
              />
            </label>
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[var(--green)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--green-hover)] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}

        {(resetComplete || resetTokenMissing) && (
          <Link to={resetComplete ? '/login' : '/forgot-password'} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--green)] hover:text-[var(--green-hover)]">
            {resetComplete ? <ShieldCheck size={16} /> : <Mail size={16} />}
            {resetComplete ? 'Continue to sign in' : 'Request a new reset link'}
          </Link>
        )}
      </section>
    </main>
  );
}
