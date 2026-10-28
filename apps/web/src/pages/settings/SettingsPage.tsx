import { useEffect, useState } from 'react';
import { ChevronRight, Monitor, Moon, Sun } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/useTheme';
import { usersAPI } from '../../api/users';
import { getApiErrorMessage } from '../../api/api-error';
import BackToDashboard from '../../components/layout/BackToDashboard';

type MenuSection = 'account-preferences' | 'sign-in-security' | 'data-privacy' | 'notifications';
type AccountSubMenu = 'profile-info' | 'display' | 'general' | 'syncing' | 'account-management';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const { themeMode, setThemeMode } = useTheme();

  const [activeSection, setActiveSection] = useState<MenuSection>(() => {
    const section = searchParams.get('section');
    return section === 'sign-in-security' ||
      section === 'data-privacy' ||
      section === 'notifications'
      ? section
      : 'account-preferences';
  });
  const [activeSubMenu, setActiveSubMenu] = useState<AccountSubMenu>('profile-info');
  const [themeDisplayMode, setThemeDisplayMode] = useState<'device' | 'dark' | 'light'>(themeMode);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    usersAPI.getMe().then((data) => {
      setProfileData({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
    }).catch((requestError: unknown) => setProfileError(getApiErrorMessage(requestError, 'Your account information could not be loaded.')))
      .finally(() => setProfileLoading(false));
  }, []);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const data = await usersAPI.updateMe(profileData);
      if (user) updateUser(data);
      setProfileMessage('Profile updated.');
    } catch (requestError: unknown) {
      setProfileError(getApiErrorMessage(requestError, 'Your profile could not be saved.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleThemeChange = (mode: 'device' | 'dark' | 'light') => {
    setThemeDisplayMode(mode);
    setThemeMode(mode);
  };

  const handleBackToHome = () => {
    const role = user?.role || 'TENANT';
    navigate(role === 'ADMIN' ? '/admin' : role === 'LANDLORD' ? '/landlord' : '/tenant');
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const renderAccountPreferencesContent = () => {
    switch (activeSubMenu) {
      case 'profile-info':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold text-text mb-3 md:mb-4`}>Profile Information</h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className={`text-[11px] md:text-[12px] text-text-muted mb-1 md:mb-2 block`}>Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    aria-label="Full Name"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 bg-surface border-border text-text placeholder:text-muted border rounded-lg text-[11px] md:text-[12px] focus:outline-none focus:border-primary`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] md:text-[12px] text-text-muted mb-1 md:mb-2 block`}>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="your@email.com"
                    aria-label="Email Address"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 bg-surface border-border text-text placeholder:text-muted border rounded-lg text-[11px] md:text-[12px] focus:outline-none focus:border-primary`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] md:text-[12px] text-text-muted mb-1 md:mb-2 block`}>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+92 300 0000000"
                    aria-label="Phone Number"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 bg-surface border-border text-text placeholder:text-muted border rounded-lg text-[11px] md:text-[12px] focus:outline-none focus:border-primary`}
                  />
                </div>
              </div>
            </div>
            {profileLoading && <p className="text-xs text-gray-500">Loading account information...</p>}
            <button onClick={() => void saveProfile()} disabled={profileSaving || profileLoading} className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-primary-contrast  text-[11px] md:text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50">
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {profileError && <p role="alert" className="text-xs text-red-600">{profileError}</p>}
            {profileMessage && <p role="status" className="text-xs text-green-600">{profileMessage}</p>}
          </div>
        );

      case 'display':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold text-text mb-2 md:mb-4`}>Display Settings</h3>
              <p className={`text-[10px] md:text-[12px] text-text-muted mb-3 md:mb-4`}>Choose how your Rentra experience looks on this device</p>

              <div className="space-y-2 md:space-y-3">
                <label className={`flex items-center p-2 md:p-3 border-border hover:bg-surface border rounded-lg cursor-pointer transition-colors group`}>
                  <input
                    type="radio"
                    name="theme"
                    value="device"
                    checked={themeDisplayMode === 'device'}
                    onChange={(e) => handleThemeChange(e.target.value as 'device' | 'dark' | 'light')}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-2 md:ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className={'text-text-muted group-hover:text-text'} />
                      <span className={`text-[10px] md:text-[12px] font-medium text-text`}>Device Settings</span>
                    </div>
                    <p className={`text-[9px] md:text-[11px] text-text-muted mt-1`}>
                      Use the mode that's already selected in this device's settings
                    </p>
                  </div>
                </label>

                <label className={`flex items-center p-2 md:p-3 border-border hover:bg-surface border rounded-lg cursor-pointer transition-colors group`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={themeDisplayMode === 'dark'}
                    onChange={(e) => handleThemeChange(e.target.value as 'device' | 'dark' | 'light')}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-2 md:ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Moon size={14} className={'text-text-muted group-hover:text-text'} />
                      <span className={`text-[10px] md:text-[12px] font-medium text-text`}>Dark Mode</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-2 md:p-3 border-border hover:bg-surface border rounded-lg cursor-pointer transition-colors group`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={themeDisplayMode === 'light'}
                    onChange={(e) => handleThemeChange(e.target.value as 'device' | 'dark' | 'light')}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-2 md:ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Sun size={14} className={'text-text-muted group-hover:text-text'} />
                      <span className={`text-[10px] md:text-[12px] font-medium text-text`}>Light Mode</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold text-text mb-3 md:mb-4`}>General Preferences</h3>
              <p className={`text-xs text-text-muted`}>General account preferences are not currently supported by the settings API.</p>
            </div>
          </div>
        );

      case 'syncing':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold text-text mb-3 md:mb-4`}>Syncing Options</h3>
              <p className={`text-xs text-text-muted`}>Cross-device syncing and preference backup are not currently supported by the settings API.</p>
            </div>
          </div>
        );

      case 'account-management':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold text-text mb-3 md:mb-4`}>Account Management</h3>
              <p className={`text-xs text-text-muted`}>Data export and account deactivation/deletion are not currently supported by the available account APIs.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="bg-surface border-border border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Back to Dashboard"
          >
            <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface2)' }}>
              <img 
                src="/logo.jpg" 
                alt="Rentra logo"
                className="w-full h-full object-contain" 
                style={{filter: 'drop-shadow(0 4px 6px rgb(var(--rentra-shadow) / 10%)) drop-shadow(0 0 8px rgb(var(--rentra-shadow) / 5%))'}}
              />
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className={`bg-primary-soft border-primary w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-bold text-primary`}>
              {initials}
            </div>
            <span className={`text-[12px] font-semibold text-text`}>{user?.fullName}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-3 md:pt-6">
        <div className="max-w-6xl mx-auto px-3 md:px-6">
          <BackToDashboard />
          <div className="mb-4 md:mb-8">
            <h1 className={`text-xl md:text-3xl font-bold text-text mb-1 md:mb-2`}>Settings</h1>
            <p className={`text-[11px] md:text-sm text-text-muted`}>Manage your account preferences and security settings</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-6">
            {/* Left Sidebar */}
            <div className="w-full flex-shrink-0 md:w-64">
              <div className="bg-surface border-border rounded-lg border overflow-hidden md:sticky md:top-[100px] text-[11px] md:text-[12px]">
                <button
                  onClick={() => { setActiveSection('account-preferences'); setActiveSubMenu('profile-info'); }}
                  className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'account-preferences' ? 'bg-primary-soft text-primary border-primary/50' : 'text-text-muted hover:bg-surface-2 border-border'}`}
                >
                  ACCOUNT PREFERENCES
                </button>

                {activeSection === 'account-preferences' && (
                  <div className="bg-bg border-border">
                    {[{ id: 'profile-info', label: 'Profile Information' }, { id: 'display', label: 'Display' }, { id: 'general', label: 'General Preferences' }, { id: 'syncing', label: 'Syncing Options' }, { id: 'account-management', label: 'Account Management' }].map((item) => (
                      <button key={item.id} onClick={() => setActiveSubMenu(item.id as AccountSubMenu)} className={`w-full text-left px-3 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[11px] flex items-center justify-between transition-colors ${activeSubMenu === item.id ? 'bg-primary-soft text-primary font-medium' : 'text-text-muted hover:bg-surface-2'}`}>
                        {item.label}
                        {activeSubMenu === item.id && <ChevronRight size={12} className={'text-primary'} />}
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={() => setActiveSection('sign-in-security')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'sign-in-security' ? 'bg-primary-soft text-primary border-primary/50' : 'text-text-muted hover:bg-surface-2 border-border'}`}>
                  SIGN IN & SECURITY
                </button>

                <button onClick={() => setActiveSection('data-privacy')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'data-privacy' ? 'bg-primary-soft text-primary border-primary/50' : 'text-text-muted hover:bg-surface-2 border-border'}`}>
                  DATA PRIVACY
                </button>

                <button onClick={() => setActiveSection('notifications')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors ${activeSection === 'notifications' ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-surface-2'}`}>
                  NOTIFICATIONS
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 w-full">
              {activeSection === 'account-preferences' && (
                <div className="bg-surface border-border rounded-lg border p-3 md:p-8">
                  {renderAccountPreferencesContent()}
                </div>
              )}

              {activeSection === 'sign-in-security' && (
                <div className="bg-surface border-border rounded-lg border p-3 md:p-8">
                  <h3 className={`text-sm md:text-lg font-semibold text-text mb-3 md:mb-4`}>Sign In & Security</h3>
                  <p className={`text-xs text-text-muted`}>Password changes and two-factor authentication are not available through the current account APIs.</p>
                </div>
              )}

              {activeSection === 'data-privacy' && (
                <div className="bg-surface border-border rounded-lg border p-3 md:p-8">
                  <h3 className={`text-sm md:text-lg font-semibold text-text mb-3 md:mb-4`}>Data Privacy</h3>
                  <p className={`text-xs text-text-muted`}>Usage analytics and privacy preference controls are not currently supported by the settings API.</p>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="bg-surface border-border rounded-lg border p-3 md:p-8">
                  <h3 className={`text-sm md:text-lg font-semibold text-text mb-3 md:mb-4`}>Notifications</h3>
                  <p className={`text-xs text-text-muted`}>Notification preferences are not currently supported by the settings API.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
