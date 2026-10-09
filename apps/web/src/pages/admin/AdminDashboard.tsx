import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import api from '../../api/client';

interface DashboardStats {
  users?: { total?: number };
  listings?: { total?: number };
  disputes?: { open?: number };
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
  landlord?: { email: string };
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

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/admin/dashboard/stats').then((response) => {
      if (active) setStats(unwrap<DashboardStats>(response.data));
    }).catch(() => {
      if (active) setStatsError('Dashboard statistics could not be loaded.');
    }).finally(() => {
      if (active) setStatsLoading(false);
    });
    api.get('/admin/dashboard/activity').then((response) => {
      if (active) setActivity(unwrap<DashboardActivity>(response.data));
    }).catch(() => {
      if (active) setActivityError('Recent activity could not be loaded.');
    }).finally(() => {
      if (active) setActivityLoading(false);
    });
    return () => { active = false; };
  }, []);

  const metric = (value: number | undefined, loading: boolean) => loading ? 'Loading...' : value ?? '—';
  const recentListings = activity?.recentListings ?? [];
  const recentUsers = activity?.recentUsers ?? [];

  return (
    <div>
      <div className="mb-3">
        <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Admin Dashboard 🛡️</h2>
        <p className={`text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>Platform moderation, users, and analytics</p>
      </div>

      {statsError && <p role="alert" className="mb-3 text-sm text-red-600">{statsError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <StatCard label="TOTAL USERS" value={metric(stats?.users?.total, statsLoading)} />
        <StatCard label="LISTINGS" value={metric(stats?.listings?.total, statsLoading)} />
        <StatCard label="FLAGGED TODAY" value="Unavailable" change="No live metric endpoint" />
        <StatCard label="OPEN DISPUTES" value={metric(stats?.disputes?.open, statsLoading)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <div className={`text-[11px] font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Recent Listings</div>
          {activityError && <p role="alert" className="mb-2 text-xs text-red-600">{activityError}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr>
                  {['Listing', 'Landlord', 'Added'].map((heading) => (
                    <th key={heading} className={`text-left text-[9px] font-mono ${isDark ? 'text-gray-700 border-white/10' : 'text-gray-500 border-gray-200'} tracking-widest pb-2 border-b`}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activityLoading ? (
                  <tr><td colSpan={3} className="py-3 text-[11px] text-gray-500">Loading recent listings...</td></tr>
                ) : recentListings.length === 0 ? (
                  <tr><td colSpan={3} className="py-3 text-[11px] text-gray-500">{activityError ? 'Listing activity is unavailable.' : 'No recent listings.'}</td></tr>
                ) : recentListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2 text-[11px] text-gray-600">{listing.title}{listing.city ? ` — ${listing.city}` : ''}</td>
                    <td className="py-2 text-[11px] text-gray-600">{listing.landlord?.email || '—'}</td>
                    <td className="py-2 text-[11px] text-gray-600">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="text-[13px] font-bold mb-4">Recent Users</div>
          {activityError && <p role="alert" className="mb-2 text-xs text-red-600">{activityError}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr>
                  {['User', 'Email', 'Joined'].map((heading) => (
                    <th key={heading} className="text-left text-[10px] font-mono text-gray-500 tracking-widest pb-2 border-b border-gray-200">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activityLoading ? (
                  <tr><td colSpan={3} className="py-3 text-[13px] text-gray-500">Loading recent users...</td></tr>
                ) : recentUsers.length === 0 ? (
                  <tr><td colSpan={3} className="py-3 text-[13px] text-gray-500">{activityError ? 'User activity is unavailable.' : 'No recent users.'}</td></tr>
                ) : recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                    <td className="py-2.5 text-[13px] font-semibold">{user.fullName || '—'}</td>
                    <td className="py-2.5 text-[13px] text-gray-600">{user.email}</td>
                    <td className="py-2.5 text-[13px] text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
