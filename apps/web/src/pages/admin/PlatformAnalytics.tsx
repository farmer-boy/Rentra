import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Users } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import Card from '../../components/ui/Card';

interface PlatformStats {
  users: { total: number; active: number; suspended: number };
  listings: { total: number; verified: number };
  agreements: { total: number; active: number };
  disputes: { total: number; open: number };
  bookings: { total: number; completed: number };
  reports: { open: number };
  verifications: { pending: number };
  payments: {
    byStatus: Record<string, Record<string, { count: number; grossAmount: number }>>;
  };
  trends: Array<{
    month: string;
    newUsers: number;
    properties: number;
    bookings: number;
    grossPayments: Array<{ amount: number; currency: string }>;
  }>;
}

const AdminPlatformAnalytics = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getDashboardStats()
      .then((response) => setStats(response))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Platform analytics could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const paidTotals = Object.entries(stats?.payments.byStatus ?? {})
    .filter(([status]) => status === 'PAID' || status === 'SUCCESS')
    .reduce<Record<string, number>>((totals, [, currencies]) => {
      for (const [currency, item] of Object.entries(currencies)) {
        totals[currency] = (totals[currency] ?? 0) + item.grossAmount;
      }
      return totals;
    }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900  mb-2">Platform Analytics</h1>
        <p className="text-gray-600 ">Current totals reported by the platform.</p>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading platform analytics...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600  text-sm">Total Users</p><p className="text-3xl font-bold mt-2">{stats.users.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.users.active.toLocaleString()} active · {stats.users.suspended.toLocaleString()} suspended</p></div><Users size={24} className="text-blue-500" /></div></Card>
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600  text-sm">Listings</p><p className="text-3xl font-bold mt-2">{stats.listings.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.listings.verified.toLocaleString()} published</p></div><BarChart3 size={24} className="text-green-500" /></div></Card>
            <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-gray-600  text-sm">Gross paid volume</p><p className="text-2xl font-bold mt-2">{Object.entries(paidTotals).map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(' · ') || '—'}</p><p className="mt-2 text-xs text-gray-500">Gross transactions, not platform revenue</p></div><DollarSign size={24} className="text-emerald-500" /></div></Card>
            <Card className="p-5"><p className="text-gray-600  text-sm">Agreements</p><p className="text-3xl font-bold mt-2">{stats.agreements.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.agreements.active.toLocaleString()} active</p></Card>
            <Card className="p-5"><p className="text-gray-600  text-sm">Bookings</p><p className="text-3xl font-bold mt-2">{stats.bookings.total.toLocaleString()}</p><p className="mt-2 text-xs text-gray-500">{stats.bookings.completed.toLocaleString()} completed</p></Card>
            <Card className="p-5"><p className="text-gray-600  text-sm">Open reports</p><p className="text-3xl font-bold mt-2">{stats.reports.open.toLocaleString()}</p></Card>
            <Card className="p-5"><p className="text-gray-600  text-sm">Pending verifications</p><p className="text-3xl font-bold mt-2">{stats.verifications.pending.toLocaleString()}</p></Card>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Disputes</h3>
            <p className="text-2xl font-bold">{stats.disputes.total.toLocaleString()} total</p>
            <p className="text-sm text-gray-500 mt-1">{stats.disputes.open.toLocaleString()} open</p>
          </Card>
        </>
      )}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Six-month platform trends</h3>
          <p className="mb-3 text-xs text-gray-500">Payment totals are gross transaction volume, grouped by currency, not platform revenue.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-gray-200  text-left"><th className="py-2">Month</th><th>New users</th><th>Properties</th><th>Bookings</th><th>Paid transactions</th></tr></thead>
              <tbody>{stats.trends.map((trend) => (
                <tr key={trend.month} className="border-b border-gray-100 ">
                  <td className="py-2">{trend.month}</td><td>{trend.newUsers}</td><td>{trend.properties}</td><td>{trend.bookings}</td>
                  <td>{trend.grossPayments.map((payment) => `${payment.currency} ${payment.amount.toLocaleString()}`).join(', ') || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminPlatformAnalytics;
