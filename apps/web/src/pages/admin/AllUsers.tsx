import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { Users, UserCheck, Ban, Shield, Mail, Phone } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import type { User as ApiUser } from '../../api/types';

type AdminUser = Pick<ApiUser, 'id' | 'email' | 'fullName' | 'phone' | 'roles' | 'role' | 'isVerified' | 'isSuspended' | 'createdAt'>;

function normalizeUsers(response: unknown): AdminUser[] {
  if (Array.isArray(response)) return response as AdminUser[];
  if (response && typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
    return response.items as AdminUser[];
  }
  return [];
}

const AdminAllUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminAPI.getAllUsers().then((response) => {
      if (active) setUsers(normalizeUsers(response));
    }).catch(() => {
      if (active) setError('Could not load users. Please try again later.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

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

  const getStatusColor = (suspended: boolean) => suspended
    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  const tenants = users.filter((user) => (user.roles ?? (user.role ? [user.role] : [])).includes('TENANT')).length;
  const landlords = users.filter((user) => (user.roles ?? (user.role ? [user.role] : [])).includes('LANDLORD')).length;
  const suspended = users.filter((user) => user.isSuspended).length;
  const statValue = (value: number) => loading || error ? '—' : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Users</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform users and permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <Users size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{statValue(users.length)}</p>
        </Card>
        <Card className="p-4 text-center">
          <UserCheck size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Tenants</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statValue(tenants)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Shield size={24} className="mx-auto mb-2 text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Landlords</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{statValue(landlords)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Ban size={24} className="mx-auto mb-2 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Suspended</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{statValue(suspended)}</p>
        </Card>
      </div>

      <Card className="p-6">
        {error && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">{error ? 'User records are unavailable.' : 'No users found.'}</td></tr>
              ) : users.map((user) => {
                const roles = user.roles ?? (user.role ? [user.role] : []);
                return (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4"><p className="font-medium text-gray-900 dark:text-white">{user.fullName || '—'}</p></td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm"><Mail size={14} />{user.email}</div>
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm"><Phone size={14} />{user.phone || '—'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {roles.length ? <div className="flex flex-wrap gap-1">{roles.map((role) => (
                        <span key={role} className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(role)}`}>{role}</span>
                      ))}</div> : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(Boolean(user.isSuspended))}`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={user.isVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {user.isVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAllUsers;
