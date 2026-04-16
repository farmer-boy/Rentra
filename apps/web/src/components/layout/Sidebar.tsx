import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  navSections: NavSection[];
  role: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navSections, role, isOpen, setIsOpen }) => {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const initials = user?.fullName
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      <div
        ref={sidebarRef}
        className={`${
          isOpen ? 'w-[240px]' : 'w-[56px]'
        } ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'border-gray-200 bg-white'} border-r flex flex-col flex-shrink-0 h-screen overflow-y-auto transition-all duration-300 fixed left-0 top-0 z-40`}
      >
        {/* Header */}
        <div
          className={`${
            isOpen ? 'px-3 py-4' : 'px-2 py-4'
          } ${isDark ? 'border-white/5' : 'border-gray-200'} border-b flex items-center justify-center transition-all duration-300`}
        >
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
                onClick={() => setIsOpen(false)}
              >
                <img src="/rentra_logo.png" alt="Rentra Logo" className="h-6 w-auto" />
                <div
                  className={`${
                    isDark ? 'text-[#555]' : 'text-gray-500'
                  } text-[9px] font-mono uppercase tracking-widest mt-0.5`}
                >
                  {role === 'ADMIN' ? 'ADMIN' : role === 'LANDLORD' ? 'LANDLORD' : 'TENANT'}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`${
                  isDark ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-100'
                } p-1 rounded transition-colors text-sm font-bold`}
                title="collapse"
              >
                &lt;&lt;
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className={`absolute inset-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                onClick={() =>
                  navigate(role === 'ADMIN' ? '/admin' : role === 'LANDLORD' ? '/landlord' : '/tenant')
                }
                title="Rentra"
              >
                <img src="/rentra_logo.png" alt="Rentra Logo" className="h-5 w-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className={`${isDark ? 'text-[#ddd]' : 'text-gray-700'} flex-1 overflow-y-auto`}>
          {navSections.map((section, idx) => (
            <div key={idx} className={isOpen ? 'px-3 py-4' : 'px-2 py-4'}>
              {isOpen && (
                <div
                  className={`${
                    isDark ? 'text-[#555]' : 'text-gray-500'
                  } text-[10px] font-mono uppercase tracking-widest mb-2 px-1`}
                >
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path !== '/'}
                    title={isOpen ? '' : item.label}
                    className={({ isActive }) =>
                      `${
                        isActive
                          ? isDark
                            ? 'bg-[#1f1f1f] text-green-400'
                            : 'bg-blue-50 text-blue-700'
                          : isDark
                            ? 'hover:bg-[#1f1f1f]'
                            : 'hover:bg-gray-50'
                      } flex items-center gap-2 px-2 py-2 rounded-lg transition-all`
                    }
                  >
                    <span className="text-[16px] flex-shrink-0">{item.icon}</span>
                    {isOpen && (
                      <>
                        <span className="text-[12px] font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Account Button in Footer */}
        <div
          className={`${isDark ? 'border-white/5' : 'border-gray-200'} p-2 border-t`}
        >
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className={`${
                isDark ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-100'
              } w-full p-2.5 rounded-lg transition-colors flex items-center justify-center text-sm font-bold mb-2`}
              title="Expand sidebar"
            >
              &gt;&gt;
            </button>
          )}
          <button
            ref={profileButtonRef}
            onClick={() => setProfileOpen(!profileOpen)}
            className={`${
              isDark ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-100'
            } w-full p-2.5 rounded-lg transition-colors flex items-center gap-2.5`}
          >
            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center text-[11px] text-green-400 font-bold flex-shrink-0">
              {initials}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={`${
                    isDark ? 'text-[#ddd]' : 'text-gray-700'
                  } text-[12px] font-semibold truncate`}
                >
                  {user?.fullName}
                </div>
                <div
                  className={`${
                    isDark ? 'text-[#aaa]' : 'text-gray-500'
                  } text-[10px] truncate`}
                >
                  {user?.email}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Portal-based profile dropdown */}
      <ProfileDropdown 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        triggerRef={profileButtonRef}
        sidebarWidth={240}
      />

      {/* Content Offset */}
      <div className={isOpen ? 'ml-[240px]' : 'ml-[56px]'} />
    </>
  );
};

export default Sidebar;
