import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { maintenanceAPI, type MaintenanceRequest } from '../../api/maintenance';
import { useAuthStore } from '../../store/authStore';

const LandlordMaintenanceRequests = () => {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError('');
    try { setRequests(await maintenanceAPI.received()); }
    catch (cause) { setError((cause as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Maintenance requests could not be loaded.'); }
    finally { setLoadedUserId(user.id); }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (request: MaintenanceRequest, status: 'IN_PROGRESS' | 'RESOLVED') => {
    setSavingId(request.id);
    try {
      const updated = await maintenanceAPI.updateStatus(request.id, status);
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(status === 'RESOLVED' ? 'Request marked resolved.' : 'Request marked in progress.');
    } catch (cause) {
      toast.error((cause as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Status could not be updated.');
    } finally { setSavingId(null); }
  };

  const loading = !!user?.id && loadedUserId !== user.id;
  const statusClass = (status: string) => status === 'RESOLVED' ? 'bg-green-100 text-green-800' : status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

  return (
    <div className="space-y-6">
      <div><h1 className="mb-2 text-2xl font-bold text-gray-900">Maintenance Requests</h1><p className="text-gray-600">Tenant repair requests for your rentals</p></div>
      {error && <Card className="flex items-center gap-2 p-4 text-sm text-red-700"><AlertCircle size={18} />{error}<button type="button" onClick={() => void load()} className="ml-auto underline">Retry</button></Card>}
      <Card className="p-5">
        {loading ? <p className="py-5 text-sm text-gray-600">Loading requests…</p> : requests.length === 0 ? <div className="py-6 text-center text-sm text-gray-600"><Wrench className="mx-auto mb-2" size={22} />No tenant maintenance requests yet.</div> : <div className="space-y-3">{requests.map((request) => <article key={request.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">{request.subject}</h2><p className="mt-1 text-xs text-gray-600">{request.property.title} · {[request.property.area, request.property.city].filter(Boolean).join(', ')}</p><p className="mt-1 text-xs text-gray-600">From {request.tenant.fullName} · {request.category.replaceAll('_', ' ')} · {request.priority.toLowerCase()} priority</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(request.status)}`}>{request.status.replaceAll('_', ' ')}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{request.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-gray-500">Submitted {new Date(request.createdAt).toLocaleString()}</p>{request.status !== 'RESOLVED' && <div className="flex gap-2"><button type="button" disabled={savingId === request.id || request.status === 'IN_PROGRESS'} onClick={() => void changeStatus(request, 'IN_PROGRESS')} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50">In progress</button><button type="button" disabled={savingId === request.id} onClick={() => void changeStatus(request, 'RESOLVED')} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast disabled:opacity-50">{savingId === request.id ? 'Saving…' : 'Resolve'}</button></div>}</div></article>)}</div>}
      </Card>
    </div>
  );
};

export default LandlordMaintenanceRequests;
