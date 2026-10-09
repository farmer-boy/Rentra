import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Agreement {
  id: string;
  landlordId: string;
  tenant?: { fullName?: string; email?: string };
  listingId: string;
  rent: number;
  startDate: string;
  endDate: string | null;
  pdfUrl?: string | null;
  status: string;
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
  const user = useAuthStore((state) => state.user);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    Promise.all([api.get('/agreements'), api.get('/listings/landlord/my-listings')])
      .then(([agreementResponse, listingResponse]) => {
        const receivedAgreements = responseList<Agreement>(agreementResponse.data?.data, 'agreement');
        const receivedListings = responseList<Listing>(listingResponse.data?.data, 'property');
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

  const ownedAgreements = agreements;
  const listingNames = new Map(listings.map((listing) => [listing.id, listing.title]));
  const activeCount = ownedAgreements.filter((agreement) => agreement.status === 'ACTIVE').length;
  const pendingCount = ownedAgreements.filter((agreement) => agreement.status === 'PENDING').length;
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view agreements.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Agreements</h1>
        <p className="text-gray-600 dark:text-gray-300">Lease agreements recorded for your properties</p>
      </div>

      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading agreements…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Active</p><p className="mt-2 text-3xl font-bold text-green-600">{activeCount}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Pending</p><p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p></Card>
            <Card className="p-4 text-center"><p className="text-sm text-gray-600 dark:text-gray-400">Total agreements</p><p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{ownedAgreements.length}</p></Card>
          </div>

          {ownedAgreements.length === 0 ? (
            <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">No agreements are recorded for your properties.</Card>
          ) : (
            <div className="space-y-4">
              {ownedAgreements.map((agreement) => (
                <Card key={agreement.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <FileText size={20} className="mt-1 text-blue-500" />
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">{agreement.tenant?.fullName || 'Tenant details unavailable'}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{listingNames.get(agreement.listingId) || 'Property details unavailable'}</p>
                        {agreement.tenant?.email && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{agreement.tenant.email}</p>}
                      </div>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${agreement.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : agreement.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                      {agreement.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div><p className="text-gray-500 dark:text-gray-400">Start date</p><p className="font-medium text-gray-900 dark:text-white">{new Date(agreement.startDate).toLocaleDateString()}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">End date</p><p className="font-medium text-gray-900 dark:text-white">{agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'Not specified'}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400">Rent</p><p className="font-medium text-gray-900 dark:text-white">PKR {agreement.rent.toLocaleString()}</p></div>
                  </div>
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
