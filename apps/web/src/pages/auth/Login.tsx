import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';
import type { AuthResponse } from '../../api/types';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: { theme: string; size: string; text: string; shape: string; width: number },
      ) => void;
    };
  };
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const finishLogin = (data: AuthResponse) => {
    login(data.user, data.accessToken);
    toast.success('Login successful! 👋');

    const roles = data.user.roles && data.user.roles.length > 0
      ? data.user.roles
      : data.user.role
        ? [data.user.role]
        : ['TENANT'];
    const requestedReturnTo = (location.state as { from?: unknown } | null)?.from;
    const returnTo = typeof requestedReturnTo === 'string' &&
      requestedReturnTo.startsWith('/') &&
      !requestedReturnTo.startsWith('//')
      ? requestedReturnTo
      : undefined;

    if (returnTo) navigate(returnTo);
    else if (roles.includes('ADMIN')) navigate('/admin');
    else if (roles.includes('LANDLORD')) navigate('/landlord');
    else navigate('/tenant');
  };

  const finishLoginRef = useRef(finishLogin);
  finishLoginRef.current = finishLogin;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    let active = true;
    const initializeGoogleButton = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google;
      if (!active || !google || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          setLoading(true);
          void authAPI.loginWithGoogle(credential)
            .then((result) => finishLoginRef.current(result))
            .catch((requestError: unknown) => {
              toast.error(getApiErrorMessage(requestError, 'Google sign-in failed. Please try again.'));
            })
            .finally(() => setLoading(false));
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(400, googleButtonRef.current.clientWidth),
      });
    };

    let script = document.querySelector<HTMLScriptElement>('script[data-rentra-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.rentraGoogleIdentity = 'true';
      script.addEventListener('load', initializeGoogleButton, { once: true });
      document.head.appendChild(script);
    } else if ((window as Window & { google?: GoogleIdentity }).google) {
      initializeGoogleButton();
    } else {
      script.addEventListener('load', initializeGoogleButton, { once: true });
    }

    return () => {
      active = false;
      script?.removeEventListener('load', initializeGoogleButton);
    };
  }, [googleClientId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await authAPI.login(form);
      setVerificationRequired(result.loginVerificationRequired);
      toast.success(`Sign-in code sent to ${result.email}`);
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await authAPI.verifyLoginCode(form.email.trim(), verificationCode);
      finishLogin(result);
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'The sign-in code could not be verified.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const result = await authAPI.login(form);
      toast.success(`A new sign-in code was sent to ${result.email}`);
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Could not resend the sign-in code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="mx-auto mb-4 flex justify-center transition-opacity hover:opacity-80"
            title="Go to home"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
              <img src="/logo.jpg" alt="Rentra" className="h-full w-full object-contain" style={{ filter: 'drop-shadow(0 8px 12px rgb(var(--rentra-shadow) / 15%))' }} />
            </div>
          </button>
          <h1 className="mb-2 text-3xl font-bold text-text">
            {verificationRequired ? 'Verify it’s you' : 'Sign in to Rentra'}
          </h1>
          <p className="text-sm text-text-muted">
            {verificationRequired
              ? <>We sent a 6-digit sign-in code to <strong>{form.email}</strong>.</>
              : 'Access your account to manage and explore rental properties.'}
          </p>
        </div>

        {!verificationRequired ? (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                autoComplete="email"
                title="Enter your email address"
                className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 text-sm font-normal text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-text" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="current-password"
                  title="Enter your password"
                  className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 pr-12 text-sm font-normal text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-text-subtle transition-colors hover:text-text" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-primary py-3 text-base font-bold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Checking account…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="mb-6 space-y-4">
            <label className="mb-2 block text-sm font-semibold text-text" htmlFor="login-verification-code">Verification code</label>
            <input
              id="login-verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 text-center text-lg tracking-[0.4em] text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3 text-base font-bold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Verifying…' : 'Verify code and sign in'}
            </button>
            <button type="button" disabled={loading} onClick={() => void handleResendCode()} className="w-full py-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50">
              {loading ? 'Please wait…' : 'Resend code'}
            </button>
            <button type="button" disabled={loading} onClick={() => { setVerificationRequired(false); setVerificationCode(''); }} className="w-full py-1 text-sm text-text-muted hover:underline">
              Back to email and password
            </button>
          </form>
        )}

        {!verificationRequired && (
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3 text-xs text-text-muted">
              <span className="h-px flex-1 bg-border" />
              <span>OR</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {googleClientId ? (
              <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
            ) : (
              <button type="button" disabled className="w-full rounded-lg border border-border bg-surface py-3 text-sm font-semibold text-text-muted opacity-70">
                Continue with Google (setup required)
              </button>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          New to Rentra?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-primary transition-colors hover:text-primary-hover">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
