import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { Scale } from 'lucide-react';
import { adminAPI } from '../../api/admin';

interface AdminDispute {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  agreement?: {
    tenant?: { id: string; email?: string; fullName?: string };
    listing?: { id: string; title?: string; city?: string };
  };
}

function normalizeDisputes(response: unknown): AdminDispute[] {
  if (Array.isArray(response)) return response as AdminDispute[];
  if (response && typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
    return response.items as AdminDispute[];
  }
  return [];
}

const AdminAllDisputes = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminAPI.getAllDisputes().then((response) => {
      if (active) setDisputes(normalizeDisputes(response));
    }).catch(() => {
      if (active) setError('Could not load disputes. Please try again later.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const open = disputes.filter((dispute) => dispute.status === 'OPEN').length;
  const inProgress = disputes.filter((dispute) => dispute.status === 'IN_PROGRESS').length;
  const resolved = disputes.filter((dispute) => ['RESOLVED', 'CLOSED'].includes(dispute.status)).length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };
  const statValue = (value: number) => loading || error ? '—' : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Disputes</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and mediate disputes between tenants and landlords</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Disputes</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{statValue(disputes.length)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Open</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{statValue(open)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{statValue(inProgress)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Resolved</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statValue(resolved)}</p>
        </Card>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <Card className="p-6"><p className="text-center text-gray-500">Loading disputes...</p></Card>
      ) : disputes.length === 0 ? (
        <Card className="p-6"><p className="text-center text-gray-500">{error ? 'Dispute records are unavailable.' : 'No disputes found.'}</p></Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="p-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale size={18} className="text-blue-500" />
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{dispute.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {dispute.agreement?.tenant?.fullName || dispute.agreement?.tenant?.email || 'Tenant unavailable'}
                      {' · '}
                      {dispute.agreement?.listing?.title || 'Property unavailable'}
                      {dispute.agreement?.listing?.city ? `, ${dispute.agreement.listing.city}` : ''}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{dispute.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(dispute.status)}`}>
                    {dispute.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-400 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Filed {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'date unavailable'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAllDisputes;
