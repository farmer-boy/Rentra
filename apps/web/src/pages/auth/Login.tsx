import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const loginStyles = `
  /* Prevent Chrome autofill styling */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #1a1a1a inset !important;
    -webkit-text-fill-color: white !important;
    caret-color: white !important;
    transition: background-color 5000s ease-in-out 0s !important;
  }
  
  /* Additional autofill blocking */
  input[type="email"]:-webkit-autofill,
  input[type="password"]:-webkit-autofill {
    -webkit-text-fill-color: white !important;
    -webkit-box-shadow: 0 0 0px 1000px #1a1a1a inset !important;
    caret-color: white !important;
  }
  
  /* Hide autofill dropdown */
  input::-webkit-contacts-auto-fill-button,
  input::-webkit-credentials-auto-fill-button {
    display: none !important;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'LANDLORD') navigate('/landlord');
      else navigate('/tenant');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      console.error('Login error:', err);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} min-h-screen flex items-center justify-center p-4`}>
      <style>{loginStyles}</style>
      
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex justify-center mb-4 mx-auto hover:opacity-80 transition-opacity"
            title="Go to home"
          >
            <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <img src="/logo.jpg" alt="Renova" className="w-full h-full object-contain" style={{filter: 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.15))'}} />
            </div>
          </button>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Sign in to Rentra
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Access your account to manage and explore rental properties.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Username/Email Field */}
          <div>
            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Username or Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="off"
              placeholder=""
              title="Enter your email or username"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-sm font-normal ${
                isDark
                  ? 'bg-[#1a1a1a] border-white/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-gray-50 border-gray-400 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              } outline-none`}
              required
            />
          </div>

          {/* Password Field with Forgot Password Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="off"
                placeholder=""
                title="Enter your password"
                className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all text-sm font-normal ${
                  isDark
                    ? 'bg-[#1a1a1a] border-white/10 text-white placeholder-[#666] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-gray-50 border-gray-400 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                } outline-none`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-3.5 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/30 mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          New to Rentra?{' '}
          <Link to="/register" className="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

