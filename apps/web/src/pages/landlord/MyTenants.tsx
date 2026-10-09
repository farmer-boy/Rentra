import { useEffect, useState } from 'react';
import { Home, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Agreement {
  id: string;
  landlordId: string;
  listingId: string;
  tenantId: string;
  tenant?: { fullName?: string; email?: string };
  rent: number;
  startDate: string;
  endDate: string | null;
  status: string;
}

interface Listing {
  id: string;
  title: string;
  area?: string;
  city?: string;
}

const responseList = <T,>(value: unknown, label: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`The server returned invalid ${label} data.`);
  return value as T[];
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Tenant information could not be loaded. Please try again.';

const MyTenants = () => {
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
          setAgreements(receivedAgreements.filter((agreement) => agreement.landlordId === user.id && agreement.status === 'ACTIVE'));
          setListings(receivedListings);
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view tenants.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">My Tenants</h1>
        <p className="text-gray-600 dark:text-gray-300">Tenants on your active agreements</p>
      </div>
      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading tenant records…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : agreements.length === 0 ? (
        <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">No tenants are recorded on your active agreements.</Card>
      ) : (
        <div className="space-y-4">
          {agreements.map((agreement) => {
            const listing = listingById.get(agreement.listingId);
            return (
              <Card key={agreement.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{agreement.tenant?.fullName || agreement.tenant?.email || 'Tenant details unavailable'}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Home size={14} />{listing ? `${listing.title}${listing.area || listing.city ? ` · ${[listing.area, listing.city].filter(Boolean).join(', ')}` : ''}` : 'Property details unavailable'}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Active agreement</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div><p className="text-gray-500 dark:text-gray-400">Email</p><p className="mt-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white">{agreement.tenant?.email ? <><Mail size={14} className="text-blue-500" /><a href={`mailto:${agreement.tenant.email}`} className="hover:underline">{agreement.tenant.email}</a></> : 'Not provided'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Monthly rent</p><p className="mt-1 font-semibold text-gray-900 dark:text-white">PKR {agreement.rent.toLocaleString()}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Agreement dates</p><p className="mt-1 font-medium text-gray-900 dark:text-white">{new Date(agreement.startDate).toLocaleDateString()} – {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'No end date set'}</p></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTenants;
