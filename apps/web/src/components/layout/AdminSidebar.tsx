import { Link, useLocation } from 'react-router-dom';
import { useContactMessages } from '../../hooks/useContactMessages';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Scale,
  Bell,
  Star,
  BarChart3,
  Settings,
  Mail,
  User,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings2,
  LifeBuoy,
} from 'lucide-react';

interface SidebarItemBase {
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

type SidebarItem = SidebarItemBase & (
  | { path: string; children?: never }
  | { path?: never; children: SidebarItem[] }
);

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
  const [isExpanded, setIsExpanded] = useState(isDesktopView || isMobileOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [expandOnHover, setExpandOnHover] = useState(false);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
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
    {
      label: 'Listings & Properties',
      icon: <FileText size={20} />,
      children: [
        { label: 'Listings', path: '/admin/listings', icon: <FileText size={18} /> },
        { label: 'Properties', path: '/admin/properties', icon: <FileText size={18} /> },
        { label: 'Hosts', path: '/admin/hosts', icon: <Users size={18} /> },
        { label: 'Hotels', path: '/admin/hotels', icon: <FileText size={18} /> },
        { label: 'Hostels', path: '/admin/hostels', icon: <FileText size={18} /> },
      ],
    },
    {
      label: 'Users',
      icon: <Users size={20} />,
      children: [
        { label: 'All Users', path: '/admin/users', icon: <Users size={18} /> },
        {
          label: 'By Role',
          icon: <Users size={18} />,
          children: [
            { label: 'Tenants', path: '/admin/users/tenants', icon: <User size={16} /> },
            { label: 'Landlords', path: '/admin/users/landlords', icon: <User size={16} /> },
          ],
        },
        {
          label: 'Account Status',
          icon: <Settings2 size={18} />,
          children: [
            { label: 'Verified', path: '/admin/users/verified', icon: <Settings2 size={16} /> },
            { label: 'Banned', path: '/admin/users/banned', icon: <Settings2 size={16} /> },
          ],
        },
      ],
    },
    {
      label: 'Operations',
      icon: <Settings2 size={20} />,
      children: [
        { label: 'Reported Items', path: '/admin/reported', icon: <FileText size={18} /> },
        { label: 'User Verification', path: '/admin/user-verification', icon: <Users size={18} /> },
        { label: 'Property Verification', path: '/admin/property-verification', icon: <FileText size={18} /> },
        { label: 'Bookings', path: '/admin/bookings', icon: <FileText size={18} /> },
        { label: 'Rental Requests', path: '/admin/rental-requests', icon: <FileText size={18} /> },
        { label: 'Agreements', path: '/admin/agreements', icon: <FileText size={18} /> },
        { label: 'Payments', path: '/admin/payments', icon: <FileText size={18} /> },
        { label: 'Reports', path: '/admin/reports', icon: <FileText size={18} /> },
      ],
    },
    {
      label: 'Disputes',
      icon: <Scale size={20} />,
      children: [
        { label: 'All Disputes', path: '/admin/disputes', icon: <Scale size={18} /> },
        { label: 'Open', path: '/admin/disputes/open', icon: <Scale size={18} /> },
        { label: 'Resolved', path: '/admin/disputes/resolved', icon: <Scale size={18} /> },
      ],
    },
    {
      label: 'Communication',
      icon: <Mail size={20} />,
      children: [
        { label: 'Messages', path: '/admin/messages', icon: <Mail size={18} />, badge: unreadCount || undefined },
        { label: 'Support Tickets', path: '/admin/support', icon: <LifeBuoy size={18} /> },
        { label: 'Reviews', path: '/admin/reviews', icon: <Star size={18} /> },
        { label: 'Notifications', path: '/admin/notifications', icon: <Bell size={18} /> },
      ],
    },
    {
      label: 'Platform',
      icon: <BarChart3 size={20} />,
      children: [
        { label: 'Audit Log', path: '/admin/audit', icon: <FileText size={18} /> },
        { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
      ],
    },
    {
      label: 'Account',
      icon: <User size={20} />,
      children: [
        { label: 'Profile', path: '/admin/profile', icon: <User size={18} /> },
        { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
      ],
    },
  ];

  useEffect(() => {
    const nextOpen: Record<string, boolean> = {};
    const openAncestors = (items: SidebarItem[], ancestors: string[] = []) => {
      items.forEach((item) => {
        const nextAncestors = item.children?.length ? [...ancestors, item.label] : ancestors;
        if (item.path && isActive(item.path)) ancestors.forEach((ancestor) => { nextOpen[ancestor] = true; });
        if (item.children) openAncestors(item.children, nextAncestors);
      });
    };
    openAncestors(sections);
    setOpenItems(nextOpen);
  }, [location.pathname]);

  const renderItems = (items: SidebarItem[], depth = 0, visible = true): React.ReactNode => items.map((item) => {
    const key = item.path || item.label;
    const hasChildren = Boolean(item.children?.length);
    const expanded = Boolean(openItems[key]);
    const active = item.path ? isActive(item.path) : false;
    const childActive = Boolean(item.children?.some((child) => (
      (child.path ? isActive(child.path) : false) ||
      (child.children ? child.children.some((nested) => nested.path ? isActive(nested.path) : false) : false)
    )));
    const highlighted = active || childActive;
    const paddingLeft = isExpanded && depth > 0 ? `${8 + depth * 14}px` : undefined;

    return (
      <div key={key} className={`relative group w-full ${isExpanded ? '' : 'flex justify-center'}`}>
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={expanded}
            tabIndex={visible ? undefined : -1}
            onClick={() => {
              if (!isExpanded) setIsExpanded(true);
              setOpenItems((current) => {
                const next = { ...current };
                items.forEach((sibling) => {
                  if (sibling.children?.length) next[sibling.path || sibling.label] = false;
                });
                next[key] = !current[key];
                return next;
              });
            }}
            className={`flex items-center rounded-lg transition-all duration-200 ${
              isExpanded ? 'w-full gap-2 px-2 py-2' : 'h-8 w-8 justify-center'
            }`}
            style={{
              paddingLeft,
              color: highlighted ? 'var(--green)' : 'var(--text2)',
              backgroundColor: highlighted ? 'var(--surface2)' : 'transparent',
            }}
          >
            <span className="relative flex flex-shrink-0 items-center justify-center">{item.icon}</span>
            {isExpanded && (
              <>
                <span className="flex-1 truncate text-left text-sm font-medium">{item.label}</span>
                {item.badge ? <span className="rounded-full bg-red-500 px-1 text-[9px] text-danger-contrast">{item.badge}</span> : null}
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </>
            )}
          </button>
        ) : item.path ? (
          <Link
            to={item.path}
            onClick={() => handleNavigationClick()}
            tabIndex={visible ? undefined : -1}
            className={`flex items-center rounded-lg transition-all duration-200 ${
              isExpanded ? 'w-full gap-2 px-2 py-2' : 'h-8 w-8 justify-center'
            }`}
            style={{
              paddingLeft,
              color: active ? 'var(--green)' : 'var(--text2)',
              backgroundColor: active ? 'var(--surface2)' : 'transparent',
            }}
            title={isExpanded ? undefined : item.label}
          >
            <span className="relative flex flex-shrink-0 items-center justify-center">
              {item.icon}
              {item.badge ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-0.5 text-[9px] leading-none text-danger-contrast">{item.badge}</span> : null}
            </span>
            {isExpanded && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
          </Link>
        ) : null}
        {!isExpanded && (
          <div
            className="pointer-events-none invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border px-2 py-1 text-[11px] font-medium group-hover:visible"
            style={{ backgroundColor: 'var(--surface2)', color: 'var(--text)', borderColor: 'var(--border)' }}
          >
            {item.label}
          </div>
        )}
        {hasChildren && isExpanded && (
          <div
            aria-hidden={!expanded}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
              expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-1 space-y-1 border-l py-1" style={{ borderColor: 'var(--border)' }}>
                {renderItems(item.children || [], depth + 1, visible && expanded)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

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
      <div className={`flex-1 overflow-y-auto ${isExpanded ? 'px-2 py-3' : 'px-0 py-2'}`}>
        <div className={`w-full ${isExpanded ? 'space-y-1' : 'space-y-3'}`}>
          {renderItems(sections)}
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
