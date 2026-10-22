import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Home, MapPin, User, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { rentalRequestsAPI } from '../../api/rentalRequests';
import { useAuthStore } from '../../store/authStore';

interface RentalRequest {
  id: string;
  status: string;
  createdAt: string;
  moveInDate?: string | null;
  durationMonths?: number | null;
  occupants?: number;
  message?: string | null;
  landlordId?: string;
  propertyId?: string;
  tenant?: { fullName?: string; email?: string };
  property?: { title?: string; area?: string; city?: string; price?: number; securityDeposit?: number };
  listing?: { title?: string; rent?: number; deposit?: number };
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Rental requests could not be loaded. Please try again.';

const PendingApplications = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'PENDING');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    setLoadedUserId(null);
    setError('');
    rentalRequestsAPI.received<RentalRequest>()
      .then((requests) => {
        if (!Array.isArray(requests)) throw new Error('The server returned invalid rental request data.');
        if (active) {
          setError('');
          setRequests(requests.filter((request) => !request.landlordId || request.landlordId === user.id));
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [reload, user?.id]);

  const decideRequest = async (id: string, decision: 'accept' | 'reject') => {
    const confirmation = decision === 'accept'
      ? 'Accept this rental request? The backend will create the agreement using the request terms.'
      : 'Reject this rental request? The tenant will be notified by the backend.';
    if (!window.confirm(confirmation)) return;
    setProcessingId(id);
    setActionError('');
    try {
      const result = decision === 'accept'
        ? await rentalRequestsAPI.accept<RentalRequest>(id)
        : await rentalRequestsAPI.reject<RentalRequest>(id);
      const returnedStatus = result && typeof result === 'object' && 'status' in result
        ? String(result.status)
        : decision === 'accept' ? 'ACCEPTED' : 'REJECTED';
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status: returnedStatus } : request));
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setProcessingId(null);
    }
  };
  const visibleRequests = requests.filter((request) => statusFilter === 'ALL' || request.status === statusFilter);
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view rental requests.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 ">Pending Applications</h1>
        <p className="text-gray-600 ">Review rental requests submitted for your properties and track their server-reported status.</p>
        {!loading && !loadError && <p className="mt-2 text-sm text-gray-500 ">{requests.filter((request) => request.status === 'PENDING').length} pending request(s)</p>}
      </div>
      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 ">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 ">Loading rental requests…</p></Card>
      ) : loadError ? (
        <Card className="flex items-center justify-between gap-3 p-5"><p role="alert" className="text-sm text-red-700 ">{loadError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card>
      ) : (
        <>
          {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-700 ">{actionError}</p></Card>}
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ALL'].map((status) => <button type="button" key={status} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === status ? 'bg-emerald-600 text-primary-contrast' : 'border bg-surface '}`}>{status === 'ALL' ? 'All statuses' : status}</button>)}
          </div>
          {visibleRequests.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600 ">{statusFilter === 'PENDING' ? 'There are no pending rental requests for your properties.' : 'No requests match this status.'}</Card>
          ) : visibleRequests.map((request) => {
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
                        <h2 className="text-lg font-semibold text-gray-900 ">{request.tenant?.fullName || 'Applicant details unavailable'}</h2>
                        {request.tenant?.email && <p className="text-sm text-gray-600 ">{request.tenant.email}</p>}
                        <p className="mt-1 text-xs text-gray-500 ">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-gray-700 "><MapPin size={14} />{title || `Property ${request.id}`}{location && ` · ${location}`}</p>
                      {amount !== undefined && <p className="flex items-center gap-2 text-gray-700 "><Home size={14} />Rent listed at PKR {amount.toLocaleString()}</p>}
                      {request.moveInDate && <p className="text-gray-600 ">Requested move-in: {new Date(request.moveInDate).toLocaleDateString()}</p>}
                      {request.durationMonths != null && <p className="text-gray-600 ">Requested duration: {request.durationMonths} months</p>}
                      {request.occupants != null && <p className="text-gray-600 ">Occupants: {request.occupants}</p>}
                      {(request.property?.securityDeposit ?? request.listing?.deposit) != null && <p className="text-gray-600 ">Listed deposit: PKR {(request.property?.securityDeposit ?? request.listing?.deposit)?.toLocaleString()}</p>}
                      {request.message && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700  ">{request.message}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{request.status.replaceAll('_', ' ')}</span>
                    {request.status === 'PENDING' ? <div className="flex flex-row gap-2 md:flex-col">
                      <button disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'accept')} className="inline-flex items-center justify-center gap-2 rounded bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50">
                        <CheckCircle size={14} />{processingId === request.id ? 'Saving…' : 'Accept'}
                      </button>
                      <button disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'reject')} className="inline-flex items-center justify-center gap-2 rounded bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">
                        {processingId === request.id ? <Clock size={14} /> : <XCircle size={14} />}{processingId === request.id ? 'Saving…' : 'Reject'}
                      </button>
                    </div> : request.status === 'ACCEPTED' ? <a href="/dashboard/property-agreements" className="text-xs font-semibold text-emerald-700">View agreements</a> : null}
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
