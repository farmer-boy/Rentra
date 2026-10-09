import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { FileText } from 'lucide-react';
import { adminAPI } from '../../api/admin';

interface AdminListing {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  city?: string;
  rent?: number;
  landlord?: { id: string; fullName?: string; email?: string };
}

function normalizeListings(response: unknown): AdminListing[] {
  if (Array.isArray(response)) return response as AdminListing[];
  if (response && typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
    return response.items as AdminListing[];
  }
  return [];
}

const AdminListings = () => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminAPI.getAllListings().then((response) => {
      if (active) setListings(normalizeListings(response));
    }).catch(() => {
      if (active) setError('Could not load listings. Please try again later.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const published = listings.filter((listing) => listing.status === 'PUBLISHED').length;
  const pending = listings.filter((listing) => listing.status === 'PENDING').length;
  const unpublished = listings.filter((listing) => listing.status === 'UNPUBLISHED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'UNPUBLISHED':
      case 'REMOVED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const statValue = (value: number) => loading || error ? '—' : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Listings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and moderate all property listings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Published</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statValue(published)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{statValue(pending)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Unpublished</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{statValue(unpublished)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{statValue(listings.length)}</p>
        </Card>
      </div>

      <Card className="p-6">
        {error && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Landlord</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">City</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading listings...</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">{error ? 'Listing records are unavailable.' : 'No listings found.'}</td></tr>
              ) : listings.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{listing.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'Date unavailable'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{listing.landlord?.fullName || listing.landlord?.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{listing.city || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {typeof listing.rent === 'number' ? `Rs ${listing.rent.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
                      {listing.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminListings;
