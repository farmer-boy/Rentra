import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login } = useAuthStore();
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    password: string;
    role: 'TENANT' | 'LANDLORD';
  }>({
    fullName: '', email: '', phone: '', cnic: '', password: '', role: 'TENANT'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authAPI.register(form);
      login(data.user, data.accessToken);
      toast.success('Registration successful! 🎉');
      if (data.user.role === 'LANDLORD') navigate('/landlord');
      else navigate('/tenant');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      console.error('Registration error:', err);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className={`block text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-600'} tracking-widest mb-1.5`}>{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className={`w-full ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666]' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400'} border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500/50 transition-colors`}
        required
      />
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/rentra_logo.png" alt="Rentra Logo" className="h-12 w-auto mx-auto mb-3" />
          <div className={`text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'} tracking-widest`}>CREATE ACCOUNT</div>
        </div>

        <div className={`${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-white border-gray-300'} border rounded-2xl p-6`}>
          <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Create Your Account</h2>
          <p className={`text-[13px] ${isDark ? 'text-[#888]' : 'text-gray-600'} mb-6`}>Join Pakistan's secure and transparent rental platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('fullName', 'FULL NAME', 'text', 'Ali Raza')}
            {field('email', 'EMAIL', 'email', 'ali@example.com')}
            {field('phone', 'PHONE', 'text', '+923001234567')}
            {field('cnic', 'CNIC', 'text', '35202-1234567-1')}
            {field('password', 'PASSWORD', 'password', '••••••••')}

            {/* Role Selection */}
            <div>
              <label className={`block text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-600'} tracking-widest mb-2`}>ACCOUNT TYPE</label>
              <div className="grid grid-cols-2 gap-2">
                {(['TENANT', 'LANDLORD'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r as 'TENANT' | 'LANDLORD' })}
                    className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                      form.role === r
                        ? 'bg-green-100 text-green-700 border-green-400'
                        : isDark
                          ? 'bg-[#0f0f0f] text-[#888] border-white/10 hover:text-[#ccc]'
                          : 'bg-gray-50 text-gray-600 border-gray-300 hover:text-black'
                    }`}
                  >
                    {r === 'TENANT' ? '🏠 Tenant' : '🏢 Landlord'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#555] mt-4">
            Pehle se account hai?{' '}
            <Link to="/login" className="text-green-400 hover:underline">Login karo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
