import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { Scale } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import type { DisputeRecord } from '../../api/disputes';

interface AdminDispute extends DisputeRecord {
  createdBy?: { id: string; fullName: string };
  agreement?: {
    listing?: { title?: string };
  };
  booking?: {
    listing?: { title?: string };
    property?: { title?: string };
  };
}

function normalizeDisputes(response: unknown): AdminDispute[] {
  if (Array.isArray(response)) return response as AdminDispute[];
  if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
    return response.data as AdminDispute[];
  }
  return [];
}

const AdminAllDisputes = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

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
  const inProgress = disputes.filter((dispute) => (
    ['MEDIATION', 'UNDER_REVIEW', 'AWAITING_INFORMATION'].includes(dispute.status)
  )).length;
  const resolved = disputes.filter((dispute) => ['RESOLVED', 'CLOSED'].includes(dispute.status)).length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100  text-red-700 ';
      case 'MEDIATION':
      case 'UNDER_REVIEW':
      case 'AWAITING_INFORMATION':
        return 'bg-yellow-100  text-yellow-700 ';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100  text-green-700 ';
      default:
        return 'bg-gray-100  text-gray-700 ';
    }
  };
  const statValue = (value: number) => loading || error ? '—' : value;

  const resolveDispute = async (dispute: AdminDispute) => {
    const resolution = window.prompt('Enter the documented dispute resolution:');
    if (!resolution?.trim()) return;
    setActionId(dispute.id);
    try {
      await adminAPI.resolveDispute(dispute.id, resolution);
      setDisputes((current) => current.map((item) => (
        item.id === dispute.id ? { ...item, status: 'RESOLVED' } : item
      )));
    } catch {
      setError('The dispute could not be resolved. Please refresh and try again.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900  mb-2">All Disputes</h1>
        <p className="text-gray-600 ">Review and mediate disputes between tenants and landlords</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Total Disputes</p>
          <p className="text-3xl font-bold text-gray-600  mt-2">{statValue(disputes.length)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Open</p>
          <p className="text-3xl font-bold text-red-600  mt-2">{statValue(open)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600  mt-2">{statValue(inProgress)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Resolved</p>
          <p className="text-3xl font-bold text-green-600  mt-2">{statValue(resolved)}</p>
        </Card>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 ">{error}</p>}
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
                      <h3 className="font-semibold text-lg text-gray-900 ">{dispute.reason || dispute.type.replaceAll('_', ' ')}</h3>
                    </div>
                    <p className="text-sm text-gray-600  mb-3">
                      {dispute.createdBy?.fullName || 'Reporter unavailable'}
                      {' · '}
                      {dispute.agreement?.listing?.title || dispute.booking?.listing?.title || dispute.booking?.property?.title || 'Property unavailable'}
                    </p>
                    <p className="text-gray-700 ">{dispute.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(dispute.status)}`}>
                    {dispute.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-400 ">
                  <p className="text-xs text-gray-500 ">
                    Filed {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'date unavailable'}
                  </p>
                  {!['RESOLVED', 'REJECTED', 'CLOSED'].includes(dispute.status) && (
                    <button
                      type="button"
                      disabled={actionId === dispute.id}
                      onClick={() => void resolveDispute(dispute)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-primary-contrast disabled:opacity-50"
                    >
                      {actionId === dispute.id ? 'Saving...' : 'Resolve'}
                    </button>
                  )}
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
