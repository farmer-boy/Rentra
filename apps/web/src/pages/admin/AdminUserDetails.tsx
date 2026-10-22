import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, CalendarDays, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI, type AdminUserDetails as UserDetails } from '../../api/admin';
import Card from '../../components/ui/Card';
import { toApiError } from '../../api/api-error';

const noticeReasons = ['Verification Required', 'Documents Needed', 'Listing Issue', 'Warning', 'Important Alert', 'Other'];

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' && value.includes('T')) return new Date(value).toLocaleString();
  return String(value);
}

function RecordSection<T extends { id: string }>({ title, rows, children }: {
  title: string;
  rows: T[];
  children: (row: T) => React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-bold text-text">{title}</h2>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold text-text-muted">{rows.length}</span>
      </div>
      {rows.length ? <div className="divide-y divide-border">{rows.map((row) => <div key={row.id} className="px-4 py-3 text-sm">{children(row)}</div>)}</div> : <p className="px-4 py-5 text-sm text-text-muted">No records.</p>}
    </Card>
  );
}

export default function AdminUserDetails() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeReason, setNoticeReason] = useState(noticeReasons[0]);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeError, setNoticeError] = useState('');
  const [noticeSent, setNoticeSent] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);
  const userQuery = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminAPI.getUserById(id),
    enabled: Boolean(id),
  });
  const user = userQuery.data as UserDetails | undefined;

  const sendNotice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !noticeMessage.trim()) return;
    setSendingNotice(true);
    setNoticeError('');
    setNoticeSent(false);
    try {
      await adminAPI.sendUserNotice(user.id, noticeReason, noticeMessage.trim());
      setNoticeMessage('');
      setNoticeOpen(false);
      setNoticeSent(true);
    } catch (cause) {
      setNoticeError(toApiError(cause).message || 'Notice could not be sent.');
    } finally {
      setSendingNotice(false);
    }
  };

  return (
    <section className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted hover:bg-surface2">
        <ArrowLeft size={16} /> Back to users
      </button>

      {userQuery.isPending ? <p className="text-sm text-text-muted">Loading user details...</p> : userQuery.isError ? (
        <Card className="space-y-3">
          <p role="alert" className="text-sm text-red-600">User details could not be loaded.</p>
          <button type="button" onClick={() => void userQuery.refetch()} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast">Try again</button>
        </Card>
      ) : user && (
        <>
          <header>
            <h1 className="text-2xl font-bold text-text">{user.fullName || 'User details'}</h1>
            <p className="mt-1 text-sm text-text-muted">Account profile and activity</p>
          </header>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Account</p>
                <div className="mt-3 space-y-2 text-sm text-text">
                  <p className="flex items-center gap-2"><Mail size={15} className="text-text-muted" />{user.email}</p>
                  <p className="flex items-center gap-2"><Phone size={15} className="text-text-muted" />{user.phone || 'Phone not provided'}</p>
                  <p className="flex items-center gap-2"><CalendarDays size={15} className="text-text-muted" />Joined {display(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(user.roles ?? []).map((role) => <span key={role} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{role}</span>)}
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{user.isSuspended ? 'Suspended' : 'Active'}</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <p className="flex items-center gap-2 text-sm text-text-muted"><BadgeCheck size={16} />Email {user.emailVerifiedAt ? 'verified' : 'not verified'}</p>
              <p className="flex items-center gap-2 text-sm text-text-muted"><BadgeCheck size={16} />Phone {user.phoneVerifiedAt ? 'verified' : 'not verified'}</p>
              <p className="flex items-center gap-2 text-sm text-text-muted"><ShieldCheck size={16} />Trust score {user.trustScore ?? '—'}</p>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => { setNoticeOpen((open) => !open); setNoticeError(''); setNoticeSent(false); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:opacity-90">
                  <Send size={15} /> Send Notice
                </button>
                {noticeSent && <p role="status" className="text-sm text-green-700">Notice sent to {user.fullName || user.email}.</p>}
              </div>
              {noticeError && <p role="alert" className="mt-3 text-sm text-red-600">{noticeError}</p>}
              {noticeOpen && <form onSubmit={(event) => void sendNotice(event)} className="mt-4 grid gap-3 rounded-xl bg-surface2 p-4 sm:grid-cols-[minmax(12rem,0.35fr)_minmax(0,1fr)]">
                <label className="space-y-1 text-sm font-medium text-text">
                  <span>Reason</span>
                  <select value={noticeReason} onChange={(event) => setNoticeReason(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    {noticeReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-text">
                  <span>Message</span>
                  <textarea value={noticeMessage} onChange={(event) => setNoticeMessage(event.target.value)} maxLength={2000} required rows={3} placeholder="Write a notice for this user…" className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
                </label>
                <div className="flex gap-2 sm:col-start-2">
                  <button type="submit" disabled={sendingNotice || !noticeMessage.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">{sendingNotice ? 'Sending…' : 'Send notice'}</button>
                  <button type="button" onClick={() => setNoticeOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface">Cancel</button>
                </div>
              </form>}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RecordSection title="Properties" rows={user.properties ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.title)}</span><span className="text-text-muted">{display(row.city)} · {display(row.status)} · verification {display(row.verificationStatus)} · Rs. {display(row.price)}</span></div>}
            </RecordSection>
            <RecordSection title="Listings" rows={user.listings ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.title)}</span><span className="text-text-muted">{display(row.city)} · {display(row.status)} · Rs. {display(row.rent)}</span></div>}
            </RecordSection>
            <RecordSection title="Bookings" rows={user.bookings ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.status)}</span><span className="text-text-muted">{display(row.startDate)} – {display(row.endDate)} · {display(row.totalAmount)}</span></div>}
            </RecordSection>
            <RecordSection title="Verification submissions" rows={user.verificationSubmissions ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.kind)}</span><span className="text-text-muted">{display(row.status)} · submitted {display(row.submittedAt)} · reviewed {display(row.reviewedAt)}</span></div>}
            </RecordSection>
            <RecordSection title="Payments" rows={user.payments ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.status)}</span><span className="text-text-muted">{display(row.currency)} {display(row.amount)} · {display(row.createdAt)}</span></div>}
            </RecordSection>
            <RecordSection title="Reports" rows={user.reports ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.status)}</span><span className="text-text-muted">{display(row.reason)} · {display(row.createdAt)}</span></div>}
            </RecordSection>
            <RecordSection title="Rental requests" rows={user.rentalsAsTenant ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.listing?.title)}</span><span className="text-text-muted">{display(row.status)} · {display(row.createdAt)}</span></div>}
            </RecordSection>
            <RecordSection title="Agreements" rows={user.tenantAgreements ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.status)}</span><span className="text-text-muted">{display(row.startDate)} – {display(row.endDate)} · Rs. {display(row.monthlyRent)}/month</span></div>}
            </RecordSection>
            <RecordSection title="Reviews" rows={user.reviews ?? []}>
              {(row) => <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-text">{display(row.reviewType)} · {display(row.rating)}/5</span><span className="text-text-muted">{display(row.createdAt)}</span></div>}
            </RecordSection>
          </div>
        </>
      )}
    </section>
  );
}
