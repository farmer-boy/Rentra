import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { agreementsAPI } from '../../api/agreements';
import { maintenanceAPI, type MaintenanceCategory, type MaintenanceRequest } from '../../api/maintenance';
import { useAuthStore } from '../../store/authStore';

interface ActiveAgreement {
  id: string;
  propertyId?: string | null;
  status: string;
  property?: { title?: string; city?: string | null; area?: string | null } | null;
}

const categories: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'OTHER'];

export default function MaintenanceRequests() {
  const user = useAuthStore((state) => state.user);
  const [agreements, setAgreements] = useState<ActiveAgreement[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [agreementId, setAgreementId] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('OTHER');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const [records, maintenanceRecords] = await Promise.all([
        agreementsAPI.mine<ActiveAgreement>(),
        maintenanceAPI.mine(),
      ]);
      setAgreements(records.filter((record) => record.status === 'ACTIVE' && record.propertyId));
      setRequests(maintenanceRecords);
    } catch (cause) {
      setError((cause as { message?: string })?.message ?? 'Maintenance records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agreementId) return;
    setSaving(true);
    try {
      const created = await maintenanceAPI.create({ agreementId, category, priority, subject: subject.trim(), description: description.trim() });
      setRequests((current) => [created, ...current]);
      setSubject('');
      setDescription('');
      setPriority('NORMAL');
      toast.success('Maintenance request sent to your landlord.');
    } catch (cause) {
      toast.error((cause as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Request could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  const statusClass = (status: string) => status === 'RESOLVED' ? 'bg-green-100 text-green-800' : status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-extrabold tracking-tight text-text">Maintenance Requests</h1><p className="mt-1 text-[13px] text-text-muted">Report a repair issue for one of your active rentals.</p></div>
      {error && <Card className="flex items-start gap-2 p-4 text-sm text-red-700"><AlertCircle size={18} />{error}<button type="button" onClick={() => void load()} className="ml-auto underline">Retry</button></Card>}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-text">Submit a request</h2>
        {loading ? <p className="text-sm text-text-muted">Loading your active rentals…</p> : agreements.length === 0 ? <p className="text-sm text-text-muted">An active rental with a linked property is required to submit a maintenance request.</p> : (
          <form onSubmit={(event) => void submit(event)} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold">Rental<select required value={agreementId} onChange={(event) => setAgreementId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"><option value="">Select a rental</option>{agreements.map((agreement) => <option key={agreement.id} value={agreement.id}>{agreement.property?.title ?? 'Rental'}{agreement.property?.city ? ` · ${agreement.property.city}` : ''}</option>)}</select></label>
            <label className="text-xs font-semibold">Category<select value={category} onChange={(event) => setCategory(event.target.value as MaintenanceCategory)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">{categories.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
            <label className="text-xs font-semibold">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as 'NORMAL' | 'URGENT')} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"><option value="NORMAL">Normal</option><option value="URGENT">Urgent</option></select></label>
            <label className="text-xs font-semibold">Subject<input required minLength={4} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm" /></label>
            <label className="text-xs font-semibold sm:col-span-2">Description<textarea required minLength={10} maxLength={2000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm" /></label>
            <div className="sm:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast disabled:opacity-60">{saving ? 'Sending…' : 'Send request'}</button></div>
          </form>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-text">Your requests</h2>
        {loading ? <p className="py-5 text-sm text-text-muted">Loading requests…</p> : requests.length === 0 ? <div className="py-6 text-center text-sm text-text-muted"><Wrench className="mx-auto mb-2" size={22} />You have not submitted a maintenance request.</div> : <div className="space-y-3">{requests.map((request) => <article key={request.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-text">{request.subject}</h3><p className="mt-1 text-xs text-text-muted">{request.property.title} · {request.category.replaceAll('_', ' ')} · {request.priority.toLowerCase()} priority</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(request.status)}`}>{request.status.replaceAll('_', ' ')}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">{request.description}</p><p className="mt-3 text-xs text-text-muted">Submitted {new Date(request.createdAt).toLocaleString()}</p></article>)}</div>}
      </Card>
    </div>
  );
}
