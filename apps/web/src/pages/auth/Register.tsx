import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const registerStyles = `
  /* Prevent Chrome autofill styling */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #0f0f0f inset !important;
    -webkit-text-fill-color: white !important;
    caret-color: white !important;
    transition: background-color 5000s ease-in-out 0s !important;
  }
  
  /* Prevent autofill background change */
  input:-webkit-autofill::first-line {
    font-family: inherit;
  }
  
  /* Additional autofill blocking */
  input[type="email"]:-webkit-autofill,
  input[type="password"]:-webkit-autofill {
    -webkit-text-fill-color: white !important;
    -webkit-box-shadow: 0 0 0px 1000px #0f0f0f inset !important;
    caret-color: white !important;
  }
  
  /* Hide autofill dropdown */
  input::-webkit-contacts-auto-fill-button,
  input::-webkit-credentials-auto-fill-button {
    display: none !important;
  }
  
  /* Smooth transitions */
  .split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
  }
  
  @media (max-width: 768px) {
    .split-container {
      grid-template-columns: 1fr;
    }
  }
  
  /* Left section styling */
  .left-section {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('/logo1.jpeg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  }
  
  .left-section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    z-index: 5;
  }
  
  .left-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
    background-size: cover;
    opacity: 0.2;
    z-index: 7;
  }
  
  .left-content {
    position: relative;
    z-index: 20;
    text-align: center;
    color: white;
    padding: 40px;
    max-width: 450px;
  }
  
  .left-content h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 20px;
    line-height: 1.3;
  }
  
  .left-content p {
    font-size: 16px;
    opacity: 0.95;
    line-height: 1.6;
  }
  
  /* Right section styling */
  .right-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  
  /* Password strength indicator */
  .password-strength {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }
  
  .password-strength-bar {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login } = useAuthStore();
  const [form, setForm] = useState<{
    username: string;
    email: string;
    phone: string;
    cnic: string;
    password: string;
    confirmPassword: string;
    role: 'TENANT' | 'LANDLORD';
  }>({
    username: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirmPassword: '',
    role: 'TENANT'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const strengthBarRef = useRef<HTMLDivElement>(null);

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.length >= 12) strength += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pass)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return '#ef4444';
    if (passwordStrength < 60) return '#f59e0b';
    return '#10b981';
  };

  const handlePasswordChange = (value: string) => {
    setForm({ ...form, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  useEffect(() => {
    if (strengthBarRef.current) {
      strengthBarRef.current.style.width = `${passwordStrength}%`;
      strengthBarRef.current.style.backgroundColor = getPasswordStrengthColor();
    }
  }, [passwordStrength]);

  const formatCNIC = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Apply formatting: XXXXX-XXXXXXX-X
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12);
    }
    if (cleaned.length > 12) {
      formatted = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12) + '-' + cleaned.slice(12, 13);
    }
    
    return formatted;
  };

  const handleCNICChange = (value: string) => {
    const formatted = formatCNIC(value);
    setForm({ ...form, cnic: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register({
        fullName: form.username,
        email: form.email,
        phone: form.phone,
        cnic: form.cnic,
        password: form.password,
        role: form.role
      });
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

  const field = (
    key: string,
    label: string,
    type = 'text',
    placeholder = '',
    icon?: React.ReactNode
  ) => (
    <div>
      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={`temp_${Math.random().toString(36).substring(7)}`}
          autoComplete="off"
          value={(form as any)[key]}
          onChange={e => {
            if (key === 'password') {
              handlePasswordChange(e.target.value);
            } else {
              setForm({ ...form, [key]: e.target.value });
            }
          }}
          placeholder={placeholder}
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
          data-lpignore="true"
          data-form-type="other"
          data-1p-ignore={true as any}
          data-bitwarden-ignore={true as any}
          onFocus={(e) => {
            e.currentTarget.setAttribute('autocomplete', 'off');
            e.currentTarget.value = e.currentTarget.value;
          }}
          onInput={(e) => {
            e.currentTarget.setAttribute('autocomplete', 'off');
          }}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-sm ${
            isDark
              ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          } outline-none`}
          required
        />
        {icon && <div className="absolute text-gray-400 right-3 top-12">{icon}</div>}
      </div>
    </div>
  );

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} min-h-screen`}>
      <style>{registerStyles}</style>
      
      <div className="split-container">
        {/* Left Section - Branding */}
        <div className={`left-section ${isDark ? 'hidden md:flex' : ''}`}>
          <div className="left-content">
            <h1>Create your account to explore premium rental properties</h1>
            <p>
              Find, list, and manage properties with ease using Rentra's transparent rental platform. 
              Your journey to seamless property management starts here.
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className={`right-section ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} relative`}>
          {/* Sign In Link - Top Right Corner */}
          <div className="absolute top-6 right-6">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-right`}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors text-emerald-500 hover:text-emerald-600">
                Sign in
              </Link>
            </p>
          </div>

          <div className="w-full max-w-md">
            {/* Logo and Header */}
            <div className="mb-8">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3 mb-4 transition-opacity hover:opacity-80"
                title="Go to home"
              >
                <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                  <img src="/logo.jpeg" alt="Rentra" className="object-contain w-full h-full" />
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Rentra</h2>
              </button>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Join Pakistan's transparent rental platform
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hidden prevent autofill field */}
              <input type="text" title="autofill-prevention" placeholder="autofill-prevention" className="hidden" autoComplete="off" />

              {/* Username */}
              {field('username', 'Username', 'text', 'Username')}

              {/* Email */}
              {field('email', 'Email', 'email', 'Email')}

              {/* Phone and CNIC in Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {field('phone', 'Phone Number', 'tel', 'Phone')}
                
                {/* CNIC with Auto Formatting */}
                <div>
                  <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    CNIC Number
                  </label>
                  <input
                    type="text"
                    name={`temp_${Math.random().toString(36).substring(7)}`}
                    autoComplete="off"
                    value={form.cnic}
                    onChange={e => handleCNICChange(e.target.value)}
                    placeholder="CNIC"
                    maxLength={15}
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                      isDark
                        ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name={`temp_${Math.random().toString(36).substring(7)}`}
                    autoComplete="off"
                    value={form.password}
                    onChange={e => handlePasswordChange(e.target.value)}
                    placeholder="Enter password"
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore={true as any}
                    data-bitwarden-ignore={true as any}
                    onFocus={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    onInput={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all text-sm ${
                      isDark
                        ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'} hover:${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.password && (
                  <div className="password-strength">
                    <div
                      ref={strengthBarRef}
                      className="password-strength-bar"
                    />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name={`temp_${Math.random().toString(36).substring(7)}`}
                    autoComplete="off"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm Password"
                    spellCheck="false"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore={true as any}
                    data-bitwarden-ignore={true as any}
                    onFocus={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    onInput={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all text-sm ${
                      isDark
                        ? 'bg-[#0f0f0f] border-white/10 text-white placeholder-[#666] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'} hover:${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Account Type Selection */}
              <div>
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Account Type
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  {(['TENANT', 'LANDLORD'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={`py-2.5 px-4 rounded-lg font-medium text-sm border-2 transition-all ${
                        form.role === role
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500'
                          : isDark
                            ? 'bg-[#0f0f0f] text-gray-400 border-white/10 hover:text-gray-300 hover:border-white/20'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      {role === 'TENANT' ? 'Tenant' : 'Landlord'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 text-base font-bold text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/30"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
