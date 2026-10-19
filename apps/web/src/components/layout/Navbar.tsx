import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContactMessages } from '../../hooks/useContactMessages';
import { Bell, MessageCircle, Settings, LogOut, Lock, Menu, X, Search, Heart, ArrowLeftRight } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, sidebarOpen = false }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useContactMessages();
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const hasTenantAndLandlordRoles =
    roles.includes('TENANT') && roles.includes('LANDLORD');
  const isLandlordWorkspace = location.pathname.startsWith('/landlord');
  const isTenantWorkspace = location.pathname.startsWith('/tenant');

  const initials = user?.fullName
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase() || 'U';

  const messageCount = user?.role === 'ADMIN' ? unreadCount : 0;

  const getRolePath = (section: 'notifications' | 'messages') => {
    const role = user?.role === 'ADMIN' ? 'admin' : user?.role === 'LANDLORD' ? 'landlord' : 'tenant';
    return `/${role}/${section}`;
  };

  const getRoleText = () => {
    if (isLandlordWorkspace) return 'LANDLORD';
    if (isTenantWorkspace) return 'TENANT';
    if (location.pathname.startsWith('/admin') || user?.role === 'ADMIN') return 'ADMIN';
    return user?.role === 'LANDLORD' ? 'LANDLORD' : 'TENANT';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const listingsPath = isLandlordWorkspace
      ? '/landlord/properties'
      : '/listings';
    navigate(query ? `${listingsPath}?search=${encodeURIComponent(query)}` : listingsPath);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen]);

  return (
    <nav
      className="flex items-center flex-shrink-0 gap-2 px-3 border-b h-14 md:px-4 md:gap-4"
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={onMenuClick}
        className="flex-shrink-0 p-2 transition-colors rounded-lg md:hidden"
        style={{ color: 'var(--text2)' }}
        title={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo and Role - Left */}
      <button 
        onClick={() => {
          if (!user) return; // Don't navigate if user not loaded
          const dashboardPath = location.pathname.startsWith('/landlord')
            ? '/landlord'
            : location.pathname.startsWith('/tenant')
              ? '/tenant'
              : location.pathname.startsWith('/admin') || user.role === 'ADMIN'
                ? '/admin'
                : user.role === 'LANDLORD'
                  ? '/landlord'
                  : '/tenant';
          navigate(dashboardPath);
        }}
        className="flex items-center flex-shrink-0 gap-2 transition-opacity hover:opacity-80"
        title="Go to dashboard"
      >
        <div className="flex items-center justify-center w-6 h-6 overflow-hidden rounded" style={{ backgroundColor: 'var(--surface2)' }}>
          <img 
            src="/logo.jpg" 
            alt="Rentra logo"
            className="object-contain w-full h-full" 
            style={{filter: 'drop-shadow(0 4px 6px rgb(var(--rentra-shadow) / 10%)) drop-shadow(0 0 8px rgb(var(--rentra-shadow) / 5%))'}}
          />
        </div>
        <div
          className="rounded-md bg-surface2 px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wider text-text md:text-[11px]"
        >
          {getRoleText()}
        </div>
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Listing search for every signed-in role */}
      {user && (
        <form 
          onSubmit={handleSearchSubmit}
          role="search"
          className="hidden h-10 w-44 shrink-0 items-center gap-2 rounded-full border px-2 py-1 transition focus-within:ring-2 focus-within:ring-primary/20 md:flex lg:w-64"
          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
        >
          <Search size={16} className="ml-1 shrink-0" style={{ color: 'var(--text3)' }} />
          <input
            type="text"
            aria-label={isLandlordWorkspace ? 'Search your properties' : 'Search homes'}
            placeholder={isLandlordWorkspace ? 'Search your properties...' : 'Search homes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-text-subtle"
            style={{ color: 'var(--text)' }}
          />
          <button
            type="submit"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-primary px-3 text-[11px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover"
          >
            <Search size={13} />
            Search
          </button>
        </form>
      )}

      {/* Action Items - Right Side */}
      <div className="flex items-center gap-1 md:gap-2">
        {user && (
          <button
            type="button"
            onClick={() => navigate(isLandlordWorkspace ? '/landlord/properties' : '/listings')}
            className="rounded-lg p-2 transition-colors hover:bg-[var(--surface2)] md:hidden"
            style={{ color: 'var(--text2)' }}
            aria-label={isLandlordWorkspace ? 'Search your properties' : 'Search listings'}
            title={isLandlordWorkspace ? 'Search your properties' : 'Search listings'}
          >
            <Search size={18} />
          </button>
        )}

        {/* Notifications - Icon with Tooltip */}
        <div className="relative group">
          <button 
            onClick={() => navigate(getRolePath('notifications'))}
            className="relative p-2 transition-colors rounded-lg"
            style={{ color: 'var(--text2)' }}
            title="Notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
          </button>
          {/* Tooltip Below */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40"
            style={{ 
              backgroundColor: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)'
            }}
          >
            Notifications
          </div>
        </div>

        {/* Messages - Icon with Tooltip */}
        <div className="relative group">
          <button 
            onClick={() => navigate(getRolePath('messages'))}
            className="relative p-2 transition-colors rounded-lg"
            style={{ color: 'var(--text2)' }}
            title="Messages"
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            {messageCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" 
                style={{ backgroundColor: 'var(--red)', color: 'rgb(var(--rentra-danger-contrast))' }}>
                {messageCount}
              </span>
            )}
          </button>
          {/* Tooltip Below */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40"
            style={{ 
              backgroundColor: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)'
            }}
          >
            {user?.role === 'ADMIN' ? `${messageCount} Contact Messages` : 'Messages'}
          </div>
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden w-px h-5 md:block" style={{ backgroundColor: 'var(--border)' }}></div>

        {/* Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            ref={profileButtonRef}
            onClick={() => setProfileOpen(!profileOpen)}
            className="relative flex-shrink-0 p-1 transition-colors rounded-lg"
            style={{ color: 'var(--text)' }}
            title={user?.fullName}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{ 
                backgroundColor: 'var(--green)',
                color: 'var(--bg)'
              }}
            >
              {initials}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div 
              ref={profileMenuRef}
              className="absolute right-0 z-50 w-48 py-1 rounded-lg shadow-lg top-12 md:w-56"
              style={{ 
                backgroundColor: 'var(--surface2)',
                borderColor: 'var(--border)',
                border: '1px solid'
              }}
            >
              {/* User Info */}
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>
                  {user?.fullName}
                </div>
                <div className="text-[9px]" style={{ color: 'var(--text2)' }}>
                  {user?.email}
                </div>
              </div>

              <button
                onClick={() => {
                  navigate('/listings');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                style={{ color: 'var(--text2)' }}
              >
                <Search size={14} />
                Browse listings
              </button>

              <button
                onClick={() => {
                  navigate('/favorites');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                style={{ color: 'var(--text2)' }}
              >
                <Heart size={14} />
                Saved homes
              </button>

              {hasTenantAndLandlordRoles && (
                <>
                  <div className="border-t" style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={() => {
                      navigate('/tenant');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                    style={{ color: 'var(--text2)' }}
                  >
                    <ArrowLeftRight size={14} />
                    Tenant workspace
                  </button>
                  <button
                    onClick={() => {
                      navigate('/landlord');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                    style={{ color: 'var(--text2)' }}
                  >
                    <ArrowLeftRight size={14} />
                    Landlord workspace
                  </button>
                </>
              )}

              <div className="border-t" style={{ borderColor: 'var(--border)', margin: '4px 0' }} />

              {/* Settings Option */}
              <button 
                onClick={() => {
                  navigate('/settings');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                style={{ color: 'var(--text2)' }}
              >
                <Settings size={14} />
                Settings
              </button>

              {/* Privacy Option */}
              <button 
                onClick={() => {
                  navigate('/settings?section=data-privacy');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50"
                style={{ color: 'var(--text2)' }}
              >
                <Lock size={14} />
                Privacy
              </button>

              {/* Logout Option */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-opacity-50 border-t"
                style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
