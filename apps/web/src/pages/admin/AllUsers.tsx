import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Users, UserCheck, Ban, Shield, Mail, Phone } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: 'active' | 'suspended' | 'banned';
  verified: boolean;
  joinedDate: string;
  properties?: number;
}

const AdminAllUsers = () => {
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      phone: '+92 300 1234567',
      role: 'TENANT',
      status: 'active',
      verified: true,
      joinedDate: '2026-01-15',
    },
    {
      id: '2',
      name: 'Fatima Khan',
      email: 'fatima@example.com',
      phone: '+92 321 9876543',
      role: 'LANDLORD',
      status: 'active',
      verified: true,
      joinedDate: '2025-11-20',
      properties: 5,
    },
    {
      id: '3',
      name: 'Suspicious User',
      email: 'spam@example.com',
      phone: '+92 345 1111111',
      role: 'TENANT',
      status: 'banned',
      verified: false,
      joinedDate: '2026-03-10',
    },
  ]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'LANDLORD':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'TENANT':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'suspended':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'banned':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return '';
    }
  };

  const stats = {
    total: users.length,
    tenants: users.filter((u) => u.role === 'TENANT').length,
    landlords: users.filter((u) => u.role === 'LANDLORD').length,
    banned: users.filter((u) => u.status === 'banned').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Users</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform users and permissions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <Users size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <UserCheck size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Tenants</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.tenants}</p>
        </Card>
        <Card className="p-4 text-center">
          <Shield size={24} className="mx-auto mb-2 text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Landlords</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.landlords}</p>
        </Card>
        <Card className="p-4 text-center">
          <Ban size={24} className="mx-auto mb-2 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Banned</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.banned}</p>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Verified</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm">
                        <Mail size={14} />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm">
                        <Phone size={14} />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={user.verified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {user.verified ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">
                      View
                    </button>
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

export default AdminAllUsers;

