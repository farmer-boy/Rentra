import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Users } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';

interface PlatformStats {
  users: { total: number; active: number; suspended: number };
  listings: { total: number; verified: number };
  agreements: { total: number; active: number };
  disputes: { total: number; open: number };
  revenue: { total: number };
}

const AdminPlatformAnalytics = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then((response) => setStats(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Platform analytics could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Platform Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Current totals reported by the platform.</p>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading platform analytics...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p><p className="text-3xl font-bold mt-2">{stats.users.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.users.active.toLocaleString()} active · {stats.users.suspended.toLocaleString()} suspended</p></div><Users size={24} className="text-blue-500" /></div></Card>
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600 dark:text-gray-400 text-sm">Listings</p><p className="text-3xl font-bold mt-2">{stats.listings.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.listings.verified.toLocaleString()} published</p></div><BarChart3 size={24} className="text-green-500" /></div></Card>
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600 dark:text-gray-400 text-sm">Recorded Revenue</p><p className="text-2xl font-bold mt-2">Rs {stats.revenue.total.toLocaleString('en-PK')}</p><p className="mt-2 text-xs text-gray-500">Payments recorded as paid</p></div><DollarSign size={24} className="text-emerald-500" /></div></Card>
            <Card className="p-5"><p className="text-gray-600 dark:text-gray-400 text-sm">Agreements</p><p className="text-3xl font-bold mt-2">{stats.agreements.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.agreements.active.toLocaleString()} active</p></Card>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Disputes</h3>
            <p className="text-2xl font-bold">{stats.disputes.total.toLocaleString()} total</p>
            <p className="text-sm text-gray-500 mt-1">{stats.disputes.open.toLocaleString()} open</p>
          </Card>
        </>
      )}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Trends and location breakdown</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Monthly history, growth rates, per-user revenue, and city-level analytics are not currently provided by the analytics API.</p>
      </Card>
    </div>
  );
};

export default AdminPlatformAnalytics;
