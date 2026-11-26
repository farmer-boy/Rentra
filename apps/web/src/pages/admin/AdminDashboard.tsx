import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarCheck2,
  CircleAlert, Clock3, ShieldCheck, TrendingUp, Users,
} from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { useAuthStore } from '../../store/authStore';

interface DashboardStats {
  users?: { total?: number };
  listings?: { total?: number };
  disputes?: { open?: number };
  reports?: { open?: number };
  verifications?: { pending?: number };
  bookings?: { total?: number; completed?: number };
  payments?: {
    byStatus?: Record<string, Record<string, { count: number; grossAmount: number }>>;
    note?: string;
  };
  trends?: Array<{
    month: string;
    newUsers: number;
    properties: number;
    bookings: number;
    grossPayments: Array<{ amount: number; currency: string }>;
  }>;
}

interface RecentUser {
  id: string;
  fullName?: string;
  email: string;
  createdAt: string;
}

interface RecentListing {
  id: string;
  title: string;
  city: string;
  createdAt: string;
  landlord?: { fullName: string };
}

interface DashboardActivity {
  recentUsers?: RecentUser[];
  recentListings?: RecentListing[];
}

function unwrap<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) {
    return value.data as T;
  }
  return value as T;
}

function shortDate(value: string) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
}

function TrendChart({ trends }: { trends: NonNullable<DashboardStats['trends']> }) {
  const points = useMemo(() => {
    if (!trends.length) return [];
    const maxValue = Math.max(1, ...trends.flatMap((item) => [item.newUsers, item.properties]));
    return trends.map((item, index) => ({
      month: item.month,
      x: 36 + (index / Math.max(1, trends.length - 1)) * 628,
      usersY: 158 - (item.newUsers / maxValue) * 122,
      propertiesY: 158 - (item.properties / maxValue) * 122,
    }));
  }, [trends]);
  const usersPath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.usersY}`).join(' ');
  const propertiesPath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.propertiesY}`).join(' ');

  if (!trends.length) return <div className="grid h-56 place-items-center text-sm text-text-muted">Growth data will appear as Rentra collects activity.</div>;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" />New users</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" />Properties</span></div>
      <div className="mt-3 overflow-hidden">
        <svg viewBox="0 0 700 205" className="h-56 w-full" role="img" aria-label="Six month trend of new users and properties">
          {[36, 76, 117, 158].map((y) => <line key={y} x1="36" x2="664" y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray="3 6" />)}
          <path d={usersPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={propertiesPath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => <g key={point.month}><circle cx={point.x} cy={point.usersY} r="4" fill="#2563eb" stroke="white" strokeWidth="2" /><circle cx={point.x} cy={point.propertiesY} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" /><text x={point.x} y="190" textAnchor="middle" fontSize="10" fill="currentColor" className="text-text-muted">{point.month}</text></g>)}
        </svg>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    let active = true;
    adminAPI.getDashboardStats().then((response) => {
      if (active) setStats(unwrap<DashboardStats>(response));
    }).catch(() => {
      if (active) setStatsError('Dashboard statistics could not be loaded.');
    }).finally(() => {
      if (active) setStatsLoading(false);
    });
    adminAPI.getDashboardActivity().then((response) => {
      if (active) setActivity(unwrap<DashboardActivity>(response));
    }).catch(() => {
      if (active) setActivityError('Recent activity could not be loaded.');
    }).finally(() => {
      if (active) setActivityLoading(false);
    });
    return () => { active = false; };
  }, []);

  const recentListings = activity?.recentListings ?? [];
  const recentUsers = activity?.recentUsers ?? [];
  const grossPaidByCurrency = Object.entries(stats?.payments?.byStatus ?? {})
    .filter(([status]) => status === 'PAID' || status === 'SUCCESS')
    .reduce<Record<string, number>>((result, [, currencies]) => {
      for (const [currency, entry] of Object.entries(currencies)) {
        result[currency] = (result[currency] ?? 0) + entry.grossAmount;
      }
      return result;
    }, {});
  const paidLabel = Object.entries(grossPaidByCurrency).map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(' · ') || '—';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const metrics = [
    { label: 'Total users', value: stats?.users?.total, icon: Users, detail: 'Registered accounts', path: '/admin/users', tone: 'blue' },
    { label: 'Properties', value: stats?.listings?.total, icon: Building2, detail: 'All platform listings', path: '/admin/listings', tone: 'violet' },
    { label: 'Bookings', value: stats?.bookings?.total, icon: CalendarCheck2, detail: `${stats?.bookings?.completed ?? 0} completed`, path: '/admin/bookings', tone: 'cyan' },
    { label: 'Pending verifications', value: stats?.verifications?.pending, icon: ShieldCheck, detail: 'Need verification', path: '/admin/approvals', tone: 'amber' },
  ] as const;
  const toneClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600',
    cyan: 'bg-cyan-50 text-cyan-600', amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 text-text sm:space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Platform overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1><p className="mt-1 text-sm text-text-muted">Here is what’s happening across Rentra today.</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => navigate('/admin/analytics')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text shadow-sm hover:bg-surface2"><TrendingUp size={16} />Analytics</button><button type="button" onClick={() => navigate('/admin/approvals')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Review queue<ArrowRight size={15} /></button></div>
      </header>

      {statsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{statsError}</p>}

      <section aria-label="Platform metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, detail, path, tone }) => <button key={label} type="button" onClick={() => navigate(path)} className="group rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-text-muted">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight">{statsLoading ? '—' : value?.toLocaleString() ?? '—'}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon size={20} /></span></div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted"><span>{detail}</span><ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
        </button>)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-bold">Platform growth</h2><p className="mt-1 text-xs text-text-muted">New users and properties over the last six months</p></div><button type="button" onClick={() => navigate('/admin/analytics')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Full analytics<ArrowUpRight size={13} className="ml-1 inline" /></button></div>{statsLoading ? <div className="mt-5 h-56 animate-pulse rounded-xl bg-surface2" /> : <TrendChart trends={stats?.trends ?? []} />}</div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold">Needs attention</h2><p className="mt-1 text-xs text-text-muted">Items waiting for admin review</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><CircleAlert size={18} /></span></div>
          <div className="mt-4 divide-y divide-border">{[
            { label: 'Pending verifications', value: stats?.verifications?.pending, path: '/admin/approvals', icon: BadgeCheck },
            { label: 'Open reports', value: stats?.reports?.open, path: '/admin/reports?status=OPEN', icon: CircleAlert },
            { label: 'Open disputes', value: stats?.disputes?.open, path: '/admin/disputes?status=OPEN', icon: Clock3 },
          ].map(({ label, value, path, icon: Icon }) => <button key={label} type="button" onClick={() => navigate(path)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-blue-700"><span className="flex min-w-0 items-center gap-2.5"><Icon size={16} className="shrink-0 text-text-muted" /><span className="truncate text-sm">{label}</span></span><span className="rounded-full bg-surface2 px-2.5 py-1 text-sm font-bold tabular-nums">{statsLoading ? '—' : value ?? 0}</span></button>)}</div>
          <div className="mt-3 rounded-xl bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-900">Gross payments</p><p className="mt-1 text-sm font-bold text-blue-700">{statsLoading ? 'Loading…' : paidLabel}</p><p className="mt-1 text-[11px] leading-4 text-blue-800/75">Gross transaction volume, not platform revenue.</p></div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"><div><h2 className="text-base font-bold">Recent listings</h2><p className="mt-1 text-xs text-text-muted">Latest properties added to Rentra</p></div><button type="button" onClick={() => navigate('/admin/listings')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all<ArrowRight size={13} className="ml-1 inline" /></button></div>
          {activityError && <p role="alert" className="px-5 pt-3 text-xs text-red-600">{activityError}</p>}<div className="divide-y divide-border">{activityLoading ? <p className="px-5 py-8 text-center text-sm text-text-muted">Loading listings…</p> : recentListings.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text-muted">{activityError ? 'Listing activity is unavailable.' : 'No recent listings yet.'}</p> : recentListings.slice(0, 5).map((listing) => <button type="button" key={listing.id} onClick={() => navigate('/admin/listings')} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface2 sm:px-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Building2 size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{listing.title || 'Untitled property'}</span><span className="mt-0.5 block truncate text-xs text-text-muted">{[listing.city, listing.landlord?.fullName].filter(Boolean).join(' · ') || 'Owner details unavailable'}</span></span><span className="shrink-0 text-xs text-text-muted">{shortDate(listing.createdAt)}</span></button>)}</div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"><div><h2 className="text-base font-bold">New members</h2><p className="mt-1 text-xs text-text-muted">Recently registered accounts</p></div><button type="button" onClick={() => navigate('/admin/users')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all<ArrowRight size={13} className="ml-1 inline" /></button></div>
          {activityError && <p role="alert" className="px-5 pt-3 text-xs text-red-600">{activityError}</p>}<div className="divide-y divide-border">{activityLoading ? <p className="px-5 py-8 text-center text-sm text-text-muted">Loading members…</p> : recentUsers.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text-muted">{activityError ? 'User activity is unavailable.' : 'No new members yet.'}</p> : recentUsers.slice(0, 5).map((member) => <button type="button" key={member.id} onClick={() => navigate(`/admin/users/${member.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface2 sm:px-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-sm font-bold text-cyan-700">{(member.fullName || member.email || 'U').slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{member.fullName || 'New member'}</span><span className="mt-0.5 block truncate text-xs text-text-muted">{member.email}</span></span><span className="shrink-0 text-xs text-text-muted">{shortDate(member.createdAt)}</span></button>)}</div>
        </div>
      </section>
      <p className="flex items-center gap-2 pb-2 text-[11px] text-text-muted"><ShieldCheck size={14} />Live figures from Rentra admin APIs. Payment values show gross transaction volume.</p>
    </div>
  );
}
