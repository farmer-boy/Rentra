import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import { agreementsAPI } from '../../api/agreements';
import { listingsAPI } from '../../api/listings';
import { useAuthStore } from '../../store/authStore';
import TerminateAgreementButton from '../../components/agreements/TerminateAgreementButton';
import ProposeAgreementTermsButton from '../../components/agreements/ProposeAgreementTermsButton';
import AgreementAmendmentsPanel from '../../components/agreements/AgreementAmendmentsPanel';
import TerminationRequestsPanel from '../../components/agreements/TerminationRequestsPanel';
import type { AgreementAmendment } from '../../api/types';
import type { AgreementTerminationRequest } from '../../api/agreements';
import AgreementPresencePulse from '../../components/agreements/AgreementPresencePulse';
import AgreementTerminationDisputeButton from '../../components/agreements/AgreementTerminationDisputeButton';
import AgreementDisputeEligibilityStatus from '../../components/agreements/AgreementDisputeEligibilityStatus';

interface Agreement {
  id: string;
  landlordId: string;
  tenant?: { fullName?: string; email?: string; phone?: string };
  listingId: string;
  monthlyRent: number;
  securityDeposit: number | null;
  startDate: string;
  endDate: string | null;
  pdfUrl?: string | null;
  status: string;
  terminationReason?: string | null;
  amendments?: AgreementAmendment[];
  tenantId: string;
  terminationRequests?: AgreementTerminationRequest[];
  disputeEligibility?: { tenant: number; landlord: number; eligible: boolean };
  property?: { title: string; propertyType: string; city?: string | null; area?: string | null; address?: string } | null;
  listing?: { title: string; type: string; city?: string; area?: string; address?: string } | null;
}

interface Listing {
  id: string;
  title: string;
}

const responseList = <T,>(value: unknown, label: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`The server returned invalid ${label} data.`);
  return value as T[];
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Agreements could not be loaded. Please try again.';

