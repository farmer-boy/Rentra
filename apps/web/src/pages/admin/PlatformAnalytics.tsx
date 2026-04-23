import Card from '../../components/ui/Card';
import { TrendingUp, BarChart3, Users, DollarSign, ArrowUp } from 'lucide-react';

const AdminPlatformAnalytics = () => {
  // Mock data
  const metrics = {
    totalListings: 1304,
    totalUsers: 4500,
    activeListings: 1234,
    totalRevenue: 4850000,
    monthlyGrowth: 12.5,
    userGrowth: 8.3,
    listingGrowth: 15.2,
  };

  const monthlyData = [
    { month: 'Jan', users: 3800, listings: 950, revenue: 3200000 },
    { month: 'Feb', users: 3950, listings: 1050, revenue: 3500000 },
    { month: 'Mar', users: 4200, listings: 1180, revenue: 4100000 },
    { month: 'Apr', users: 4500, listings: 1304, revenue: 4850000 },
  ];

  const topCities = [
    { city: 'Lahore', listings: 450, users: 1200, revenue: 1800000 },
    { city: 'Karachi', listings: 380, users: 950, revenue: 1500000 },
    { city: 'Islamabad', listings: 290, users: 780, revenue: 1100000 },
    { city: 'Multan', listings: 185, users: 570, revenue: 450000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor platform growth and key performance indicators
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {metrics.totalUsers.toLocaleString()}
              </p>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <ArrowUp size={14} />
            +{metrics.userGrowth}% this month
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Listings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {metrics.activeListings.toLocaleString()}
              </p>
            </div>
            <BarChart3 size={24} className="text-green-500" />
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <ArrowUp size={14} />
            +{metrics.listingGrowth}% this month
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                Rs {(metrics.totalRevenue / 1000000).toFixed(1)}M
              </p>
            </div>
            <DollarSign size={24} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
            <ArrowUp size={14} />
            +{metrics.monthlyGrowth}% this month
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Revenue/User</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                Rs {(metrics.totalRevenue / metrics.totalUsers).toLocaleString('en-PK', {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingUp size={24} className="text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Per user lifetime</p>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends</h3>
        <div className="space-y-6">
          {monthlyData.map((data, idx) => (
            <div key={idx}>
              <div className="flex items-end justify-between mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">{data.month}</span>
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>Users: {data.users.toLocaleString()}</span>
                  <span>Listings: {data.listings}</span>
                  <span>Revenue: Rs {(data.revenue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${(data.revenue / 5000000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Cities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance by City</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">City</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Listings</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Users</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCities.map((data, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{data.city}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{data.listings}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{data.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                    Rs {(data.revenue / 1000000).toFixed(2)}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminPlatformAnalytics;

