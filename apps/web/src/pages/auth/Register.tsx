import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { getApiErrorMessage } from '../../api/api-error';
import { useTheme } from '../../context/useTheme';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const registerStyles = `
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
    background-image: url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=90');
    background-size: cover;
    background-position: center;
    background-attachment: scroll;
  }
  
  .left-section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgb(18 19 18 / 0.62), rgb(38 36 33 / 0.34));
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
    color: rgb(var(--rentra-white));
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
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }
  
  .password-strength-bar {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
  }
`;

function getPakistanMobileDigits(value: string) {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('0092')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('92')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

function getPasswordStrengthColor(strength: number) {
  if (strength < 30) return 'rgb(var(--rentra-danger))';
  if (strength < 60) return 'rgb(var(--rentra-warning))';
  return 'rgb(var(--rentra-primary))';
}

type RegistrationForm = {
  username: string;
  email: string;
  phone: string;
  cnic: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [form, setForm] = useState<RegistrationForm>({
    username: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    confirmPassword: ''
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

  const handlePasswordChange = (value: string) => {
    setForm({ ...form, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  useEffect(() => {
    if (strengthBarRef.current) {
      strengthBarRef.current.style.width = `${passwordStrength}%`;
      strengthBarRef.current.style.backgroundColor = getPasswordStrengthColor(passwordStrength);
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

    if (!/^3\d{9}$/.test(form.phone)) {
      toast.error('Enter a valid Pakistani mobile number with 10 digits after +92');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register({
        fullName: form.username,
        email: form.email,
        phone: `+92${form.phone}`,
        cnic: form.cnic,
        password: form.password,
      });
      toast.success('Verification code sent to your email.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: 'username' | 'email',
    label: string,
    type = 'text',
    placeholder = '',
    icon?: React.ReactNode
  ) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-text">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={key}
          autoComplete="off"
          value={form[key]}
          onChange={(event) => setForm({ ...form, [key]: event.target.value })}
          placeholder={placeholder}
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
          data-lpignore="true"
          data-form-type="other"
          data-1p-ignore="true"
          data-bitwarden-ignore="true"
          onFocus={(e) => {
            e.currentTarget.setAttribute('autocomplete', 'off');
          }}
          onInput={(e) => {
            e.currentTarget.setAttribute('autocomplete', 'off');
          }}
          className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        {icon && <div className="absolute text-gray-400 right-3 top-12">{icon}</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
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
        <div className="right-section relative bg-surface">
          {/* Sign In Link - Top Right Corner */}
          <div className="absolute top-6 right-6">
            <p className="text-right text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" state={location.state} className="font-semibold text-primary transition-colors hover:text-primary-hover">
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
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface2">
                  <img src="/logo.jpg" alt="Rentra" className="h-full w-full object-contain" style={{filter: 'drop-shadow(0 8px 12px rgb(var(--rentra-shadow) / 15%))'}} />
                </div>
                <h2 className="text-2xl font-bold text-text">Rentra</h2>
              </button>
              <p className="text-sm text-text-muted">
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
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">
                    Phone Number
                  </label>
                  <div className="flex w-full overflow-hidden rounded-lg border-2 border-border bg-surface text-text transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <span className="flex items-center border-r border-border px-3 text-sm text-text-muted">
                      +92
                    </span>
                    <input
                      type="tel"
                      name="registration-phone"
                      autoComplete="off"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: getPakistanMobileDigits(e.target.value) })}
                      placeholder="300 1234567"
                      aria-label="Pakistani mobile number"
                      className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-text outline-none placeholder:text-text-subtle"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-subtle">
                    Enter 0300... or +92 300...; the country code is added automatically.
                  </p>
                </div>
                
                {/* CNIC with Auto Formatting */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text">
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
                    className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">
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
                    data-1p-ignore="true"
                    data-bitwarden-ignore="true"
                    onFocus={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    onInput={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 pr-12 text-sm text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-text-subtle hover:text-text"
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
                <label className="mb-2 block text-sm font-semibold text-text">
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
                    data-1p-ignore="true"
                    data-bitwarden-ignore="true"
                    onFocus={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    onInput={(e) => {
                      e.currentTarget.setAttribute('autocomplete', 'off');
                    }}
                    className="w-full rounded-lg border-2 border-border bg-surface px-4 py-3 pr-12 text-sm text-text outline-none transition-all placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-text-subtle hover:text-text"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-primary py-3 text-base font-bold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending verification code...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
