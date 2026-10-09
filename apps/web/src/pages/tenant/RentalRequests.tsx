import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, MapPin } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';

interface RentalRequest {
  id: string;
  status: string;
  createdAt: string;
  moveInDate?: string | null;
  durationMonths?: number | null;
  message?: string | null;
  property?: { title?: string; area?: string; city?: string; price?: number } | null;
  listing?: { title?: string; area?: string; city?: string; rent?: number } | null;
}

const getErrorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? 'Rental requests could not be loaded. Please try again.';

export default function TenantRentalRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<RentalRequest[]>('/rental-requests/my');
      if (!Array.isArray(response.data)) throw new Error('Invalid rental-request response.');
      setRequests(response.data);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const cancelRequest = async (id: string) => {
    setCancellingId(id);
    setActionError('');
    try {
      const response = await api.patch<RentalRequest>(`/rental-requests/${id}/cancel`);
      setRequests((current) => current.map((request) => request.id === id ? response.data : request));
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header><h1 className="text-xl font-extrabold">My Rental Requests</h1><p className="text-sm text-gray-500">Track the requests you have sent to property owners.</p></header>
      {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-600">{actionError}</p></Card>}
      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading your rental requests…</p></Card>
        : error ? <Card className="p-5"><p role="alert" className="text-sm text-red-600">{error}</p><button onClick={() => void loadRequests()} className="mt-3 text-sm font-semibold text-emerald-700">Retry</button></Card>
          : requests.length === 0 ? <Card className="p-8 text-center"><ClipboardList className="mx-auto mb-3 text-emerald-600" /><p className="text-sm text-gray-500">You have not sent any rental requests yet.</p></Card>
            : <div className="space-y-3">{requests.map((request) => {
              const property = request.property ?? request.listing;
              const title = property?.title ?? 'Property details unavailable';
              const location = [property?.area, property?.city].filter(Boolean).join(', ');
              return <Card key={request.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    {location && <p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{location}</p>}
                    <p className="mt-2 text-sm text-gray-600">Sent {new Date(request.createdAt).toLocaleDateString()} · {request.status.replaceAll('_', ' ')}</p>
                    {request.moveInDate && <p className="mt-1 text-sm text-gray-500">Requested move-in: {new Date(request.moveInDate).toLocaleDateString()}</p>}
                    {request.durationMonths != null && <p className="mt-1 text-sm text-gray-500">Duration: {request.durationMonths} months</p>}
                    {request.message && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{request.message}</p>}
                  </div>
                  {request.status === 'PENDING' && <button disabled={cancellingId !== null} onClick={() => void cancelRequest(request.id)} className="rounded border px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50">{cancellingId === request.id ? 'Cancelling…' : 'Cancel request'}</button>}
                </div>
              </Card>;
            })}</div>}
    </div>
  );
}
