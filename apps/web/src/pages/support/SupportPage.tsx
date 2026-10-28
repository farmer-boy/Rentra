import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LifeBuoy, Send, Ticket as TicketIcon } from 'lucide-react';
import { supportAPI, type MySupportTickets, type SupportTicket, type SupportTicketCategory } from '../../api/support';
import { toApiError } from '../../api/api-error';

const categories: { value: SupportTicketCategory; label: string }[] = [
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'VERIFICATION', label: 'Verification' },
  { value: 'LISTING', label: 'Property listing' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'SAFETY', label: 'Safety or abuse' },
  { value: 'OTHER', label: 'Other' },
];

const statusLabel = (status: string) => ({
  NEW: 'Not opened',
  OPEN: 'Opened · waiting for support',
  PENDING: 'Waiting for your reply',
  RESOLVED: 'Resolved',
}[status] ?? status);

export default function SupportPage() {
  const location = useLocation();
  const requestedTicketId = new URLSearchParams(location.search).get('ticketId');
  const [overview, setOverview] = useState<MySupportTickets | null>(null);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [category, setCategory] = useState<SupportTicketCategory>('ACCOUNT');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await supportAPI.mine();
      setOverview(data);
      setSelected((current) => current ? data.items.find((ticket) => ticket.id === current.id) ?? null : null);
      setError('');
    } catch (cause) {
      setError(toApiError(cause).message || 'Support tickets could not be loaded.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
    const timer = window.setInterval(() => void loadTickets(true), 10_000);
    return () => window.clearInterval(timer);
  }, [loadTickets]);

  useEffect(() => {
    if (!requestedTicketId || !overview) return;
    const ticket = overview.items.find((item) => item.id === requestedTicketId);
    if (ticket) setSelected(ticket);
  }, [overview, requestedTicketId]);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const created = await supportAPI.create({ category, subject, message });
      setSubject('');
      setMessage('');
      setSelected(created);
      setNotice('Your support ticket has been submitted.');
      await loadTickets();
      setSelected(created);
    } catch (cause) {
      setError(toApiError(cause).message || 'The support ticket could not be submitted.');
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await supportAPI.reply(selected.id, reply.trim());
      setReply('');
      setSelected(updated);
      await loadTickets();
      setSelected(updated);
    } catch (cause) {
      setError(toApiError(cause).message || 'Your reply could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  const blocked = Boolean(overview?.supportBlockedUntil && new Date(overview.supportBlockedUntil) > new Date());
  const canReply = selected?.status === 'PENDING' || (
    selected?.status === 'RESOLVED' && selected.messages.at(-1)?.sender.roles.includes('ADMIN')
  );

  return (
    <section className="space-y-5 text-text">
      <header className="flex items-start gap-3">
        <span className="mt-1 rounded-xl bg-primary-soft p-2 text-primary"><LifeBuoy size={22} /></span>
        <div>
          <h1 className="text-2xl font-bold">Help &amp; Support</h1>
          <p className="mt-1 text-sm text-text-muted">Contact Rentra through a support ticket. Replies stay in this ticket, not in direct chat.</p>
        </div>
      </header>

      {overview?.supportWarningCount ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Your account has {overview.supportWarningCount} support conduct {overview.supportWarningCount === 1 ? 'warning' : 'warnings'}.
        </p>
      ) : null}
      {blocked && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Ticket creation and replies are temporarily restricted until {new Date(overview!.supportBlockedUntil!).toLocaleString()}.
        </p>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          {!blocked && (
            <form onSubmit={(event) => void submitTicket(event)} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <h2 className="font-semibold">Create a support ticket</h2>
              <p className="text-xs text-text-muted">Up to 3 open tickets and 3 new tickets in any 24-hour period.</p>
              <label className="block text-xs font-medium">Reason
                <select value={category} onChange={(event) => setCategory(event.target.value as SupportTicketCategory)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium">Subject
                <input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={4} maxLength={120} required className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="What do you need help with?" />
              </label>
              <label className="block text-xs font-medium">Message
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={5000} required rows={4} className="mt-1 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Share the details so our team can help." />
              </label>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">
                <Send size={15} />{saving ? 'Submitting…' : 'Submit ticket'}
              </button>
            </form>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-semibold">Your tickets</h2>
              <button type="button" onClick={() => void loadTickets()} className="text-xs font-semibold text-primary">Refresh</button>
            </div>
            {loading ? <p className="p-4 text-sm text-text-muted">Loading tickets…</p> : !overview?.items.length ? (
              <p className="p-4 text-sm text-text-muted">No support tickets yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {overview.items.map((ticket) => (
                  <li key={ticket.id}>
                    <button type="button" onClick={() => { setSelected(ticket); setNotice(''); }} className={`w-full p-4 text-left transition hover:bg-surface2 ${selected?.id === ticket.id ? 'bg-surface2' : ''}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{ticket.subject}</span>
                        <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold">{statusLabel(ticket.status)}</span>
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">{ticket.category.toLowerCase()} · {ticket.messages.length} {ticket.messages.length === 1 ? 'message' : 'messages'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {!selected ? (
            <div className="m-auto p-6 text-center text-text-muted"><TicketIcon className="mx-auto mb-2" /><p className="text-sm">Choose a ticket to view its conversation.</p></div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">{selected.subject}</h2>
                <p className="mt-1 text-xs text-text-muted">{selected.category.toLowerCase()} · {statusLabel(selected.status)}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selected.messages.map((item) => {
                  const fromSupport = item.sender.roles.includes('ADMIN');
                  return (
                    <article key={item.id} className={`max-w-[88%] rounded-xl p-3 text-sm ${fromSupport ? 'bg-surface2' : 'ml-auto bg-primary text-primary-contrast'}`}>
                      <p className="mb-1 text-[10px] font-semibold opacity-75">{fromSupport ? 'Rentra Support' : 'You'} · {new Date(item.createdAt).toLocaleString()}</p>
                      <p className="whitespace-pre-wrap break-words">{item.body}</p>
                    </article>
                  );
                })}
              </div>
              {!blocked && canReply ? (
                <form onSubmit={(event) => void submitReply(event)} className="flex gap-2 border-t border-border p-3">
                  <input value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} required placeholder="Reply to this ticket…" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
                  <button disabled={saving || !reply.trim()} className="rounded-lg bg-primary p-2 text-primary-contrast disabled:opacity-50" aria-label="Send reply"><Send size={18} /></button>
                </form>
              ) : !blocked ? (
                <p className="border-t border-border p-3 text-center text-xs text-text-muted">Aap is ticket par ek reply de chuke hain. Mazeed reply ke liye Rentra Support ke jawab ka intezar karein.</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
