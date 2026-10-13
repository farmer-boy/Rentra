import { useCallback, useEffect, useState } from 'react';
import { verificationAPI } from '../../api/verification';
import Card from '../../components/ui/Card';

interface VerificationItem {
  id: string;
  kind: string;
  status: string;
  submittedAt: string;
  user?: { id: string; fullName: string };
  property?: { id: string; title: string };
}

interface VerificationDetail extends VerificationItem {
  details?: unknown;
  evidenceUrls?: string[];
  reviewNotes?: string | null;
  user?: VerificationItem['user'] & {
    email?: string;
    phone?: string;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
  };
}

export default function VerificationQueue() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [selected, setSelected] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await verificationAPI.pending<VerificationItem>());
    } catch {
      setError('Verification submissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  const selectSubmission = async (id: string) => {
    setError('');
    try {
      setSelected(await verificationAPI.adminDetail<VerificationDetail>(id));
    } catch {
      setError('Submission details could not be loaded.');
    }
  };

  const reviewSubmission = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    const reviewNotes = window.prompt(`Reason/notes for ${decision.toLowerCase()}:`);
    if (!reviewNotes?.trim()) return;
    try {
      await verificationAPI.review(selected.id, { decision, reviewNotes });
      setSelected(null);
      await loadQueue();
    } catch {
      setError('The verification decision could not be saved. The submission may already have been reviewed.');
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Queue</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Review submitted evidence. Property approval is determined by the verification workflow.
        </p>
      </header>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
        <Card className="p-0">
          {loading ? <p className="p-5 text-sm text-gray-500">Loading submissions...</p> : items.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No pending verification submissions.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void selectSubmission(item.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <span className="block font-semibold text-gray-900 dark:text-white">{item.kind} · {item.user?.fullName ?? item.property?.title ?? item.id}</span>
                    <span className="mt-1 block text-xs text-gray-500">{item.status} · {new Date(item.submittedAt).toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a submission to inspect its information and evidence.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{selected.kind} verification</h2>
                <p className="break-all text-xs text-gray-500">{selected.id}</p>
              </div>
              {selected.user && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-gray-500">Name</dt><dd>{selected.user.fullName}</dd></div>
                  <div><dt className="text-gray-500">Email</dt><dd>{selected.user.email ?? '—'}</dd></div>
                  <div><dt className="text-gray-500">Phone</dt><dd>{selected.user.phone ?? '—'}</dd></div>
                  <div><dt className="text-gray-500">Contact verified</dt><dd>Email {selected.user.emailVerifiedAt ? 'Yes' : 'No'} · Phone {selected.user.phoneVerifiedAt ? 'Yes' : 'No'}</dd></div>
                </dl>
              )}
              {selected.property && <p className="text-sm"><span className="text-gray-500">Property: </span>{selected.property.title}</p>}
              {selected.details !== undefined && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Submitted details</h3>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs whitespace-pre-wrap">{JSON.stringify(selected.details, null, 2)}</pre>
                </div>
              )}
              {!!selected.evidenceUrls?.length && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Evidence files</h3>
                  <ul className="space-y-1">{selected.evidenceUrls.map((url) => (
                    <li key={url}><a className="break-all text-sm text-blue-600 underline" href={url} target="_blank" rel="noreferrer">Open submitted evidence</a></li>
                  ))}</ul>
                </div>
              )}
              {selected.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button type="button" onClick={() => void reviewSubmission('APPROVED')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                  <button type="button" onClick={() => void reviewSubmission('REJECTED')} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Reject</button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
