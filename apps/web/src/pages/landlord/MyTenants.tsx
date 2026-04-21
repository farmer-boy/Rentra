import { useState } from 'react';
import { Mail, Phone, Home, MessageCircle, XCircle, Star } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  rentPaid: number;
  rating: number;
  joinDate: string;
  status: 'active' | 'notice' | 'late';
}

const MyTenants = () => {
  const [tenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1 234-567-8900',
      property: 'Modern 2BR Apartment Downtown',
      rentPaid: 2500,
      rating: 4.8,
      joinDate: '2023-06-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1 234-567-8901',
      property: 'Spacious 3BR House with Backyard',
      rentPaid: 3200,
      rating: 4.5,
      joinDate: '2023-08-20',
      status: 'active',
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+1 234-567-8902',
      property: 'Spacious 3BR House with Backyard',
      rentPaid: 3200,
      rating: 3.9,
      joinDate: '2024-01-10',
      status: 'late',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'notice':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Tenants</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your current tenants and track their information</p>
      </div>

      <div className="space-y-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="p-4">
            <div className="flex items-start justify-between">
              {/* Tenant Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{tenant.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Home size={14} className="mr-2" />
                      {tenant.property}
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tenant.status)}`}>
                      {tenant.status === 'active' ? 'Active' : tenant.status === 'notice' ? 'Notice Given' : 'Rent Late'}
                    </span>
                  </div>
                </div>

                {/* Contact & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <div className="flex items-center text-gray-900 dark:text-white mt-1">
                      <Mail size={14} className="mr-2 text-blue-500" />
                      <a href={`mailto:${tenant.email}`} className="hover:underline">{tenant.email}</a>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Phone</p>
                    <div className="flex items-center text-gray-900 dark:text-white mt-1">
                      <Phone size={14} className="mr-2 text-green-500" />
                      {tenant.phone}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Monthly Rent</p>
                    <p className="text-gray-900 dark:text-white font-semibold mt-1">${tenant.rentPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Tenant Rating</p>
                    <div className="flex items-center mt-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-gray-900 dark:text-white font-semibold">{tenant.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Join Date */}
                <p className="text-xs text-gray-500 dark:text-gray-500">Joined {new Date(tenant.joinDate).toLocaleDateString()}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs font-semibold whitespace-nowrap">
                  <MessageCircle size={14} />
                  Message
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition text-xs font-semibold whitespace-nowrap">
                  View Details
                </button>
                {tenant.status !== 'active' && (
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition text-xs font-semibold whitespace-nowrap">
                    <XCircle size={14} />
                    Terminate
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyTenants;
