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
  User,
  UserRound,
  ClipboardCheck,
  ShieldCheck,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSignature,
  CreditCard,
  Flag,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  ScrollText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings2,
  LifeBuoy,
} from 'lucide-react';

interface SidebarItemBase {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface SidebarMenuGroup {
  label: string;
  icon: React.ReactNode;
  children: SidebarItemBase[];
}

type SidebarItem = SidebarItemBase | SidebarMenuGroup;

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
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
      label: 'Properties',
      icon: <FileText size={20} />,
      children: [
        { label: 'Listings', path: '/admin/listings', icon: <FileText size={18} /> },
        { label: 'All properties', path: '/admin/properties', icon: <FileText size={18} /> },
        { label: 'Apartments', path: '/admin/apartments', icon: <FileText size={18} /> },
        { label: 'Flats', path: '/admin/flats', icon: <FileText size={18} /> },
        { label: 'Houses', path: '/admin/houses', icon: <FileText size={18} /> },
        { label: 'Portions', path: '/admin/portions', icon: <FileText size={18} /> },
        { label: 'Rooms', path: '/admin/rooms', icon: <FileText size={18} /> },
        { label: 'Studios', path: '/admin/studios', icon: <FileText size={18} /> },
        { label: 'Farmhouses', path: '/admin/farmhouses', icon: <FileText size={18} /> },
        { label: 'PG', path: '/admin/pg', icon: <FileText size={18} /> },
        { label: 'Shared rooms', path: '/admin/shared-rooms', icon: <FileText size={18} /> },
        { label: 'Other properties', path: '/admin/other-properties', icon: <FileText size={18} /> },
        { label: 'Hotels', path: '/admin/hotels', icon: <FileText size={18} /> },
        { label: 'Hostels', path: '/admin/hostels', icon: <FileText size={18} /> },
        { label: 'Guest houses', path: '/admin/guest-houses', icon: <FileText size={18} /> },
      ],
    },
    { label: 'Hosts', path: '/admin/hosts', icon: <UserRound size={18} /> },
    {
      label: 'Users',
      icon: <Users size={20} />,
      children: [
        { label: 'All users', path: '/admin/users', icon: <Users size={18} /> },
        { label: 'Tenants', path: '/admin/users/tenants', icon: <User size={18} /> },
        { label: 'Landlords', path: '/admin/users/landlords', icon: <User size={18} /> },
        { label: 'Verified users', path: '/admin/users/verified', icon: <Settings2 size={18} /> },
        { label: 'Banned users', path: '/admin/users/banned', icon: <Settings2 size={18} /> },
      ],
    },
    { label: 'All submissions', path: '/admin/approvals', icon: <ClipboardCheck size={18} /> },
    { label: 'User verification', path: '/admin/user-verification', icon: <ShieldCheck size={18} /> },
    { label: 'Property verification', path: '/admin/property-verification', icon: <Building2 size={18} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <CalendarDays size={18} /> },
    { label: 'Rental requests', path: '/admin/rental-requests', icon: <ClipboardList size={18} /> },
    { label: 'Agreements', path: '/admin/agreements', icon: <FileSignature size={18} /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { label: 'Reported items', path: '/admin/reported', icon: <Flag size={18} /> },
    { label: 'Reports', path: '/admin/reports', icon: <AlertCircle size={18} /> },
    { label: 'All disputes', path: '/admin/disputes', icon: <Scale size={18} /> },
    { label: 'Open disputes', path: '/admin/disputes/open', icon: <AlertCircle size={18} /> },
    { label: 'Resolved disputes', path: '/admin/disputes/resolved', icon: <CheckCircle2 size={18} /> },
    { label: 'Messages', path: '/admin/messages', icon: <MessageCircle size={18} />, badge: unreadCount || undefined },
    { label: 'Support tickets', path: '/admin/support', icon: <LifeBuoy size={18} /> },
    { label: 'Notifications', path: '/admin/notifications', icon: <Bell size={18} /> },
    { label: 'Reviews', path: '/admin/reviews', icon: <Star size={18} /> },
    { label: 'Audit log', path: '/admin/audit', icon: <ScrollText size={18} /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { label: 'Profile', path: '/admin/profile', icon: <User size={18} /> },
  ];

  useEffect(() => {
    sections.forEach((item) => {
      if ('children' in item && item.children.some((child) => isActive(child.path))) {
        setOpenGroups((current) => current[item.label] ? current : { ...current, [item.label]: true });
      }
    });
  }, [location.pathname]);

  const renderItems = (items: SidebarItem[]): React.ReactNode => items.map((item) => {
    const hasChildren = 'children' in item;
    const active = hasChildren ? item.children.some((child) => isActive(child.path)) : isActive(item.path);
    const key = hasChildren ? item.label : item.path;
    const groupOpen = hasChildren && Boolean(openGroups[item.label]);
    return (
      <div key={key} className={`relative group w-full ${isExpanded ? '' : 'flex justify-center'}`}>
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={groupOpen}
            onClick={() => {
              if (!isExpanded) {
                setIsExpanded(true);
                setOpenGroups((current) => ({ ...current, [item.label]: true }));
              }
              else setOpenGroups((current) => ({ ...current, [item.label]: !current[item.label] }));
            }}
            className={`admin-sidebar-item ${active ? 'admin-sidebar-item-parent-active' : ''} flex items-center rounded-lg transition-all duration-200 ${
              isExpanded ? 'w-full gap-2 px-2 py-2' : 'h-8 w-8 justify-center'
            }`}
          >
            <span className="relative flex flex-shrink-0 items-center justify-center">{item.icon}</span>
            {isExpanded && <><span className="flex-1 truncate text-left text-sm font-medium">{item.label}</span>{groupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</>}
          </button>
        ) : (
          <Link
            to={item.path}
            onClick={handleNavigationClick}
            className={`admin-sidebar-item ${active ? 'admin-sidebar-item-current' : ''} flex items-center rounded-lg transition-all duration-200 ${
              isExpanded ? 'w-full gap-2 px-2 py-2' : 'h-8 w-8 justify-center'
            }`}
            title={isExpanded ? undefined : item.label}
          >
            <span className="relative flex flex-shrink-0 items-center justify-center">
              {item.icon}
              {item.badge ? <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-0.5 text-[9px] leading-none text-danger-contrast">{item.badge}</span> : null}
            </span>
            {isExpanded && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
          </Link>
        )}
        {!isExpanded && (
          <div
            className="pointer-events-none invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border px-2 py-1 text-[11px] font-medium group-hover:visible"
            style={{ backgroundColor: 'var(--surface2)', color: 'var(--text)', borderColor: 'var(--border)' }}
          >
            {item.label}
          </div>
        )}
        {hasChildren && isExpanded && (
          <div aria-hidden={!groupOpen} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${groupOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="admin-sidebar-submenu-rail mt-1 space-y-1 border-l py-1">
                {renderItems(item.children)}
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
      className={`admin-sidebar-shell h-full flex flex-col border-r relative transition-all duration-300`}
      style={{
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
      <div className={`border-t px-1 py-2 flex justify-center`} style={{ borderColor: 'rgb(var(--rentra-admin-sidebar-border))' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`admin-sidebar-control rounded-lg flex items-center justify-center transition-all`}
          style={{
            ...(menuOpen && {
              color: 'rgb(var(--rentra-admin-sidebar-active))',
              backgroundColor: 'rgb(var(--rentra-admin-sidebar-soft))',
            }),
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
                className={`admin-sidebar-item ${!isExpanded ? 'admin-sidebar-item-parent-active' : ''} px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2 border-b`}
                style={{
                  borderColor: 'rgb(var(--rentra-admin-sidebar-border))'
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
                className={`admin-sidebar-item ${isExpanded ? 'admin-sidebar-item-parent-active' : ''} px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2 border-b`}
                style={{
                  borderColor: 'rgb(var(--rentra-admin-sidebar-border))'
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
                className={`admin-sidebar-item ${expandOnHover ? 'admin-sidebar-item-parent-active' : ''} px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-2`}
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
