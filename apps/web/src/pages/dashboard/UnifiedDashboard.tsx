import { useNavigate } from 'react-router-dom';
import {
  Bell, Bookmark, CalendarDays, ClipboardList, CreditCard, FileText,
  Heart, Home, MessageCircle, Plus, Search, Settings, ShieldCheck, Star,
  TrendingUp, Users,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

const tenantActions = [
  { label: 'Browse properties', path: '/dashboard/listings', icon: Search, description: 'Find a place to rent' },
  { label: 'Saved properties', path: '/dashboard/saved', icon: Heart, description: 'Return to your favourites' },
  { label: 'Saved searches', path: '/dashboard/saved-searches', icon: Bookmark, description: 'Your saved search filters' },
  { label: 'Rental requests', path: '/dashboard/my-requests', icon: ClipboardList, description: 'Track requests you sent' },
  { label: 'Bookings', path: '/dashboard/my-bookings', icon: CalendarDays, description: 'Manage your stays' },
  { label: 'Agreements', path: '/dashboard/my-agreements', icon: FileText, description: 'View your rental agreements' },
  { label: 'Payments', path: '/dashboard/my-payments', icon: CreditCard, description: 'Review your payments' },
  { label: 'Rental history', path: '/dashboard/rental-history', icon: Home, description: 'Properties you have rented' },
];

const landlordActions = [
  { label: 'My properties', path: '/dashboard/properties', icon: Home, description: 'Manage your listings and images' },
  { label: 'Received requests', path: '/dashboard/received-requests', icon: ClipboardList, description: 'Respond to rental requests' },
  { label: 'Availability', path: '/dashboard/availability', icon: CalendarDays, description: 'Manage dates and inventory' },
  { label: 'Tenant agreements', path: '/dashboard/property-agreements', icon: FileText, description: 'Manage agreements with tenants' },
  { label: 'Payments received', path: '/dashboard/received-payments', icon: CreditCard, description: 'Review property payments' },
  { label: 'My tenants', path: '/dashboard/tenants', icon: Users, description: 'View your tenant relationships' },
  { label: 'Host verification', path: '/dashboard/host-verification', icon: ShieldCheck, description: 'Manage your host verification' },
];

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const hasLandlordAccess = roles.includes('LANDLORD');
  const isAdmin = roles.includes('ADMIN');

  const renderActions = (actions: typeof tenantActions) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ label, path, icon: Icon, description }) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className="group flex min-h-24 items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={18} /></span>
          <span><span className="block text-sm font-semibold text-text group-hover:text-primary">{label}</span><span className="mt-1 block text-xs leading-5 text-text-muted">{description}</span></span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Your Rentra account</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text">Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
        <p className="mt-2 text-sm text-text-muted">Rent a home and manage your own properties from one account.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-text-muted">Tenant features available</span>
          {hasLandlordAccess && <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary">Property management enabled</span>}
          {!hasLandlordAccess && <span className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-text-muted">Posting your first property enables property management</span>}
        </div>
      </header>

      <Card className="space-y-4 p-5">
        <div><h2 className="text-lg font-bold text-text">Renting</h2><p className="mt-1 text-sm text-text-muted">Search homes and manage your rental activity.</p></div>
        {renderActions(tenantActions)}
      </Card>

      {hasLandlordAccess && <Card className="space-y-4 p-5">
        <div><h2 className="text-lg font-bold text-text">Your properties</h2><p className="mt-1 text-sm text-text-muted">Manage hosting and property operations with the same account.</p></div>
        {renderActions(isAdmin ? landlordActions : [{ label: 'Post a property', path: '/dashboard/post-property', icon: Plus, description: 'Add a property to Rentra' }, ...landlordActions])}
      </Card>}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h2 className="font-bold text-text">Account and communication</h2><p className="mt-1 text-sm text-text-muted">Your profile, messages, notifications, and settings are shared across both capabilities.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/dashboard/messages')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface2"><MessageCircle size={16} />Messages</button>
          <button type="button" onClick={() => navigate('/dashboard/notifications')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface2"><Bell size={16} />Notifications</button>
          <button type="button" onClick={() => navigate('/dashboard/my-reviews')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface2"><Star size={16} />Reviews</button>
          <button type="button" onClick={() => navigate('/dashboard/settings')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface2"><Settings size={16} />Settings</button>
          <button type="button" onClick={() => navigate('/dashboard/rent-estimator')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface2"><TrendingUp size={16} />Rent estimator</button>
        </div>
      </Card>
    </div>
  );
}
