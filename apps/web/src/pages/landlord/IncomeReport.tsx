import { TrendingUp, TrendingDown, Home, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';

const IncomeReport = () => {
  // Mock data
  const totalIncome = 8900;
  const expectedIncome = 9200;
  const difference = totalIncome - expectedIncome;
  const percentageChange = ((difference / expectedIncome) * 100).toFixed(1);

  const monthlyData = [
    { month: 'Jan', income: 7500, expected: 8900 },
    { month: 'Feb', income: 7500, expected: 8900 },
    { month: 'Mar', income: 7000, expected: 8900 },
    { month: 'Apr', income: 8900, expected: 9200 },
  ];

  const propertyIncome = [
    { name: 'Modern 2BR Apartment Downtown', income: 2500, percentage: 28 },
    { name: 'Spacious 3BR House with Backyard', income: 6400, percentage: 72 },
  ];

  const maxIncome = Math.max(...monthlyData.map(d => Math.max(d.income, d.expected)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Income Report</h1>
        <p className="text-gray-600 dark:text-gray-300">Monitor your rental income and trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">This Month Income</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${totalIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">April 2024</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Expected Income</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${expectedIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Total Rent Due</p>
        </Card>
        <Card className={`p-4 ${difference < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${difference < 0 ? 'text-red-600' : 'text-green-600'} dark:text-opacity-70`}>Difference</p>
            {difference < 0 ? <TrendingDown size={16} className="text-red-600" /> : <TrendingUp size={16} className="text-green-600" />}
          </div>
          <p className={`text-3xl font-bold mt-2 ${difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {difference < 0 ? '-' : '+'} ${Math.abs(difference).toLocaleString()}
          </p>
          <p className={`text-xs mt-2 ${difference < 0 ? 'text-red-600' : 'text-green-600'}`}>{percentageChange}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">96.7%</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Excellent</p>
        </Card>
      </div>

      {/* Monthly Income Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Income Trend</h3>
        <div className="space-y-4">
          {monthlyData.map((data, idx) => (
            <div key={idx}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-4 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.month}</span>
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Actual: ${data.income.toLocaleString()}</span>
                  <span className="text-gray-600 dark:text-gray-400">Expected: ${data.expected.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${(data.income / maxIncome) * 100}%` }}
                />
                <div
                  className="bg-blue-200 dark:bg-blue-400 transition-all"
                  style={{ width: `${((data.expected - data.income) / maxIncome) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Income by Property */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Income by Property</h3>
        <div className="space-y-4">
          {propertyIncome.map((property, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <Home size={14} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{property.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white ml-4">${property.income.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${property.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{property.percentage}% of total income</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            ${(monthlyData.reduce((sum, d) => sum + d.income, 0) / monthlyData.length).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{propertyIncome.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Tenants</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">3</p>
        </Card>
      </div>
    </div>
  );
};

export default IncomeReport;
