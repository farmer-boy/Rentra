import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import { FileText } from 'lucide-react';
import { adminAPI, type AdminListingRecord } from '../../api/admin';

const AdminListings = () => {
  const [page, setPage] = useState(1);
  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'listings', { page, limit: 20 }],
    queryFn: () => adminAPI.getAllListings({ page, limit: 20 }),
  });
  const listings: AdminListingRecord[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const error = isError ? 'Could not load listings. Please try again later.' : '';

  const published = listings.filter((listing) => listing.status === 'PUBLISHED').length;
  const pending = listings.filter((listing) => listing.status === 'PENDING').length;
  const unpublished = listings.filter((listing) => listing.status === 'UNPUBLISHED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100  text-green-800 ';
      case 'UNPUBLISHED':
      case 'REMOVED':
        return 'bg-red-100  text-red-800 ';
      case 'PENDING':
        return 'bg-yellow-100  text-yellow-800 ';
      default:
        return 'bg-gray-100  text-gray-800 ';
    }
  };

  const statValue = (value: number) => isFetching || error ? '—' : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900  mb-2">All Listings</h1>
        <p className="text-gray-600 ">Manage and moderate all property listings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Published on page</p>
          <p className="text-3xl font-bold text-green-600  mt-2">{statValue(published)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Pending on page</p>
          <p className="text-3xl font-bold text-yellow-600  mt-2">{statValue(pending)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Unpublished on page</p>
          <p className="text-3xl font-bold text-red-600  mt-2">{statValue(unpublished)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600  text-sm">Total</p>
          <p className="text-3xl font-bold text-blue-600  mt-2">{statValue(total)}</p>
        </Card>
      </div>

      <Card className="p-6">
        {error && <p role="alert" className="mb-4 text-sm text-red-600 ">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 ">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 ">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 ">Landlord</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 ">City</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 ">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 ">Status</th>
              </tr>
            </thead>
            <tbody>
              {isFetching && listings.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading listings...</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">{error ? 'Listing records are unavailable.' : 'No listings found.'}</td></tr>
              ) : listings.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-100  hover:bg-gray-50  transition">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 ">{listing.title}</p>
                        <p className="text-xs text-gray-500 ">
                          {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'Date unavailable'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 ">{listing.landlord.fullName}</td>
                  <td className="py-3 px-4 text-gray-700 ">{listing.city || '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 ">
                    {Number.isFinite(Number(listing.rent)) ? `Rs ${Number(listing.rent).toLocaleString()}` : '—'}
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
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 ">
            Page {page} of {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 "
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 "
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminListings;
