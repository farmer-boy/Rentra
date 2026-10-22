import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';

type Status = 'ready' | 'loading' | 'resending' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() ?? '';
  const [email, setEmail] = useState(searchParams.get('email')?.trim() ?? '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  const [message, setMessage] = useState('');
  const { login } = useAuthStore();

  const verifyLegacyLink = async () => {
    if (!token || status === 'loading') return;
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

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const result = await authAPI.verifyRegistration(email.trim(), code);
      login(result.user, result.accessToken);
      setStatus('success');
      const roles = result.user.roles ?? (result.user.role ? [result.user.role] : ['TENANT']);
      navigate(roles.includes('ADMIN') ? '/admin' : '/dashboard');
    } catch (requestError: unknown) {
      setMessage(getApiErrorMessage(requestError, 'The code could not be verified. Check it and try again.'));
      setStatus('error');
    }
  };

  const resendCode = async () => {
    if (!email.trim() || status === 'resending') return;
    setStatus('resending');
    setMessage('');
    try {
      const result = await authAPI.resendRegistrationCode(email.trim());
      setMessage(result.message || 'A new code was sent to your email.');
      setStatus('ready');
    } catch (requestError: unknown) {
      setMessage(getApiErrorMessage(requestError, 'We could not send a new code. Please try again.'));
      setStatus('error');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-9">
        <Link to="/register" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text2)] transition hover:text-[var(--green)]">
          <ArrowLeft size={16} /> Back to registration
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-dim)] text-[var(--green-soft)]">
          {status === 'success' ? <CheckCircle2 size={22} /> : <MailCheck size={22} />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {status === 'success' ? 'Email verified' : 'Verify your email'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text2)]">
          {token
            ? 'Confirm your email address to finish verifying your Rentra account.'
            : <>We sent a 6-digit code to <strong>{email || 'your email address'}</strong>. Enter it below to create your account.</>}
        </p>

        {message && (
          <div role={status === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border p-3 text-sm ${status === 'error' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-[var(--border)] bg-[var(--green-dim)] text-[var(--text)]'}`}>
            {message}
          </div>
        )}

        {token ? (
          status !== 'success' && (
            <button type="button" disabled={status === 'loading'} onClick={() => void verifyLegacyLink()} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-50">
              {status === 'loading' ? 'Verifying…' : 'Verify email address'}
            </button>
          )
        ) : (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold" htmlFor="registration-email">Email address</label>
            <input id="registration-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-primary" />
            <label className="block text-sm font-semibold" htmlFor="registration-code">Verification code</label>
            <input id="registration-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-primary" />
            <button type="submit" disabled={status === 'loading' || status === 'resending'} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-50">
              {status === 'loading' ? 'Checking code…' : 'Verify code and create account'}
            </button>
            <button type="button" disabled={status === 'loading' || status === 'resending'} onClick={() => void resendCode()} className="w-full py-2 text-sm font-semibold text-[var(--green)] hover:underline disabled:opacity-50">
              {status === 'resending' ? 'Sending…' : 'Resend code'}
            </button>
          </form>
        )}

        {status === 'success' && token && (
          <Link to="/login" className="mt-6 inline-flex text-sm font-semibold text-[var(--green)] hover:text-[var(--green-hover)]">Continue to sign in</Link>
        )}
      </section>
    </main>
  );
}
