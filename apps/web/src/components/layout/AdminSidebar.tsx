import { useLocation } from 'react-router-dom';
import { useContactMessages } from '../../hooks/useContactMessages';
import { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Settings2,
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
  isDesktopView?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  onNavigate, 
  isMobileOpen = false,
  isDesktopView = false
}) => {
  const location = useLocation();
  const { unreadCount } = useContactMessages();
  const [isExpanded, setIsExpanded] = useState(isDesktopView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [expandOnHover, setExpandOnHover] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Handle hover expand/collapse
  const handleSidebarMouseEnter = () => {
    if (expandOnHover && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    // In expand on hover mode, don't collapse on mouse leave
    // User must manually change via dropdown menu
    if (expandOnHover) {
      return;
    }
  };

  // Handle navigation click in expand on hover mode
  const handleNavigationClick = () => {
    // In expand on hover mode, reset to collapsed when clicking nav item
    if (expandOnHover) {
      setIsExpanded(false);
    }
    onNavigate?.();
  };

  // Update button position when menu opens or sidebar expands/collapses
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let leftPos = rect.left + rect.width / 2 - 100;
      
      // Ensure dropdown stays within viewport
      if (leftPos < 10) {
        leftPos = 10;
      }
      if (leftPos + 200 > window.innerWidth - 10) {
        leftPos = window.innerWidth - 210;
      }
      
      setButtonPosition({
        top: rect.top,
        left: leftPos
      });
    }
  }, [menuOpen, isExpanded]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const sections: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'All Listings', path: '/admin/listings', icon: <FileText size={20} /> },
    { label: 'Fake Detector', path: '/admin/detector-queue', icon: <Bot size={20} />, badge: 47 },
    { label: 'All Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'All Disputes', path: '/admin/disputes', icon: <Scale size={20} />, badge: 12 },
    { label: 'Messages', path: '/admin/messages', icon: <Mail size={20} />, badge: unreadCount || undefined },
    { label: 'Payments', path: '/admin/payments', icon: <DollarSign size={20} /> },
    { label: 'Revenue', path: '/admin/revenue', icon: <TrendingUp size={20} /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      className={`h-full flex flex-col border-r relative transition-all duration-300`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        width: isExpanded ? '224px' : '44px'
      }}
    >
      {/* Navigation Items */}
      <div className={`flex-1 overflow-y-auto flex flex-col items-center ${isExpanded ? 'py-3 px-2 items-start' : 'py-2 px-0'}`}>
        <div className={`w-full ${isExpanded ? 'space-y-1' : 'space-y-3'}`}>
          {sections.map((item) => {
            const active = isActive(item.path);
            return (
              <div key={item.path} className={`relative group w-full ${isExpanded ? '' : 'flex justify-center'}`}>
                <a
                  href={item.path}
                  onClick={() => handleNavigationClick()}
                  className={`flex items-center rounded-lg transition-all ${isExpanded ? 'px-2 py-2 gap-2 w-full' : 'justify-center h-8 w-8'}`}
                  style={{
                    color: active ? 'var(--green)' : 'var(--text2)',
                    backgroundColor: active ? 'var(--surface2)' : 'transparent'
                  }}
                  title={isExpanded ? '' : item.label}
                >
                  <span className="flex-shrink-0 flex items-center justify-center relative">
                    {item.icon}
                    {/* Badge - Small dot in corner */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-red-500 text-white px-0.5 rounded-full font-bold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </span>

                  {/* Label - Visible only when expanded */}
                  {isExpanded && (
                    <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                  )}
                </a>

                {/* Tooltip on hover - appears instantly when not expanded */}
                {!isExpanded && (
                  <div 
                    className="absolute left-full ml-2 px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap invisible group-hover:visible pointer-events-none z-50"
                    style={{
                      backgroundColor: 'var(--surface2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Control Button - Bottom */}
      <div className={`border-t px-1 py-2 flex justify-center`} style={{ borderColor: 'var(--border)' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`rounded-lg flex items-center justify-center transition-all hover:opacity-80`}
          style={{
            color: 'var(--text2)',
            backgroundColor: menuOpen ? 'var(--surface2)' : 'transparent',
            width: '32px',
            height: '32px'
          }}
          title="Sidebar Control"
        >
          <Settings2 size={18} />
        </button>

        {/* Dropdown Menu - Fixed Position Outside Sidebar */}
        {menuOpen && (
          <div
            className="fixed rounded-lg shadow-lg border overflow-hidden z-50"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              minWidth: '200px',
              bottom: `${window.innerHeight - buttonPosition.top + 8}px`,
              left: `${buttonPosition.left}px`,
              position: 'fixed',
              pointerEvents: 'auto'
            }}
          >
            {/* Menu Header */}
            <div
              className="px-3 py-2 border-b text-[11px] font-semibold uppercase tracking-wider"
              style={{
                color: 'var(--text3)',
                borderColor: 'var(--border)',
              }}
            >
              Sidebar Control
            </div>

            {/* Menu Items */}
            <div className="flex flex-col">
              {/* Collapsed Option */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setMenuOpen(false);
                }}
                className={`px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2 border-b`}
                style={{
                  color: !isExpanded ? 'var(--green)' : 'var(--text2)',
                  backgroundColor: !isExpanded ? 'var(--surface2)' : 'transparent',
                  borderColor: 'var(--border)'
                }}
              >
                <ChevronLeft size={16} />
                <span>Collapsed</span>
              </button>

              {/* Expanded Option */}
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setMenuOpen(false);
                }}
                className={`px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2 border-b`}
                style={{
                  color: isExpanded ? 'var(--green)' : 'var(--text2)',
                  backgroundColor: isExpanded ? 'var(--surface2)' : 'transparent',
                  borderColor: 'var(--border)'
                }}
              >
                <ChevronRight size={16} />
                <span>Expanded</span>
              </button>

              {/* Expand on Hover Option */}
              <button
                onClick={() => {
                  setExpandOnHover(!expandOnHover);
                  setIsExpanded(false);
                  setMenuOpen(false);
                }}
                className={`px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2`}
                style={{
                  color: expandOnHover ? 'var(--green)' : 'var(--text2)',
                  backgroundColor: expandOnHover ? 'var(--surface2)' : 'transparent'
                }}
              >
                <ChevronRight size={16} />
                <span>Expand on Hover</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
