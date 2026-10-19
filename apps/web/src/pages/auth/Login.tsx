import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authAPI.login(form);
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
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex justify-center mb-4 mx-auto hover:opacity-80 transition-opacity"
            title="Go to home"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
              <img src="/logo.jpg" alt="Rentra" className="h-full w-full object-contain" style={{filter: 'drop-shadow(0 8px 12px rgb(var(--rentra-shadow) / 15%))'}} />
            </div>
          </button>
          <h1 className="mb-2 text-3xl font-bold text-text">
            Sign in to Rentra
          </h1>
          <p className="text-sm text-text-muted">
            Access your account to manage and explore rental properties.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Username/Email Field */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-text">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              placeholder=""
              title="Enter your email address"
              className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 text-sm font-normal text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Password Field with Forgot Password Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-text">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                placeholder=""
                title="Enter your password"
                className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 pr-12 text-sm font-normal text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-text-subtle transition-colors hover:text-text"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-primary py-3 text-base font-bold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-text-muted">
          New to Rentra?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-primary transition-colors hover:text-primary-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
