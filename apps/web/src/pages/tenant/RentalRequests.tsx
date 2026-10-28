import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalRequestsAPI } from '../../api/rentalRequests';
import Card from '../../components/ui/Card';
import { toApiError } from '../../api/api-error';

interface RentalRequest {
  id: string;
  status: string;
  createdAt: string;
  moveInDate?: string | null;
  durationMonths?: number | null;
  message?: string | null;
  property?: { id?: string; title?: string; area?: string; city?: string; price?: number } | null;
  listing?: { id?: string; title?: string; area?: string; city?: string; rent?: number } | null;
  agreements?: Array<{ id: string; status: string; startDate: string; endDate?: string | null }>;
  informationThread?: Array<{ id: string; action: string; actorRole?: string | null; reason?: string | null; createdAt: string }>;
}

const getErrorMessage = (error: unknown) => toApiError(error).message;

export default function TenantRentalRequests() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await rentalRequestsAPI.mine<RentalRequest>();
      if (!Array.isArray(results)) throw new Error('Invalid rental-request response.');
      setRequests(results);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (!requestId || loading) return;
    document.getElementById(`rental-request-${requestId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, requests, searchParams]);

  const cancelRequest = async (id: string) => {
    setCancellingId(id);
    setActionError('');
    try {
      const request = await rentalRequestsAPI.cancel<RentalRequest>(id);
      setRequests((current) => current.map((item) => item.id === id ? request : item));
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setCancellingId(null);
    }
  };

  const replyToInformationRequest = async (id: string) => {
    if (!replyDraft.trim()) return;
    setSendingReplyId(id);
    setActionError('');
    try {
      await rentalRequestsAPI.respondToInformation(id, { message: replyDraft.trim() });
      setReplyDraft('');
      setActiveReplyId(null);
      await loadRequests();
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setSendingReplyId(null);
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
              return <Card key={request.id} id={`rental-request-${request.id}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{title}</h2>
                      {request.listing?.id && <Link to={`/dashboard/listings/${request.listing.id}`} className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline">View listing</Link>}
                    {location && <p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{location}</p>}
                    <p className="mt-2 text-sm text-gray-600">Sent {new Date(request.createdAt).toLocaleDateString()} · {request.status.replaceAll('_', ' ')}</p>
                    {request.moveInDate && <p className="mt-1 text-sm text-gray-500">Requested move-in: {new Date(request.moveInDate).toLocaleDateString()}</p>}
                    {request.durationMonths != null && <p className="mt-1 text-sm text-gray-500">Duration: {request.durationMonths} months</p>}
                    {request.message && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{request.message}</p>}
                    {request.agreements?.map((agreement) => (
                      <Link key={agreement.id} to="/dashboard/my-agreements" className="mt-3 inline-block rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
                        View {agreement.status.toLowerCase()} agreement
                      </Link>
                    ))}
                  </div>
                  {request.status === 'PENDING' && <button disabled={cancellingId !== null} onClick={() => void cancelRequest(request.id)} className="rounded border px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50">{cancellingId === request.id ? 'Cancelling…' : 'Cancel request'}</button>}
                </div>
                {!!request.informationThread?.length && <div className="mt-4 w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-sm font-bold text-blue-900">More information requested</h3>
                  <div className="mt-2 space-y-2">
                    {request.informationThread.map((item) => <div key={item.id} className="rounded-md border border-blue-100 bg-white p-3 text-sm">
                      <p className="font-semibold text-gray-800">{item.actorRole === 'TENANT' ? 'Your reply' : 'Landlord asked'}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-gray-800">{item.reason || 'Message text is unavailable.'}</p>
                      <p className="mt-1 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>)}
                  </div>
                  {request.status === 'PENDING' && request.informationThread.some((item) => item.action === 'RENTAL_REQUEST_INFORMATION_REQUESTED') && <div className="mt-3 space-y-2">
                    <label htmlFor={`information-reply-${request.id}`} className="block text-xs font-semibold text-blue-900">Reply to the landlord</label>
                    <textarea id={`information-reply-${request.id}`} value={activeReplyId === request.id ? replyDraft : ''} maxLength={2000} disabled={sendingReplyId !== null} onChange={(event) => { setActiveReplyId(request.id); setReplyDraft(event.target.value); }} className="min-h-20 w-full rounded border border-blue-200 bg-white p-2 text-sm disabled:opacity-60" placeholder="Write your response" />
                    <button type="button" disabled={sendingReplyId !== null || !replyDraft.trim() || activeReplyId !== request.id} onClick={() => void replyToInformationRequest(request.id)} className="rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{sendingReplyId === request.id ? 'Sending…' : 'Send reply'}</button>
                  </div>}
                </div>}
              </Card>;
            })}</div>}
    </div>
  );
}
