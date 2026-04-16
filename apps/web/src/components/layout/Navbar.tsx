import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const initials = user?.fullName
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <nav
      className={`${
        isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-gray-200'
      } h-[52px] border-b flex items-center px-6 gap-3 flex-shrink-0`}
    >
      {/* Left spacer */}
      <div className="flex-1" />

      {/* Notification button */}
      <button
        className={`w-8 h-8 rounded-lg ${
          isDark ? 'bg-[#1f1f1f] border-white/10 hover:bg-[#2a2a2a]' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
        } border flex items-center justify-center transition-colors`}
        title="Notifications"
      >
        <Bell size={14} className={isDark ? 'text-[#555]' : 'text-gray-500'} />
      </button>

      {/* Trust Score */}
      <div className={`text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
        Trust: <span className="text-green-600 font-bold">{user?.trustScore}</span>
      </div>

      {/* Profile Button - Triggers dropdown in sidebar */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`w-8 h-8 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center text-[11px] text-green-400 font-bold transition-all ${
            isProfileOpen ? 'ring-2 ring-green-500/30' : ''
          }`}
          title={user?.fullName}
        >
          {initials}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
