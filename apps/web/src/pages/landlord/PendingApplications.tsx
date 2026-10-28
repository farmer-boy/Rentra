import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, CheckCircle, Clock, Home, Mail, MapPin, MessageCircle, Phone, ShieldCheck, User, X, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { rentalRequestsAPI } from '../../api/rentalRequests';
import { messagesAPI } from '../../api/messages';
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
  tenant?: { id: string; fullName?: string; email?: string; emailVerifiedAt?: string | null; phoneVerifiedAt?: string | null; trustScore?: number | null; verificationSubmissions?: { status: string; reviewedAt?: string | null }[] };
  property?: { id?: string; title?: string; area?: string; city?: string; price?: number; securityDeposit?: number; images?: { url: string; altText?: string | null }[] };
  listing?: { id?: string; title?: string; rent?: number; deposit?: number; photos?: string[] };
}

interface TenantReviewProfile {
  request: { status: string; moveInDate?: string | null; durationMonths?: number | null; occupants: number; message?: string | null; createdAt: string; property?: { title: string; city?: string | null; area?: string | null; price: number; image?: { url: string; altText?: string | null } | null } | null };
  tenant: {
    id: string; fullName: string; email: string; emailVerified: boolean; emailVerifiedAt?: string | null;
    phoneVerified: boolean; phoneVerifiedAt?: string | null;
    identityVerification: { status: string; submittedAt?: string | null; reviewedAt?: string | null };
    profile?: { bio?: string | null; avatarUrl?: string | null; city?: string | null; country?: string | null } | null;
    profileCompletion: number; memberSince: string; trustScore: number | null; completedRentals: number;
    completedRentalHistory: { id: string; type: string; propertyTitle: string; area?: string | null; city?: string | null; startDate: string; endDate: string }[];
    publishedReviews: { count: number; averageRating: number | null };
  };
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Rental requests could not be loaded. Please try again.';

const PendingApplications = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'PENDING');
  const [reload, setReload] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<TenantReviewProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [informationRequestId, setInformationRequestId] = useState<string | null>(null);
  const [informationMessage, setInformationMessage] = useState('');

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

  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (!requestId || !loadedUserId) return;
    document.getElementById(`rental-request-${requestId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loadedUserId, searchParams]);

  const decideRequest = async (id: string, decision: 'accept' | 'reject') => {
    const confirmation = decision === 'accept'
      ? 'Accept this rental request? The backend will create the agreement using the request terms.'
      : 'Reject this rental request?';
    if (!window.confirm(confirmation)) return;
    setProcessingId(id);
    setActionError('');
    try {
      const result = decision === 'accept'
        ? await rentalRequestsAPI.accept<RentalRequest>(id)
        : await rentalRequestsAPI.reject<RentalRequest>(id, { reason: rejectionReason.trim() || undefined });
      const returnedStatus = result && typeof result === 'object' && 'status' in result
        ? String(result.status)
        : decision === 'accept' ? 'ACCEPTED' : 'REJECTED';
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status: returnedStatus } : request));
      setRejectingId(null);
      setRejectionReason('');
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setProcessingId(null);
    }
  };
  const viewTenantProfile = async (requestId: string) => {
    setSelectedProfile(null);
    setProfileError('');
    setProfileLoading(true);
    try {
      setSelectedProfile(await rentalRequestsAPI.reviewProfile<TenantReviewProfile>(requestId));
    } catch (cause) {
      setProfileError(errorMessage(cause));
    } finally {
      setProfileLoading(false);
    }
  };
  const messageTenant = async (request: RentalRequest) => {
    if (!request.tenant?.id) return;
    setActionError('');
    setProcessingId(request.id);
    try {
      const propertyId = request.propertyId || request.property?.id;
      const conversation = await messagesAPI.getOrCreateConversation(
        request.tenant.id,
        propertyId ? undefined : request.listing?.id,
        propertyId,
      );
      navigate(`/dashboard/messages?conversationId=${encodeURIComponent(conversation.id)}`);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setProcessingId(null);
    }
  };
  const requestMoreInformation = async (requestId: string) => {
    if (!informationMessage.trim()) return;
    setProcessingId(requestId);
    setActionError('');
    try {
      await rentalRequestsAPI.requestInformation(requestId, { message: informationMessage.trim() });
      setInformationRequestId(null);
      setInformationMessage('');
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
        <p className="mt-1 text-xs text-gray-500">Identity verification marked pending or unavailable is shown for review and does not automatically reject an application.</p>
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
            const identityStatus = request.tenant?.verificationSubmissions?.[0]?.status === 'APPROVED' ? 'VERIFIED' : request.tenant?.verificationSubmissions?.[0]?.status ?? 'NOT_STARTED';
            const propertyImage = request.property?.images?.[0]?.url || request.listing?.photos?.[0];
            return (
              <Card key={request.id} id={`rental-request-${request.id}`} className="p-5">
                <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {propertyImage ? <img src={propertyImage} alt={title ? `${title} property` : 'Property'} className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700"><User size={20} /></div>}
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 ">{request.tenant?.fullName || 'Applicant details unavailable'}</h2>
                        {request.tenant?.email && <p className="text-sm text-gray-600 ">{request.tenant.email}</p>}
                        <p className="mt-1 text-xs text-gray-500 ">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><Mail size={12} />Email {request.tenant?.emailVerifiedAt ? 'verified' : 'not verified'}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><Phone size={12} />Phone {request.tenant?.phoneVerifiedAt ? 'verified' : 'not verified'}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><ShieldCheck size={12} />Identity {identityStatus.toLowerCase().replaceAll('_', ' ')}</span>
                          {request.tenant?.trustScore != null && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">Trust {request.tenant.trustScore}/100</span>}
                        </div>
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
                    <button type="button" onClick={() => void viewTenantProfile(request.id)} className="text-xs font-semibold text-emerald-700 hover:underline">View tenant profile</button>
                    <button type="button" disabled={processingId !== null} onClick={() => void messageTenant(request)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 disabled:opacity-50"><MessageCircle size={14} />Message tenant</button>
                    {request.status === 'PENDING' ? <div className="flex flex-row gap-2 md:flex-col">
                      <button disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'accept')} className="inline-flex items-center justify-center gap-2 rounded bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50">
                        <CheckCircle size={14} />{processingId === request.id ? 'Saving…' : 'Accept'}
                      </button>
                      <button disabled={processingId !== null} onClick={() => { setRejectingId(rejectingId === request.id ? null : request.id); setRejectionReason(''); }} className="inline-flex items-center justify-center gap-2 rounded bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">
                        {processingId === request.id ? <Clock size={14} /> : <XCircle size={14} />}{processingId === request.id ? 'Saving…' : 'Reject'}
                      </button>
                      <button type="button" disabled={processingId !== null} onClick={() => { setInformationRequestId(informationRequestId === request.id ? null : request.id); setInformationMessage(''); }} className="rounded border px-3 py-2 text-xs font-semibold disabled:opacity-50">Request more information</button>
                    </div> : request.status === 'ACCEPTED' ? <a href="/dashboard/property-agreements" className="text-xs font-semibold text-emerald-700">View agreements</a> : null}
                  </div>
                </div>
                {rejectingId === request.id && <div className="mt-4 grid gap-2 rounded-lg bg-red-50 p-3"><label htmlFor={`reject-reason-${request.id}`} className="text-xs font-semibold text-gray-700">Optional rejection reason</label><textarea id={`reject-reason-${request.id}`} maxLength={1000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="min-h-20 rounded border bg-white p-2 text-sm" placeholder="Share a brief reason with the tenant" /><button type="button" disabled={processingId !== null} onClick={() => void decideRequest(request.id, 'reject')} className="justify-self-end rounded bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirm rejection</button></div>}
                {informationRequestId === request.id && <div className="mt-4 grid gap-2 rounded-lg bg-blue-50 p-3"><label htmlFor={`request-info-${request.id}`} className="text-xs font-semibold text-gray-700">What information do you need?</label><textarea id={`request-info-${request.id}`} maxLength={2000} value={informationMessage} onChange={(event) => setInformationMessage(event.target.value)} className="min-h-20 rounded border bg-white p-2 text-sm" placeholder="Ask for information relevant to this rental request" /><button type="button" disabled={processingId !== null || !informationMessage.trim()} onClick={() => void requestMoreInformation(request.id)} className="justify-self-end rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Send request</button></div>}
              </Card>
            );
          })}
        </>
      )}
              {(profileLoading || profileError || selectedProfile) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelectedProfile(null); setProfileError(''); } }}><section role="dialog" aria-modal="true" aria-label="Tenant profile review" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><header className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Tenant profile review</h2><button type="button" onClick={() => { setSelectedProfile(null); setProfileError(''); }} aria-label="Close tenant profile" className="rounded-lg p-2 hover:bg-gray-100"><X size={18} /></button></header>{profileLoading ? <p role="status" className="py-8 text-center text-sm text-gray-600">Loading tenant review information…</p> : profileError ? <div><p role="alert" className="text-sm text-red-700">{profileError}</p><p className="mt-2 text-xs text-gray-500">Tenant details could not be loaded. No verification status has been inferred.</p></div> : selectedProfile && <div className="space-y-5"><div className="flex items-center gap-3">{selectedProfile.tenant.profile?.avatarUrl ? <img src={selectedProfile.tenant.profile.avatarUrl} alt="Tenant profile" className="h-14 w-14 rounded-full object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-100"><User /></div>}<div><h3 className="text-lg font-semibold">{selectedProfile.tenant.fullName}</h3><p className="text-sm text-gray-600">{selectedProfile.tenant.email}</p><p className="text-xs text-gray-500">Member since {new Date(selectedProfile.tenant.memberSince).toLocaleDateString()}</p></div></div><div className="grid gap-3 sm:grid-cols-2"><Card className="p-3"><p className="text-xs text-gray-500">Profile completion</p><p className="text-lg font-bold">{selectedProfile.tenant.profileCompletion}%</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Trust score</p><p className="text-lg font-bold">{selectedProfile.tenant.trustScore == null ? 'Unavailable' : `${selectedProfile.tenant.trustScore}/100`}</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Email verification</p><p className="font-semibold">{selectedProfile.tenant.emailVerified ? `Verified ${selectedProfile.tenant.emailVerifiedAt ? `· ${new Date(selectedProfile.tenant.emailVerifiedAt).toLocaleDateString()}` : ''}` : 'Not verified'}</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Phone verification</p><p className="font-semibold">{selectedProfile.tenant.phoneVerified ? `Verified ${selectedProfile.tenant.phoneVerifiedAt ? `· ${new Date(selectedProfile.tenant.phoneVerifiedAt).toLocaleDateString()}` : ''}` : 'Not verified'}</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Identity verification</p><p className="inline-flex items-center gap-1 font-semibold"><BadgeCheck size={15} />{selectedProfile.tenant.identityVerification.status.replaceAll('_', ' ')}{selectedProfile.tenant.identityVerification.reviewedAt ? ` · ${new Date(selectedProfile.tenant.identityVerification.reviewedAt).toLocaleDateString()}` : ''}</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Completed rentals</p><p className="text-lg font-bold">{selectedProfile.tenant.completedRentals}</p></Card><Card className="p-3"><p className="text-xs text-gray-500">Published reviews written</p><p className="font-semibold">{selectedProfile.tenant.publishedReviews.count ? `${selectedProfile.tenant.publishedReviews.count} · avg ${selectedProfile.tenant.publishedReviews.averageRating?.toFixed(1)}/5` : 'No published reviews'}</p></Card></div>{selectedProfile.tenant.completedRentalHistory.length > 0 && <Card className="p-4"><h4 className="text-sm font-semibold">Recent rental history</h4><ul className="mt-2 divide-y">{selectedProfile.tenant.completedRentalHistory.map((rental) => <li key={`${rental.type}-${rental.id}`} className="py-2 text-sm"><span className="font-medium">{rental.propertyTitle}</span><span className="block text-xs text-gray-500">{[rental.area, rental.city].filter(Boolean).join(', ') || 'Location unavailable'} · {new Date(rental.startDate).toLocaleDateString()} – {new Date(rental.endDate).toLocaleDateString()}</span></li>)}</ul></Card>}{selectedProfile.tenant.profile?.bio && <Card className="p-4"><h4 className="text-sm font-semibold">About</h4><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{selectedProfile.tenant.profile.bio}</p></Card>}<Card className="p-4"><h4 className="text-sm font-semibold">Rental request</h4>{selectedProfile.request.property && <div className="my-2 flex items-center gap-3">{selectedProfile.request.property.image?.url && <img src={selectedProfile.request.property.image.url} alt={selectedProfile.request.property.image.altText || selectedProfile.request.property.title} className="h-14 w-20 rounded object-cover" />}<div><p className="font-semibold">{selectedProfile.request.property.title}</p><p className="text-xs text-gray-500">{[selectedProfile.request.property.area, selectedProfile.request.property.city].filter(Boolean).join(', ')} · PKR {selectedProfile.request.property.price.toLocaleString()}</p></div></div>}<p className="mt-1 text-sm">Status: {selectedProfile.request.status.replaceAll('_', ' ')}</p><p className="text-sm">Move-in: {selectedProfile.request.moveInDate ? new Date(selectedProfile.request.moveInDate).toLocaleDateString() : 'Not provided'}</p><p className="text-sm">Duration: {selectedProfile.request.durationMonths ? `${selectedProfile.request.durationMonths} months` : 'Not provided'} · Occupants: {selectedProfile.request.occupants}</p><p className="mt-2 whitespace-pre-wrap text-sm">{selectedProfile.request.message || 'No message provided.'}</p></Card><p className="text-xs text-gray-500">Identity documents and full identity numbers are never shown here. Missing verification information is not treated as proof of fraud.</p></div>}</section></div>}
    </div>
  );
};

export default PendingApplications;
