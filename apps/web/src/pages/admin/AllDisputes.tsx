import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Scale, Clock } from 'lucide-react';

interface Dispute {
  id: string;
  property: string;
  tenant: string;
  landlord: string;
  reason: string;
  amount: number;
  status: 'open' | 'in_mediation' | 'resolved';
  filledDate: string;
  priority: 'low' | 'medium' | 'high';
}

const AdminAllDisputes = () => {
  const [disputes] = useState<Dispute[]>([
    {
      id: '1',
      property: 'Modern 2BR Apartment',
      tenant: 'Ahmed Ali',
      landlord: 'John Smith',
      reason: 'Security deposit not returned',
      amount: 50000,
      status: 'open',
      filledDate: '2026-04-10',
      priority: 'high',
    },
    {
      id: '2',
      property: 'Spacious Villa',
      tenant: 'Fatima Khan',
      landlord: 'Ahmed Khan',
      reason: 'Maintenance issues not resolved',
      amount: 25000,
      status: 'in_mediation',
      filledDate: '2026-03-25',
      priority: 'medium',
    },
    {
      id: '3',
      property: 'Studio Apartment',
      tenant: 'Sara Ahmed',
      landlord: 'Sarah Smith',
      reason: 'Broke lease early',
      amount: 15000,
      status: 'resolved',
      filledDate: '2026-02-15',
      priority: 'low',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'in_mediation':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === 'open').length,
    mediation: disputes.filter((d) => d.status === 'in_mediation').length,
    resolved: disputes.filter((d) => d.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Disputes</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and mediate disputes between tenants and landlords</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Disputes</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Open</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.open}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">In Mediation</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.mediation}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Resolved</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.resolved}</p>
        </Card>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="p-5">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale size={18} className="text-blue-500" />
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {dispute.property}
                    </h3>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPriorityColor(dispute.priority) }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>{dispute.tenant}</strong> vs <strong>{dispute.landlord}</strong>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{dispute.reason}</p>
                </div>

                {/* Amount & Status */}
                <div className="text-right flex flex-col gap-3">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Disputed Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Rs {dispute.amount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                    {dispute.status === 'in_mediation' ? 'In Mediation' : dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-400 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Filed on {new Date(dispute.filledDate).toLocaleDateString()}
                </p>

                {dispute.status === 'open' ? (
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition">
                      <Clock size={16} />
                      Start Mediation
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold text-sm transition">
                      View Details
                    </button>
                  </div>
                ) : (
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold text-sm transition">
                    View Details
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAllDisputes;

