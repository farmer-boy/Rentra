import { useState } from 'react';
import Card from '../../components/ui/Card';
import { FileText, Eye, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  landlord: string;
  city: string;
  price: number;
  status: 'active' | 'flagged' | 'pending' | 'rejected';
  reports: number;
  createdDate: string;
}

const AdminListings = () => {
  const [listings] = useState<Listing[]>([
    {
      id: '1',
      title: 'Modern 2BR Apartment Downtown',
      landlord: 'John Smith',
      city: 'Lahore',
      price: 2500,
      status: 'active',
      reports: 0,
      createdDate: '2026-04-10',
    },
    {
      id: '2',
      title: 'Luxury Villa with Pool',
      landlord: 'Ahmed Khan',
      city: 'Karachi',
      price: 8500,
      status: 'flagged',
      reports: 3,
      createdDate: '2026-04-12',
    },
    {
      id: '3',
      title: 'Studio Apartment',
      landlord: 'Sarah Johnson',
      city: 'Islamabad',
      price: 1500,
      status: 'pending',
      reports: 1,
      createdDate: '2026-04-15',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'flagged':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Listings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and moderate all property listings</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Active</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">1,234</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">47</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Flagged</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">23</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">1,304</p>
        </Card>
      </div>

      {/* Listings Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Landlord</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">City</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Reports</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{listing.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(listing.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{listing.landlord}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{listing.city}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Rs {listing.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {listing.reports > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-bold">
                        <AlertTriangle size={14} />
                        {listing.reports}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No reports</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button title="View" className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                        <Eye size={16} />
                      </button>
                      <button title="Delete" className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
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

