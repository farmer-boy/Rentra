import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Home, MapPin, User, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface RentalRequest {
  id: string;
  status: string;
  createdAt: string;
  moveInDate?: string | null;
  durationMonths?: number | null;
  occupants?: number;
  message?: string | null;
  tenant?: { fullName?: string; email?: string };
  property?: { title?: string; area?: string; city?: string; price?: number };
  listing?: { title?: string; rent?: number };
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Rental requests could not be loaded. Please try again.';

const PendingApplications = () => {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    api.get('/rental-requests/received')
      .then((response) => {
        if (!Array.isArray(response.data)) throw new Error('The server returned invalid rental request data.');
        if (active) {
          setError('');
          setRequests((response.data as RentalRequest[]).filter((request) => request.status === 'PENDING'));
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);

  const decideRequest = async (id: string, decision: 'accept' | 'reject') => {
    setProcessingId(id);
    setActionError('');
    try {
      await api.patch(`/rental-requests/${id}/${decision}`);
      setRequests((current) => current.filter((request) => request.id !== id));
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setProcessingId(null);
    }
  };
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view rental requests.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Pending Applications</h1>
        <p className="text-gray-600 dark:text-gray-300">Review rental requests submitted for your properties</p>
        {!loading && !loadError && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{requests.length} pending request(s)</p>}
      </div>
      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading rental requests…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : (
        <>
          {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{actionError}</p></Card>}
          {requests.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">There are no pending rental requests for your properties.</Card>
          ) : requests.map((request) => {
            const title = request.property?.title || request.listing?.title;
            const location = [request.property?.area, request.property?.city].filter(Boolean).join(', ');
            const amount = request.property?.price ?? request.listing?.rent;
            return (
              <Card key={request.id} className="p-5">
                <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700"><User size={20} /></div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{request.tenant?.fullName || 'Applicant details unavailable'}</h2>
                        {request.tenant?.email && <p className="text-sm text-gray-600 dark:text-gray-400">{request.tenant.email}</p>}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><MapPin size={14} />{title || `Property ${request.id}`}{location && ` · ${location}`}</p>
                      {amount !== undefined && <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Home size={14} />Rent listed at PKR {amount.toLocaleString()}</p>}
                      {request.moveInDate && <p className="text-gray-600 dark:text-gray-400">Requested move-in: {new Date(request.moveInDate).toLocaleDateString()}</p>}
                      {request.durationMonths != null && <p className="text-gray-600 dark:text-gray-400">Requested duration: {request.durationMonths} months</p>}
                      {request.occupants != null && <p className="text-gray-600 dark:text-gray-400">Occupants: {request.occupants}</p>}
                      {request.message && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{request.message}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-row gap-2 md:flex-col">
                    <button disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'accept')} className="inline-flex items-center justify-center gap-2 rounded bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50">
                      <CheckCircle size={14} />{processingId === request.id ? 'Saving…' : 'Accept'}
                    </button>
                    <button disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'reject')} className="inline-flex items-center justify-center gap-2 rounded bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">
                      {processingId === request.id ? <Clock size={14} /> : <XCircle size={14} />}{processingId === request.id ? 'Saving…' : 'Reject'}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default PendingApplications;
