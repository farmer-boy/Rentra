import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Users, UserCheck, Ban, Shield, Mail, Phone } from 'lucide-react';
import { adminAPI } from '../../api/admin';
import { useLocation } from 'react-router-dom';

const AdminAllUsers = () => {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const location = useLocation();
  const role = location.pathname.endsWith('/tenants') ? 'TENANT' : location.pathname.endsWith('/landlords') ? 'LANDLORD' : '';
  const routeStatus = location.pathname.endsWith('/banned') ? 'SUSPENDED' : '';
  const verificationStatus = location.pathname.endsWith('/verified') ? 'APPROVED' : '';

  const filters = {
      page,
      limit: 20,
      ...(search && { search }),
      ...((routeStatus || query) && { status: routeStatus || query }),
      ...(role && { role }),
      ...(verificationStatus && { verificationStatus }),
  };
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminAPI.getAllUsers(filters),
  });
  const moderationMutation = useMutation({
    mutationFn: ({ id, reason, suspended }: { id: string; reason: string; suspended: boolean }) =>
      suspended ? adminAPI.activateUser(id, reason) : adminAPI.suspendUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const loading = usersQuery.isFetching;
  const error = usersQuery.isError
    ? 'Could not load users. Please try again later.'
    : moderationMutation.isError
      ? 'The moderation action could not be completed.'
      : '';

  const moderateUser = (user: (typeof users)[number]) => {
    const reason = window.prompt(user.isSuspended ? 'Reason for reinstating this user:' : 'Reason for suspending this user:');
    if (!reason?.trim()) return;
    moderationMutation.mutate({ id: user.id, reason, suspended: user.isSuspended });
  };

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
  const tenants = users.filter((user) => user.roles?.includes('TENANT')).length;
  const landlords = users.filter((user) => user.roles?.includes('LANDLORD')).length;
  const suspended = users.filter((user) => user.isSuspended).length;
  const statValue = (value: number) => loading || error ? '—' : value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Users</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform users and permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-4 text-center">
          <Users size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{statValue(total)}</p>
        </Card>
        <Card className="p-4 text-center">
          <UserCheck size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Tenants on page</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statValue(tenants)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Shield size={24} className="mx-auto mb-2 text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Landlords on page</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{statValue(landlords)}</p>
        </Card>
        <Card className="p-4 text-center">
          <Ban size={24} className="mx-auto mb-2 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Suspended on page</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{statValue(suspended)}</p>
        </Card>
      </div>

      <Card className="p-6">
        {error && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <form
          className="mb-4 flex flex-col sm:flex-row gap-2"
          onSubmit={(event) => { event.preventDefault(); setPage(1); }}
        >
          <input
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone or ID"
          />
          <select
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            value={routeStatus || query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            aria-label="Filter users by account status"
          >
            <option value="">All account statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" type="submit">Search</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Contact verification</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">{error ? 'User records are unavailable.' : 'No users found.'}</td></tr>
              ) : users.map((user) => {
                const roles = user.roles ?? [];
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Email {user.emailVerifiedAt ? '✓' : '—'} · Phone {user.phoneVerifiedAt ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs font-semibold"
                        onClick={() => void moderateUser(user)}
                      >
                        {user.isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Page {page}; showing {users.length} of {total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button>
            <button type="button" disabled={page * 20 >= total || loading} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAllUsers;
