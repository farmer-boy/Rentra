import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Inbox, LifeBuoy, Send, ShieldAlert, Undo2 } from 'lucide-react';
import { toApiError } from '../../api/api-error';
import { supportAPI, type SupportTicket, type SupportTicketStatus } from '../../api/support';

const statuses: SupportTicketStatus[] = ['NEW', 'OPEN', 'PENDING', 'RESOLVED'];
const cannedReplies = [
  { label: 'Need more information', text: 'Please share any missing details or clear evidence so we can look into this request.' },
  { label: 'Verification received', text: 'We have received your verification information. Our team will review it and update you here.' },
  { label: 'Issue resolved', text: 'We have addressed this issue. Please reply here if you still need help.' },
];
const prettyStatus = (status: string) => ({
  NEW: 'Not opened',
  OPEN: 'Opened · waiting for admin',
  PENDING: 'Waiting for user',
  RESOLVED: 'Resolved',
}[status] ?? status);

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<SupportTicketStatus | ''>('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await supportAPI.adminList(filter);
      setTickets(data);
      setSelected((current) => current ? data.find((ticket) => ticket.id === current.id) ?? null : null);
      setError('');
    } catch (cause) {
      setError(toApiError(cause).message || 'Support tickets could not be loaded.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadTickets();
    const timer = window.setInterval(() => void loadTickets(true), 10_000);
    return () => window.clearInterval(timer);
  }, [loadTickets]);

  const replaceTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setTickets((previous) => previous.map((item) => item.id === ticket.id ? ticket : item));
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    setNotice('');
    setError('');
    try {
      const opened = await supportAPI.get(ticket.id);
      replaceTicket(opened);
      if (opened.status !== ticket.status) {
        await loadTickets();
        setSelected(opened);
      }
    } catch (cause) {
      setError(toApiError(cause).message || 'Ticket details could not be opened.');
    }
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await supportAPI.adminReply(selected.id, reply.trim());
      setReply('');
      replaceTicket(updated);
      setNotice('Reply sent. The user received an in-app notification.');
      await loadTickets();
      setSelected(updated);
    } catch (cause) {
      setError(toApiError(cause).message || 'The reply could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: SupportTicketStatus) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const updated = await supportAPI.setStatus(selected.id, status);
      replaceTicket(updated);
      await loadTickets();
      setSelected(updated);
      setNotice(status === 'RESOLVED' ? 'Ticket resolved; the user was notified.' : `Ticket status changed to ${prettyStatus(status)}.`);
    } catch (cause) {
      setError(toApiError(cause).message || 'Ticket status could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const issueWarning = async () => {
    if (!selected) return;
    const reason = window.prompt('Warning reason to send to the user:');
    if (!reason?.trim()) return;
    setSaving(true);
    setError('');
    try {
      await supportAPI.warn(selected.id, reason.trim());
      setNotice('Warning recorded and sent to the user.');
      await loadTickets();
    } catch (cause) {
      setError(toApiError(cause).message || 'Warning could not be issued.');
    } finally {
      setSaving(false);
    }
  };

  const restrictSupport = async () => {
    if (!selected) return;
    const reason = window.prompt('Reason for temporarily restricting support access:');
    if (!reason?.trim()) return;
    const daysText = window.prompt('Restriction duration in days (1–30):', '3');
    if (!daysText) return;
    const days = Number(daysText);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      setError('Enter a whole number from 1 to 30 days.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await supportAPI.restrict(selected.userId, reason.trim(), days);
      setNotice(`Support access restricted for ${days} days.`);
      await loadTickets();
    } catch (cause) {
      setError(toApiError(cause).message || 'Support access could not be restricted.');
    } finally {
      setSaving(false);
    }
  };

  const restoreSupport = async () => {
    if (!selected) return;
    const reason = window.prompt('Reason for restoring support access:');
    if (!reason?.trim()) return;
    setSaving(true);
    setError('');
    try {
      await supportAPI.restore(selected.userId, reason.trim());
      setNotice('Support access restored.');
      await loadTickets();
    } catch (cause) {
      setError(toApiError(cause).message || 'Support access could not be restored.');
    } finally {
      setSaving(false);
    }
  };

  const closeOpenTicket = () => {
    setSelected(null);
    setReply('');
    setError('');
    setNotice('');
  };

  const blocked = Boolean(selected?.user.supportBlockedUntil && new Date(selected.user.supportBlockedUntil) > new Date());

  return (
    <section className="space-y-5 text-text">
      <header className="flex items-start gap-3">
        <span className="mt-1 rounded-xl bg-primary-soft p-2 text-primary"><LifeBuoy size={22} /></span>
        <div><h1 className="text-2xl font-bold">Support Tickets</h1><p className="mt-1 text-sm text-text-muted">Respond to users inside their tickets and manage support access with an audit trail.</p></div>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="grid min-h-[36rem] gap-4 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <button type="button" onClick={closeOpenTicket} aria-label="Close open ticket" title="Close open ticket" className="inline-flex items-center gap-2 rounded-md text-left font-semibold text-text transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <Inbox size={18} />
              <span>Inbox</span>
            </button>
            <select value={filter} onChange={(event) => setFilter(event.target.value as SupportTicketStatus | '')} aria-label="Filter support tickets" className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
              <option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{prettyStatus(status)}</option>)}
            </select>
          </div>
          {loading ? <p className="p-4 text-sm text-text-muted">Loading tickets…</p> : tickets.length === 0 ? <p className="p-4 text-sm text-text-muted">No support tickets.</p> : (
            <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button type="button" onClick={() => void openTicket(ticket)} className={`w-full p-4 text-left transition hover:bg-surface2 ${selected?.id === ticket.id ? 'bg-surface2' : ''} ${ticket.status === 'NEW' ? 'font-semibold' : 'font-normal'}`}>
                    <span className="flex items-center justify-between gap-2"><span className={`truncate text-sm ${ticket.status === 'NEW' ? 'font-bold' : 'font-medium'}`}>{ticket.subject}</span><span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold">{prettyStatus(ticket.status)}</span></span>
                    <span className="mt-1 block text-xs text-text-muted">{ticket.user.fullName} · {ticket.category.toLowerCase()}</span>
                    <span className="mt-1 block truncate text-xs text-text-muted">{ticket.messages.at(-1)?.body ?? 'No messages'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[36rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {!selected ? <div className="m-auto p-6 text-center text-text-muted"><p className="text-sm">Select a ticket to view and reply.</p></div> : <>
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-semibold">{selected.subject}</h2><p className="mt-1 text-xs text-text-muted">{selected.user.fullName} · {selected.user.email} · {selected.category.toLowerCase()}</p></div>
                <select value={selected.status} disabled={saving} onChange={(event) => void changeStatus(event.target.value as SupportTicketStatus)} aria-label="Ticket status" className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                  {statuses.map((status) => <option key={status} value={status}>{prettyStatus(status)}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={saving} onClick={() => void issueWarning()} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50"><ShieldAlert size={14} />Warn user ({selected.user.supportWarningCount ?? 0})</button>
                {blocked ? <button type="button" disabled={saving} onClick={() => void restoreSupport()} className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 px-2.5 py-1.5 text-xs font-semibold text-green-800 disabled:opacity-50"><Undo2 size={14} />Restore support</button> : <button type="button" disabled={saving} onClick={() => void restrictSupport()} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"><Ban size={14} />Restrict 1–30 days</button>}
                {blocked && <span className="self-center text-xs text-red-700">Restricted until {new Date(selected.user.supportBlockedUntil!).toLocaleString()}</span>}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {selected.messages.map((message) => {
                const fromAdmin = message.sender.roles.includes('ADMIN');
                return <article key={message.id} className={`max-w-[88%] rounded-xl p-3 text-sm ${fromAdmin ? 'ml-auto bg-primary text-primary-contrast' : 'bg-surface2'}`}>
                  <p className="mb-1 text-[10px] font-semibold opacity-75">{fromAdmin ? 'Rentra Support' : message.sender.fullName} · {new Date(message.createdAt).toLocaleString()}</p>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </article>;
              })}
            </div>
            <form onSubmit={(event) => void sendReply(event)} className="space-y-2 border-t border-border p-3">
              <select aria-label="Insert a canned reply" defaultValue="" onChange={(event) => { const found = cannedReplies.find((item) => item.label === event.target.value); if (found) setReply(found.text); event.target.value = ''; }} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                <option value="">Canned reply…</option>{cannedReplies.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
              </select>
              <div className="flex gap-2">
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} required rows={2} placeholder="Reply in this ticket…" className="min-w-0 flex-1 resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
                <button type="submit" disabled={saving || !reply.trim()} className="self-end rounded-lg bg-primary p-2 text-primary-contrast disabled:opacity-50" aria-label="Send support reply"><Send size={18} /></button>
              </div>
              {selected.status === 'RESOLVED' && <p className="text-xs text-text-muted"><CheckCircle2 className="mr-1 inline" size={13} />Replying will reopen the ticket.</p>}
            </form>
          </>}</div>
      </div>
    </section>
  );
}