const LandlordAgreements = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'ALL');

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    Promise.all([agreementsAPI.mine(), listingsAPI.getMyListings<Listing>()])
      .then(([agreements, receivedListings]) => {
        const receivedAgreements = responseList<Agreement>(agreements, 'agreement');
        if (active) {
          setError('');
          setAgreements(receivedAgreements.filter((agreement) => agreement.landlordId === user.id));
          setListings(receivedListings);
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const records = await agreementsAPI.mine<Agreement>();
        if (active) setAgreements(records.filter((agreement) => agreement.landlordId === user.id));
      } catch { /* Keep the last loaded agreement data while a poll is unavailable. */ }
      finally { refreshing = false; }
    };
    const timer = window.setInterval(() => void refresh(), 6000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user?.id]);

  const ownedAgreements = agreements;
  const listingNames = new Map(listings.map((listing) => [listing.id, listing.title]));
  const niceType = (value?: string | null) => value?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Property type unavailable';
  const activeCount = ownedAgreements.filter((agreement) => agreement.status === 'ACTIVE').length;
  const pendingCount = ownedAgreements.filter((agreement) => agreement.status === 'PENDING').length;
  const visibleAgreements = statusFilter === 'ALL'
    ? ownedAgreements
    : ownedAgreements.filter((agreement) => agreement.status === statusFilter);
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view agreements.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 ">Agreements</h1>
        <p className="text-gray-600 ">Lease agreements recorded for your properties</p>
      </div>

      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 ">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 ">Loading agreements…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 ">{loadError}</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 ">Active</p><p className="mt-2 text-3xl font-bold text-green-600">{activeCount}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 ">Pending</p><p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 ">Total agreements</p><p className="mt-2 text-3xl font-bold text-gray-900 ">{ownedAgreements.length}</p></Card>
          </div>

          <label className="block max-w-xs text-xs font-semibold">Agreement status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm">
              <option value="ALL">All statuses</option>
              {['ACTIVE', 'PENDING', 'DRAFT', 'TERMINATED', 'EXPIRED', 'CANCELLED', 'ENDED'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </label>

          {visibleAgreements.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600 ">No agreements are recorded for your properties.</Card>
          ) : (
            <div className="space-y-4">
              {visibleAgreements.map((agreement) => (
                <Card key={agreement.id} className="p-5">
                  <AgreementPresencePulse agreementId={agreement.id} />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <FileText size={20} className="mt-1 text-blue-500" />
                      <div>
                        <h2 className="font-semibold text-gray-900 ">Tenant: {agreement.tenant?.fullName || 'Details unavailable'}</h2>
                        {(agreement.tenant?.email || agreement.tenant?.phone) && <p className="text-sm text-gray-500 ">{[agreement.tenant.email, agreement.tenant.phone].filter(Boolean).join(' · ')}</p>}
                        <p className="mt-2 font-semibold text-gray-900">{agreement.property?.title || agreement.listing?.title || listingNames.get(agreement.listingId) || 'Property name unavailable'}</p>
                        <p className="text-sm text-gray-600">{niceType(agreement.property?.propertyType || agreement.listing?.type)}{[agreement.property?.area || agreement.listing?.area, agreement.property?.city || agreement.listing?.city].filter(Boolean).length ? ` · ${[agreement.property?.area || agreement.listing?.area, agreement.property?.city || agreement.listing?.city].filter(Boolean).join(', ')}` : ''}</p>
                        {(agreement.property?.address || agreement.listing?.address) && <p className="text-xs text-gray-500">{agreement.property?.address || agreement.listing?.address}</p>}
                        <p className="mt-1 text-[10px] text-gray-500">Agreement ref: {agreement.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${agreement.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : agreement.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                      {agreement.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div><p className="text-gray-500 ">Start date</p><p className="font-medium text-gray-900 ">{new Date(agreement.startDate).toLocaleDateString()}</p></div>
                    <div><p className="text-gray-500 ">End date</p><p className="font-medium text-gray-900 ">{agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'Not specified'}</p></div>
                    <div><p className="text-gray-500 ">Monthly rent</p><p className="font-medium text-gray-900 ">PKR {agreement.monthlyRent.toLocaleString()}</p></div>
                    <div><p className="text-gray-500 ">Security deposit</p><p className="font-medium text-gray-900 ">PKR {(agreement.securityDeposit ?? 0).toLocaleString()}</p></div>
                  </div>
                  <AgreementAmendmentsPanel agreementId={agreement.id} amendments={agreement.amendments} onUpdated={(updated) => setAgreements((current) => current.map((item) => item.id === updated.id ? { ...item, monthlyRent: updated.monthlyRent, securityDeposit: updated.securityDeposit, amendments: updated.amendments } : item))} />
                  <AgreementDisputeEligibilityStatus counts={agreement.disputeEligibility} />
                  {agreement.disputeEligibility?.eligible && <AgreementTerminationDisputeButton agreementId={agreement.id} />}
                  {agreement.terminationReason && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <span className="font-semibold">Cancellation reason:</span> {agreement.terminationReason}
                    </p>
                  )}
                  {agreement.status === 'ACTIVE' && (
                    <>
                    {!agreement.terminationRequests?.some((request) => request.status === 'PENDING') && (
                    <TerminateAgreementButton
                      agreementId={agreement.id}
                      onRequested={(request) => setAgreements((current) => current.map((item) => item.id === agreement.id ? { ...item, terminationRequests: [request, ...(item.terminationRequests ?? [])] } : item))}
                    />
                    )}
                    {!agreement.amendments?.some((amendment) => amendment.status === 'PENDING') && (
                      <ProposeAgreementTermsButton agreementId={agreement.id} monthlyRent={agreement.monthlyRent} securityDeposit={agreement.securityDeposit} onProposed={(amendment) => setAgreements((current) => current.map((item) => item.id === agreement.id ? { ...item, amendments: [amendment, ...(item.amendments ?? [])] } : item))} />
                    )}
                    </>
                  )}
                  {!!agreement.terminationRequests?.length && <TerminationRequestsPanel agreementId={agreement.id} tenantId={agreement.tenantId} currentUserId={user?.id} requests={agreement.terminationRequests} onUpdated={(updated) => setAgreements((current) => current.map((item) => item.id === updated.id ? { ...item, status: updated.status, terminationReason: updated.terminationReason, terminationRequests: updated.terminationRequests, disputeEligibility: updated.disputeEligibility } : item))} />}
                  {agreement.pdfUrl && <a href={agreement.pdfUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">View agreement document</a>}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandlordAgreements;
