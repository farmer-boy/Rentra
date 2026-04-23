import { useState } from 'react';
import { ChevronRight, Monitor, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';

type MenuSection = 'account-preferences' | 'sign-in-security' | 'data-privacy' | 'notifications';
type AccountSubMenu = 'profile-info' | 'display' | 'general' | 'syncing' | 'account-management';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { themeMode, setThemeMode, isDark } = useTheme();

  const [activeSection, setActiveSection] = useState<MenuSection>('account-preferences');
  const [activeSubMenu, setActiveSubMenu] = useState<AccountSubMenu>('profile-info');
  const [themeDisplayMode, setThemeDisplayMode] = useState<'device' | 'dark' | 'light'>(themeMode);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

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
              <h3 className={`text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Profile Information</h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className={`text-[11px] md:text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1 md:mb-2 block`}>Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    aria-label="Full Name"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-400 text-black placeholder-gray-500'} border rounded-lg text-[11px] md:text-[12px] focus:outline-none ${isDark ? 'focus:border-green-500' : 'focus:border-green-400'}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] md:text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1 md:mb-2 block`}>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="your@email.com"
                    aria-label="Email Address"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-400 text-black placeholder-gray-500'} border rounded-lg text-[11px] md:text-[12px] focus:outline-none ${isDark ? 'focus:border-green-500' : 'focus:border-green-400'}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] md:text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1 md:mb-2 block`}>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+92 300 0000000"
                    aria-label="Phone Number"
                    className={`w-full px-2 md:px-3 py-1.5 md:py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-400 text-black placeholder-gray-500'} border rounded-lg text-[11px] md:text-[12px] focus:outline-none ${isDark ? 'focus:border-green-500' : 'focus:border-green-400'}`}
                  />
                </div>
              </div>
            </div>
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-black text-[11px] md:text-[12px] font-semibold rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-2 md:mb-4`}>Display Settings</h3>
              <p className={`text-[10px] md:text-[12px] ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3 md:mb-4`}>Choose how your Renova experience looks on this device</p>

              <div className="space-y-2 md:space-y-3">
                <label className={`flex items-center p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors group`}>
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
                      <Monitor size={14} className={isDark ? 'text-gray-700 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'} />
                      <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Device Settings</span>
                    </div>
                    <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'} mt-1`}>
                      Use the mode that's already selected in this device's settings
                    </p>
                  </div>
                </label>

                <label className={`flex items-center p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors group`}>
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
                      <Moon size={14} className={isDark ? 'text-gray-700 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'} />
                      <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Dark Mode</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors group`}>
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
                      <Sun size={14} className={isDark ? 'text-gray-700 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'} />
                      <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Light Mode</span>
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
              <h3 className={`text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>General Preferences</h3>
              <div className="space-y-2 md:space-y-4">
                <label className={`flex items-center justify-between p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors`}>
                  <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Show online status</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Show online status" />
                </label>
                <label className={`flex items-center justify-between p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors`}>
                  <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Allow search engines to index profile</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Allow search engines to index profile" />
                </label>
                <label className={`flex items-center justify-between p-2 md:p-3 ${isDark ? 'border-white/10 hover:bg-[#1f1f1f]' : 'border-gray-400 hover:bg-gray-50'} border rounded-lg cursor-pointer transition-colors`}>
                  <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Make profile discoverable</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Make profile discoverable" />
                </label>
              </div>
            </div>
          </div>
        );

      case 'syncing':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Syncing Options</h3>
              <div className="space-y-2 md:space-y-4">
                <div className={`p-2 md:p-4 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50 border-gray-400'} border rounded-lg`}>
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Auto-sync listings across devices</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Auto-sync listings across devices" />
                  </div>
                  <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>Keep your listings synchronized in real-time</p>
                </div>
                <div className={`p-2 md:p-4 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50 border-gray-400'} border rounded-lg`}>
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Backup preferences</span>
                    <input type="checkbox" className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Backup preferences" />
                  </div>
                  <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>Automatically backup your settings and preferences</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account-management':
        return (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className={`text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Account Management</h3>
              <div className="space-y-2 md:space-y-3">
                <button className={`w-full p-2 md:p-3 text-left text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white bg-[#1f1f1f] border-white/10 hover:bg-[#2a2a2a]' : 'text-black bg-gray-50 border-gray-400 hover:bg-gray-100'} border rounded-lg transition-colors`}>
                  Download Your Data
                </button>
                <button className={`w-full p-2 md:p-3 text-left text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white bg-[#1f1f1f] border-white/10 hover:bg-[#2a2a2a]' : 'text-black bg-gray-50 border-gray-400 hover:bg-gray-100'} border rounded-lg transition-colors`}>
                  Deactivate Account
                </button>
                <button className={`w-full p-2 md:p-3 text-left text-[10px] md:text-[12px] font-medium ${isDark ? 'text-red-400 bg-[#1f1f1f] border-red-500/20 hover:bg-red-500/10' : 'text-red-600 bg-red-50 border-red-300 hover:bg-red-100'} border rounded-lg transition-colors`}>
                  Delete Account Permanently
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}>
      {/* Navbar */}
      <nav className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-white border-gray-400'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Back to Dashboard"
          >
            <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface2)' }}>
              <img 
                src="/logo.jpg" 
                alt="Renova Logo" 
                className="w-full h-full object-contain" 
                style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.05))'}}
              />
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className={`${isDark ? 'bg-green-500/10 border-green-500' : 'bg-green-50 border-green-300'} w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {initials}
            </div>
            <span className={`text-[12px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{user?.fullName}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-3 md:pt-6">
        <div className="max-w-6xl mx-auto px-3 md:px-6">
          <div className="mb-4 md:mb-8">
            <h1 className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-1 md:mb-2`}>Settings</h1>
            <p className={`text-[11px] md:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage your account preferences and security settings</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-6">
            {/* Left Sidebar */}
            <div className="hidden md:block md:w-64 flex-shrink-0">
              <div className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-gray-50 border-gray-400'} rounded-lg border overflow-hidden sticky top-[100px] text-[11px] md:text-[12px]`}>
                <button
                  onClick={() => { setActiveSection('account-preferences'); setActiveSubMenu('profile-info'); }}
                  className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'account-preferences' ? isDark ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'bg-green-50 text-green-700 border-green-500' : isDark ? 'text-gray-700 hover:bg-[#1f1f1f] border-white/7' : 'text-gray-600 hover:bg-gray-100 border-gray-400'}`}
                >
                  ACCOUNT PREFERENCES
                </button>

                {activeSection === 'account-preferences' && (
                  <div className={isDark ? 'bg-[#0f0f0f] border-white/7' : 'bg-white border-gray-400'}>
                    {[{ id: 'profile-info', label: 'Profile Information' }, { id: 'display', label: 'Display' }, { id: 'general', label: 'General Preferences' }, { id: 'syncing', label: 'Syncing Options' }, { id: 'account-management', label: 'Account Management' }].map((item) => (
                      <button key={item.id} onClick={() => setActiveSubMenu(item.id as AccountSubMenu)} className={`w-full text-left px-3 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[11px] flex items-center justify-between transition-colors ${activeSubMenu === item.id ? isDark ? 'bg-green-500/10 text-green-400 font-medium' : 'bg-green-50 text-green-700 font-medium' : isDark ? 'text-gray-300 hover:bg-[#1f1f1f]' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {item.label}
                        {activeSubMenu === item.id && <ChevronRight size={12} className={isDark ? 'text-green-500' : 'text-green-600'} />}
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={() => setActiveSection('sign-in-security')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'sign-in-security' ? isDark ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'bg-green-50 text-green-700 border-green-500' : isDark ? 'text-gray-700 hover:bg-[#1f1f1f] border-white/7' : 'text-gray-600 hover:bg-gray-100 border-gray-400'}`}>
                  SIGN IN & SECURITY
                </button>

                <button onClick={() => setActiveSection('data-privacy')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors border-b ${activeSection === 'data-privacy' ? isDark ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'bg-green-50 text-green-700 border-green-500' : isDark ? 'text-gray-700 hover:bg-[#1f1f1f] border-white/7' : 'text-gray-600 hover:bg-gray-100 border-gray-400'}`}>
                  DATA PRIVACY
                </button>

                <button onClick={() => setActiveSection('notifications')} className={`w-full text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-[12px] font-mono tracking-widest transition-colors ${activeSection === 'notifications' ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700' : isDark ? 'text-gray-700 hover:bg-[#1f1f1f]' : 'text-gray-600 hover:bg-gray-100'}`}>
                  NOTIFICATIONS
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 w-full">
              {activeSection === 'account-preferences' && (
                <div className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-white border-gray-400'} rounded-lg border p-3 md:p-8`}>
                  {renderAccountPreferencesContent()}
                </div>
              )}

              {activeSection === 'sign-in-security' && (
                <div className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-white border-gray-400'} rounded-lg border p-3 md:p-8`}>
                  <h3 className={`text-sm md:text-lg font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Sign In & Security</h3>
                  <div className="space-y-2 md:space-y-4">
                    <div className={`p-2 md:p-4 ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-50 border-gray-400'} border rounded-lg`}>
                      <h4 className={`text-[10px] md:text-[12px] font-semibold ${isDark ? 'text-white' : 'text-black'} mb-1 md:mb-2`}>Change Password</h4>
                      <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-600'} mb-2 md:mb-3`}>Keep your account secure</p>
                      <button className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-black text-[10px] md:text-[12px] font-semibold rounded-lg transition-colors">Update Password</button>
                    </div>
                    <div className={`p-2 md:p-4 ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-50 border-gray-400'} border rounded-lg`}>
                      <h4 className={`text-[10px] md:text-[12px] font-semibold ${isDark ? 'text-white' : 'text-black'} mb-1 md:mb-2`}>Two-Factor Authentication</h4>
                      <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-600'} mb-2 md:mb-3`}>Add extra layer of security</p>
                      <button className="px-3 md:px-4 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 text-black text-[10px] md:text-[12px] font-semibold rounded-lg transition-colors">Enable 2FA</button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'data-privacy' && (
                <div className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-white border-gray-400'} rounded-lg border p-3 md:p-8`}>
                  <h3 className={`text-sm md:text-lg font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Data Privacy</h3>
                  <div className="space-y-2 md:space-y-4">
                    <label className={`flex items-start gap-2 md:gap-3 p-2 md:p-4 ${isDark ? 'bg-[#0f0f0f] border-white/10 hover:bg-[#1f1f1f]' : 'bg-gray-50 border-gray-400 hover:bg-gray-100'} border rounded-lg cursor-pointer transition-colors`}>
                      <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 md:mt-1 cursor-pointer flex-shrink-0" aria-label="Share usage analytics" />
                      <div>
                        <p className={`text-[10px] md:text-[12px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Share usage analytics</p>
                        <p className={`text-[9px] md:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-600'} mt-0.5 md:mt-1`}>Help us improve</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className={`${isDark ? 'bg-[#171717] border-white/7' : 'bg-white border-gray-400'} rounded-lg border p-3 md:p-8`}>
                  <h3 className={`text-sm md:text-lg font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:mb-4`}>Notifications</h3>
                  <div className="space-y-2 md:space-y-3">
                    <label className={`flex items-center justify-between p-2 md:p-3 ${isDark ? 'bg-[#0f0f0f] border-white/10 hover:bg-[#1f1f1f]' : 'bg-gray-50 border-gray-400 hover:bg-gray-100'} border rounded-lg cursor-pointer transition-colors`}>
                      <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Email notifications</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Email notifications" />
                    </label>
                    <label className={`flex items-center justify-between p-2 md:p-3 ${isDark ? 'bg-[#0f0f0f] border-white/10 hover:bg-[#1f1f1f]' : 'bg-gray-50 border-gray-400 hover:bg-gray-100'} border rounded-lg cursor-pointer transition-colors`}>
                      <span className={`text-[10px] md:text-[12px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>Push notifications</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer flex-shrink-0" aria-label="Push notifications" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





