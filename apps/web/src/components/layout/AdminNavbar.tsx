import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, ChevronRight, CircleHelp, LogOut, Menu, Search, Settings, UserRound, X } from 'lucide-react';
import { notificationsAPI } from '../../api/notifications';
import { useAuthStore } from '../../store/authStore';

interface AdminNavbarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export default function AdminNavbar({ onMenuClick, sidebarOpen }: AdminNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const unreadNotifications = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: notificationsAPI.unreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const initials = user?.fullName
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AD';

  const handleLogout = () => {
    if (logout()) navigate('/login');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/admin/listings?search=${encodeURIComponent(query)}` : '/admin/listings');
  };

  const breadcrumbLabels: Record<string, string> = {
    approvals: 'Approvals', apartments: 'Apartments', analytics: 'Analytics', audit: 'Activity log',
    bookings: 'Bookings', disputes: 'Disputes', flats: 'Flats', hosts: 'Hosts', hotels: 'Hotels',
    hostels: 'Hostels', listings: 'Listings', messages: 'Messages', notifications: 'Notifications',
    payments: 'Payments', properties: 'Properties', profile: 'My profile', reports: 'Reports',
    rooms: 'Rooms', support: 'Support tickets', users: 'Users', verification: 'Verification',
  };
  const routeParts = location.pathname.split('/').filter(Boolean).slice(1);
  const breadcrumbs = routeParts.length === 0
    ? [{ label: 'Dashboard', path: '/admin' }]
    : routeParts.map((part, index) => {
        const parent = routeParts[index - 1];
        const isId = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part) || /^[0-9a-f]{24}$/i.test(part);
        const label = isId
          ? parent === 'users' ? 'User details' : parent === 'listings' || parent === 'properties' ? 'Property details' : 'Details'
          : breadcrumbLabels[part] ?? part.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
        return { label, path: `/admin/${routeParts.slice(0, index + 1).join('/')}` };
      });

  const openProfileLink = (path: string) => {
    navigate(path);
    setProfileOpen(false);
  };

  return (
    <nav className="relative z-30 box-border flex h-14 w-full shrink-0 items-center gap-3 border-b border-border bg-surface pl-3 pr-6 text-text md:pl-5 md:pr-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="shrink-0 rounded-lg p-2 text-text-muted hover:bg-surface2 md:hidden"
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
      </button>

      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        aria-label="Rentra admin dashboard"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-surface2">
          <img src="/logo.jpg" alt="Rentra logo" className="h-full w-full object-contain" />
        </span>
        <span className="rounded-md bg-surface2 px-2.5 py-1 text-[11px] font-extrabold leading-none tracking-wide text-text">ADMIN</span>
      </button>

      <ol aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className={`min-w-0 items-center gap-1.5 ${index < breadcrumbs.length - 1 ? 'hidden md:flex' : 'flex'}`}>
            {index > 0 && <ChevronRight size={13} className="shrink-0 text-text-muted" />}
            <button
              type="button"
              onClick={() => navigate(crumb.path)}
              aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
              className={`max-w-24 truncate text-xs md:max-w-40 ${index === breadcrumbs.length - 1 ? 'font-semibold text-text' : 'text-text-muted hover:text-text'}`}
            >
              {crumb.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="min-w-0 flex-1" />

      <form
        onSubmit={submitSearch}
        role="search"
        className="hidden h-10 w-48 shrink-0 items-center gap-2 rounded-full border border-border bg-surface2 px-3 md:flex lg:w-64"
      >
        <Search size={16} className="shrink-0 text-text-muted" />
        <input
          type="search"
          aria-label="Search admin listings"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-text outline-none placeholder:text-text-muted"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/listings')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface2 hover:text-text md:hidden"
          aria-label="Search properties"
          title="Search properties"
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/notifications')}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface2 hover:text-text"
          aria-label={unreadNotifications.data?.unreadCount ? `Notifications, ${unreadNotifications.data.unreadCount} unread` : 'Notifications'}
          title="Notifications"
        >
          <Bell size={18} />
          {(unreadNotifications.data?.unreadCount ?? 0) > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">{unreadNotifications.data!.unreadCount > 99 ? '99+' : unreadNotifications.data!.unreadCount}</span>}
        </button>

        <span className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text hover:bg-surface2"
            aria-label="Open admin profile menu"
            title={user?.fullName || 'Admin profile'}
            aria-expanded={profileOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-contrast">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
          </button>

          {profileOpen && (
            <>
              <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close profile menu" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-text">{user?.fullName || 'Admin'}</p>
                  <p className="truncate text-xs text-text-muted">{user?.email}</p>
                </div>
                <button type="button" onClick={() => openProfileLink('/admin/profile')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface2 hover:text-text">
                  <UserRound size={16} /> My profile
                </button>
                <button type="button" onClick={() => openProfileLink('/admin/settings')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface2 hover:text-text">
                  <Settings size={16} /> Account settings
                </button>
                <button type="button" onClick={() => openProfileLink('/help')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface2 hover:text-text">
                  <CircleHelp size={16} /> Help / Docs
                </button>
                <button type="button" onClick={() => openProfileLink('/admin/audit')} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface2 hover:text-text">
                  <Activity size={16} /> Activity log
                </button>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-surface2">
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
