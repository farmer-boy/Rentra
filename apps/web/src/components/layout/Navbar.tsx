import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useContactMessages } from '../../hooks/useContactMessages';
import { Bell, MessageCircle, Settings, LogOut, Lock, Menu, X, Search } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, sidebarOpen = false }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useContactMessages();

  const initials = user?.fullName
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase() || 'U';

  const notificationCount = 2;
  const messageCount = user?.role === 'ADMIN' ? unreadCount : 3;

  const getRoleText = () => {
    return user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'LANDLORD' ? 'LANDLORD' : 'TENANT';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tenant/listings?search=${encodeURIComponent(searchQuery)}`);
    }
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
      className="h-14 border-b flex items-center px-3 md:px-4 gap-2 md:gap-4 flex-shrink-0"
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--text2)' }}
        title="Menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo and Role - Left */}
      <button 
        onClick={() => {
          if (!user) return; // Don't navigate if user not loaded
          
          const dashboardPath = 
            user.role === 'ADMIN' ? '/admin' :
            user.role === 'LANDLORD' ? '/landlord' :
            '/tenant';
          navigate(dashboardPath);
        }}
        className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        title="Go to dashboard"
      >
        <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface2)' }}>
          <img 
            src="/logo.jpg" 
            alt="Renova Logo" 
            className="w-full h-full object-contain" 
            style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.05))'}}
          />
        </div>
        <div className="text-[7px] md:text-[8px] font-mono uppercase tracking-wider" style={{ color: 'var(--text2)' }}>
          {getRoleText()}
        </div>
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Search Bar - Tenant Only */}
      {user?.role === 'TENANT' && (
        <form 
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'var(--surface2)' }}
        >
          <Search size={14} style={{ color: 'var(--text2)' }} />
          <input
            type="text"
            placeholder="Area, flat type, hostel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-[12px] w-32"
            style={{ color: 'var(--text)' }}
          />
        </form>
      )}

      {/* Action Items - Right Side */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notifications - Icon with Tooltip */}
        <div className="relative group">
          <button 
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text2)' }}
            title="Notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--green)' }}></span>
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
            Notifications
          </div>
        </div>

        {/* Messages - Icon with Tooltip */}
        <div className="relative group">
          <button 
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text2)' }}
            title="Messages"
            onClick={() => {
              if (user?.role === 'ADMIN') {
                navigate('/admin/messages');
              }
            }}
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            {messageCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" 
                style={{ backgroundColor: 'var(--red)', color: 'white' }}>
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
        <div className="hidden md:block w-px h-5" style={{ backgroundColor: 'var(--border)' }}></div>

        {/* Profile Avatar with Dropdown */}
        <div className="relative">
          <button
            ref={profileButtonRef}
            onClick={() => setProfileOpen(!profileOpen)}
            className="relative p-1 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'var(--text)' }}
            title={user?.fullName}
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
              className="absolute top-12 right-0 w-48 md:w-56 rounded-lg shadow-lg py-1 z-50"
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
                  navigate('/privacy');
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
