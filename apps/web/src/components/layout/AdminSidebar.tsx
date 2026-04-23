import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { useContactMessages } from '../../hooks/useContactMessages';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Users,
  Scale,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Mail,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminSidebarProps {
  onNavigate?: () => void;
  isMobileOpen?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavigate, isMobileOpen = false }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapseTimer, setCollapseTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { unreadCount } = useContactMessages();

  // On mobile only: keep expanded while overlay is open
  useEffect(() => {
    if (isMobileOpen) {
      setIsExpanded(true);
    } else {
      // When mobile sidebar closes, reset to collapsed
      setIsExpanded(false);
    }
  }, [isMobileOpen]);

  const initials = user?.fullName
    ?.split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase() || 'AU';

  const isActive = (path: string) => location.pathname === path;

  // Simple hover expand
  const handleEnter = () => {
    // Only expand on mobile when overlay is open
    if (!isMobileOpen) return;
    
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      setCollapseTimer(null);
    }
    setIsExpanded(true);
  };

  // Simple hover collapse - block only on mobile overlay
  const handleLeave = () => {
    // Only allow collapse on mobile (when overlay is open)
    if (!isMobileOpen) return;

    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 200);
    setCollapseTimer(timer);
  };

  const sections: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'All Listings', path: '/admin/listings', icon: <FileText size={18} /> },
    { label: 'Fake Detector', path: '/admin/detector-queue', icon: <Bot size={18} />, badge: 47 },
    { label: 'All Users', path: '/admin/users', icon: <Users size={18} /> },
    { label: 'All Disputes', path: '/admin/disputes', icon: <Scale size={18} />, badge: 12 },
    { label: 'Messages', path: '/admin/messages', icon: <Mail size={18} />, badge: unreadCount || undefined },
    { label: 'Payments', path: '/admin/payments', icon: <DollarSign size={18} /> },
    { label: 'Revenue', path: '/admin/revenue', icon: <TrendingUp size={18} /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div
      className={`w-full h-full flex flex-col border-r overflow-y-auto transition-all duration-300`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 py-3 space-y-1">
          {sections.map((item) => {
            const active = isActive(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => onNavigate?.()}
                onPointerEnter={handleEnter}
                onMouseEnter={handleEnter}
                className="relative flex items-center justify-center gap-3 h-12 px-2 rounded-lg transition-colors group"
                style={{
                  color: active ? 'var(--green)' : 'var(--text2)',
                  backgroundColor: active ? 'var(--surface2)' : 'transparent'
                }}
                title={item.label}
              >
                {/* Icon - Fixed Container */}
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                  {item.icon}
                </div>

                {/* Label - Visible only when expanded on mobile */}
                {isExpanded && isMobileOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0 ml-2">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip on hover for desktop */}
                <div className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{
                    backgroundColor: 'var(--surface2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}>
                  {item.label}
                </div>

                {/* Badge - Visible only when collapsed */}
                {!isExpanded && item.badge && (
                  <span className="absolute top-0 right-0 text-[7px] bg-red-500 text-white px-1 rounded-full font-bold leading-none">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* User Avatar - Bottom */}
      <div className="px-2 py-3 border-t flex justify-center" style={{ borderColor: 'var(--border)' }}>
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors flex-shrink-0 hover:scale-110"
          style={{
            backgroundColor: 'var(--green)',
            color: 'var(--bg)'
          }}
          title={user?.fullName}
        >
          {initials}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
