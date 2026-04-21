import { Star, TrendingUp, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

interface TenantScore {
  name: string;
  property: string;
  overallScore: number;
  paymentHistory: number;
  propertyMaintenance: number;
  communication: number;
  reliability: number;
}

const LandlordTrustScores = () => {
  const tenantScores: TenantScore[] = [
    {
      name: 'John Smith',
      property: 'Modern 2BR Apartment Downtown',
      overallScore: 4.8,
      paymentHistory: 5.0,
      propertyMaintenance: 4.8,
      communication: 4.6,
      reliability: 4.8,
    },
    {
      name: 'Sarah Johnson',
      property: 'Spacious 3BR House with Backyard',
      overallScore: 4.5,
      paymentHistory: 4.5,
      propertyMaintenance: 4.4,
      communication: 4.6,
      reliability: 4.4,
    },
    {
      name: 'Michael Brown',
      property: 'Spacious 3BR House with Backyard',
      overallScore: 3.9,
      paymentHistory: 3.5,
      propertyMaintenance: 4.0,
      communication: 3.8,
      reliability: 4.2,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    if (score >= 4.0) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
  };

  const getRatingBar = (score: number) => {
    if (score >= 4.5) return 'bg-green-500';
    if (score >= 4.0) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tenant Trust Scores</h1>
        <p className="text-gray-600 dark:text-gray-300">Review trust scores of your tenants before approving applications</p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Trust Scores</strong> are calculated based on tenant behavior: payment history, property maintenance, communication, and overall reliability. Higher scores indicate more reliable tenants.
          </div>
        </div>
      </Card>

      {/* Tenant Scores */}
      <div className="space-y-4">
        {tenantScores.map((tenant, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tenant.property}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-center ${getScoreColor(tenant.overallScore)}`}>
                <div className="flex items-center gap-1 justify-center mb-1">
                  <Star size={16} className="fill-current" />
                  <span className="text-2xl font-bold">{tenant.overallScore}</span>
                </div>
                <p className="text-xs font-semibold">Overall</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment History</p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{tenant.paymentHistory}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getRatingBar(tenant.paymentHistory)} h-2 rounded-full`}
                    style={{ width: `${(tenant.paymentHistory / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Maintenance</p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{tenant.propertyMaintenance}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getRatingBar(tenant.propertyMaintenance)} h-2 rounded-full`}
                    style={{ width: `${(tenant.propertyMaintenance / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication</p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{tenant.communication}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getRatingBar(tenant.communication)} h-2 rounded-full`}
                    style={{ width: `${(tenant.communication / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reliability</p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{tenant.reliability}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${getRatingBar(tenant.reliability)} h-2 rounded-full`}
                    style={{ width: `${(tenant.reliability / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Trend indicator */}
            {tenant.overallScore >= 4.5 && (
              <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
                <TrendingUp size={14} />
                Excellent tenant - Recommended for lease renewal
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LandlordTrustScores;
