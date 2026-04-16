import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authAPI.login(form);
      login(data.user, data.accessToken);
      toast.success('Login successful! 👋');
      // Role ke hisaab se redirect
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
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/rentra_logo.png" alt="Rentra Logo" className="h-12 w-auto mx-auto mb-3" />
          <div className={`text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'} tracking-widest`}>TRANSPARENT RENTING</div>
        </div>

        <div className={`${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-white border-gray-300'} border rounded-2xl p-6`}>
          <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Welcome Back 👋</h2>
          <p className={`text-[13px] ${isDark ? 'text-[#888]' : 'text-gray-600'} mb-6`}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-600'} tracking-widest mb-1.5`}>EMAIL</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="ali@example.com"
                className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666]' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400'} border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500/50 transition-colors`}
                required
              />
            </div>
            <div>
              <label className={`block text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-600'} tracking-widest mb-1.5`}>PASSWORD</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666]' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400'} border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500/50 transition-colors`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>

          <p className={`text-center text-[13px] ${isDark ? 'text-[#888]' : 'text-gray-600'} mt-4`}>
            Account nahi hai?{' '}
            <Link to="/register" className="text-green-600 hover:underline">Register karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
