import { useEffect, useState } from 'react';
import { Home, ShieldAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Listing {
  id: string;
  title: string;
  area?: string;
  city?: string;
  rent: number;
  rentalDuration: string;
  status: string;
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
    ?? (error as { message?: string })?.message
    ?? 'Your properties could not be loaded. Please try again.';

const LandlordFakeDetector = () => {
  const user = useAuthStore((state) => state.user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };

    api.get('/listings/landlord/my-listings')
      .then((response) => {
        if (!Array.isArray(response.data?.data)) throw new Error('The server returned invalid property data.');
        if (active) {
          setError('');
          setListings(response.data.data as Listing[]);
        }
      })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoadedUserId(user.id); });

    return () => { active = false; };
  }, [user?.id]);
  const loading = !!user?.id && loadedUserId !== user.id;
  const loadError = user?.id ? error : 'Your account details are unavailable. Sign in again to view your properties.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Fake Detector</h1>
        <p className="text-gray-600 dark:text-gray-300">Fraud scan results for your listings</p>
      </div>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="mt-1 shrink-0 text-amber-600" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Live fraud scanning and scan-result APIs are not available. Listing scores, risk labels, verification claims, and scan actions cannot be shown as current results.
          </p>
        </div>
      </Card>
      {!user?.id ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : loading ? (
        <Card className="p-5"><p className="text-sm text-gray-600 dark:text-gray-300">Loading your properties…</p></Card>
      ) : loadError ? (
        <Card className="p-5"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p></Card>
      ) : listings.length === 0 ? (
        <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">No properties are currently available to list, and no scan results are available.</Card>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Your properties</h2>
          {listings.map((listing) => (
            <Card key={listing.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Home size={18} className="text-gray-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{listing.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{[listing.area, listing.city].filter(Boolean).join(', ') || 'Location not provided'}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">PKR {listing.rent.toLocaleString()} · {listing.rentalDuration.replace(/_/g, ' ')}</p>
                <p className="text-gray-500 dark:text-gray-400">{listing.status.replace(/_/g, ' ')} · No scan data</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordFakeDetector;
