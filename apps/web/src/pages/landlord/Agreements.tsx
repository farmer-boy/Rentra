import { useState } from 'react';
import { FileText, Download, Eye, Trash2, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Agreement {
  id: string;
  tenantName: string;
  property: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'active' | 'expired' | 'pending';
  document: string;
}

const LandlordAgreements = () => {
  const [agreements] = useState<Agreement[]>([
    {
      id: '1',
      tenantName: 'John Smith',
      property: 'Modern 2BR Apartment Downtown',
      startDate: '2023-06-15',
      endDate: '2025-06-14',
      monthlyRent: 2500,
      status: 'active',
      document: 'Lease_Agreement_2023_06.pdf',
    },
    {
      id: '2',
      tenantName: 'Sarah Johnson',
      property: 'Spacious 3BR House with Backyard',
      startDate: '2023-08-20',
      endDate: '2025-08-19',
      monthlyRent: 3200,
      status: 'active',
      document: 'Lease_Agreement_2023_08.pdf',
    },
    {
      id: '3',
      tenantName: 'Michael Brown',
      property: 'Spacious 3BR House with Backyard',
      startDate: '2024-01-10',
      endDate: '2025-01-09',
      monthlyRent: 3200,
      status: 'active',
      document: 'Lease_Agreement_2024_01.pdf',
    },
    {
      id: '4',
      tenantName: 'Previous Tenant',
      property: 'Cozy Studio with Garden',
      startDate: '2022-03-01',
      endDate: '2023-02-28',
      monthlyRent: 1500,
      status: 'expired',
      document: 'Lease_Agreement_2022_03.pdf',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const daysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const activeAgreements = agreements.filter(a => a.status === 'active').length;
  const expiredAgreements = agreements.filter(a => a.status === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agreements</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your lease agreements with tenants</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold">
          <Plus size={16} />
          New Agreement
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Active Agreements</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeAgreements}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Expired Agreements</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{expiredAgreements}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Agreements</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{agreements.length}</p>
        </Card>
      </div>

      {/* Agreements List */}
      <div className="space-y-4">
        {agreements.map((agreement) => {
          const daysLeft = agreement.status === 'active' ? daysUntilExpiry(agreement.endDate) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft < 90 && daysLeft > 0;

          return (
            <Card key={agreement.id} className={`p-5 ${isExpiringSoon ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400' : ''}`}>
              <div className="flex items-start justify-between">
                {/* Agreement Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{agreement.tenantName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{agreement.property}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{new Date(agreement.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">End Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{new Date(agreement.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Monthly Rent</p>
                      <p className="font-semibold text-gray-900 dark:text-white">${agreement.monthlyRent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${getStatusColor(agreement.status)}`}>
                        {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Expiring Soon Warning */}
                  {isExpiringSoon && (
                    <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-xs font-semibold">
                      ⚠️ This agreement expires in {daysLeft} days. Consider renewing soon.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs font-semibold whitespace-nowrap">
                    <Eye size={14} />
                    View
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition text-xs font-semibold whitespace-nowrap">
                    <Download size={14} />
                    Download
                  </button>
                  {agreement.status === 'expired' && (
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition text-xs font-semibold whitespace-nowrap">
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LandlordAgreements;
