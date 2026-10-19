import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/useTheme';
import { User, Settings, LogOut, HelpCircle, Home, Moon, Sun, ArrowLeftRight } from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  sidebarWidth: number; // Width of sidebar to match dropdown
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, triggerRef, sidebarWidth }) => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; bottom?: number }>({ top: 0, left: 0 });

  // Calculate position based on trigger button and sidebar width
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    const timer = requestAnimationFrame(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        // Position dropdown above the account button
        // Calculate from bottom of viewport: button position + button height
        const bottomPosition = window.innerHeight - rect.top;
        
        setPosition({
          top: 0,
          left: 0,
          bottom: bottomPosition + 8, // 8px gap above button
        });
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [isOpen, triggerRef, sidebarWidth]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Switch account failed:', error);
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const getProfilePath = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'landlord') return '/landlord/profile';
    if (role === 'admin') return '/admin/profile';
    return '/tenant/profile';
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        ref={dropdownRef}
        className="fixed z-[9999] rounded-lg border border-border bg-surface py-1 shadow-lg"
        style={{
          top: position.top ? `${position.top}px` : 'auto',
          bottom: position.bottom ? `${position.bottom}px` : 'auto',
          left: `${position.left + 8}px`,
          width: `calc(${sidebarWidth}px - 16px)`,
          maxHeight: '70vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-in-out',
          visibility: 'visible' as const,
          opacity: 1,
          pointerEvents: 'auto' as const,
        }}
      >
      {/* User Info Section */}
      <div className="border-b border-border px-4 py-3">
        <div className="text-[12px] font-semibold text-text">
          {user?.fullName}
        </div>
        <div className="text-[11px] text-text-muted">
          {user?.email}
        </div>
      </div>

      {/* My Profile */}
      <button
        onClick={() => handleNavigate(getProfilePath())}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] font-medium text-text transition-colors hover:bg-surface2"
      >
        <User size={14} className="flex-shrink-0" />
        My Profile
      </button>

      {/* Settings & Privacy */}
      <button
        onClick={() => handleNavigate('/settings?section=data-privacy')}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] text-text transition-colors hover:bg-surface2"
      >
        <Settings size={14} className="flex-shrink-0" />
        Privacy settings
      </button>

      {/* Help */}
      <button
        onClick={() => handleNavigate('/help')}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] text-text transition-colors hover:bg-surface2"
      >
        <HelpCircle size={14} className="flex-shrink-0" />
        Help
      </button>

      {/* Divider */}
      <div className="border-t border-border" style={{ margin: '4px 0' }} />

      {/* Theme Toggle */}
      <button
        onClick={() => {
          toggleTheme();
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] text-text transition-colors hover:bg-surface2"
      >
        {isDark ? (
          <>
            <Sun size={14} className="flex-shrink-0" />
            Light Mode
          </>
        ) : (
          <>
            <Moon size={14} className="flex-shrink-0" />
            Dark Mode
          </>
        )}
      </button>

      {/* Explore */}
      <button
        onClick={() => handleNavigate('/')}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] text-text transition-colors hover:bg-surface2"
      >
        <Home size={14} className="flex-shrink-0" />
        Explore Rentra
      </button>

      {/* Switch Account */}
      <button
        onClick={handleSwitchAccount}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] text-text transition-colors hover:bg-surface2"
      >
        <ArrowLeftRight size={14} className="flex-shrink-0" />
        Switch Account
      </button>

      {/* Divider */}
      <div className="border-t border-border" style={{ margin: '4px 0' }} />

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12px] font-medium text-text transition-colors hover:bg-surface2"
      >
        <LogOut size={14} className="flex-shrink-0" />
        Sign Out
      </button>
    </div>
    </>,
    document.body
  );
};

export default ProfileDropdown;
