import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { usersAPI } from '../../api/users';
import { verificationAPI } from '../../api/verification';
import { toApiError } from '../../api/api-error';
import type { CurrentUserProfile } from '../../api/users';
import { useAuthStore } from '../../store/authStore';

interface VerificationSubmission {
  id: string;
  kind: string;
  status: string;
  propertyId?: string | null;
  reviewNotes?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

interface PropertyVerification {
  id: string;
  title: string;
  verificationStatus: string;
}

interface VerificationOverview {
  submissions: VerificationSubmission[];
  properties: PropertyVerification[];
}

const normalizedUrls = (value: string) => value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
const statusClass = (status: string) => status === 'APPROVED'
  ? 'bg-green-100 text-green-800'
  : status === 'PENDING'
    ? 'bg-amber-100 text-amber-800'
    : status === 'REJECTED'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-700';

export default function LandlordVerification() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [overview, setOverview] = useState<VerificationOverview | null>(null);
  const [kind, setKind] = useState<'HOST' | 'IDENTITY'>('HOST');
  const [evidence, setEvidence] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setError('Sign in again to view verification status.');
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError('');
    Promise.all([usersAPI.getMe(), verificationAPI.mine()])
      .then(([currentProfile, status]) => {
        if (!active) return;
        setProfile(currentProfile);
        setOverview(status as VerificationOverview);
      })
      .catch((cause: unknown) => { if (active) setError(toApiError(cause).message || 'Verification status could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, user?.id]);

  const submitUserVerification = async () => {
    const urls = normalizedUrls(evidence);
    if (urls.length > 10 || urls.some((url) => {
      try { return new URL(url).protocol !== 'https:'; } catch { return true; }
    })) {
      setError('Evidence must contain at most 10 valid HTTPS links, one per line.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await verificationAPI.submitUser({ kind, evidenceUrls: urls });
      setNotice(`${kind === 'HOST' ? 'Host' : 'Identity'} verification was submitted for review.`);
      setEvidence('');
      setReload((value) => value + 1);
    } catch (cause) {
      setError(toApiError(cause).message || 'Verification could not be submitted.');
    } finally {
      setSaving(false);
    }
  };

  const submitProperty = async (propertyId: string) => {
    const urls = normalizedUrls(evidence);
    if (urls.length > 10 || urls.some((url) => {
      try { return new URL(url).protocol !== 'https:'; } catch { return true; }
    })) {
      setError('Evidence must contain at most 10 valid HTTPS links, one per line.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await verificationAPI.submitProperty(propertyId, { evidenceUrls: urls });
      setNotice('Property verification was submitted for review.');
      setEvidence('');
      setReload((value) => value + 1);
    } catch (cause) {
      setError(toApiError(cause).message || 'Property verification could not be submitted.');
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneCode = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await verificationAPI.sendPhoneCode();
      setNotice((result as { message?: string }).message ?? 'If delivery is enabled, a verification code was sent.');
    } catch (cause) {
      setError(toApiError(cause).message || 'A phone verification code could not be sent.');
    } finally {
      setSaving(false);
    }
  };

  const confirmPhoneCode = async () => {
    if (!/^\d{6}$/.test(phoneCode)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await verificationAPI.confirmPhone(phoneCode);
      setNotice((result as { message?: string }).message ?? 'Phone verification completed.');
      setPhoneCode('');
      setReload((value) => value + 1);
    } catch (cause) {
      setError(toApiError(cause).message || 'Phone verification failed.');
    } finally {
      setSaving(false);
    }
  };

  const latestSubmission = (submissionKind: string) =>
    overview?.submissions.find((submission) => submission.kind === submissionKind);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header><h1 className="text-2xl font-extrabold">Host Verification</h1><p className="mt-1 text-sm text-gray-500">Review and submit verification through Rentra’s existing verification service.</p></header>
      {error && <Card className="flex flex-wrap items-center justify-between gap-3 p-4"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800  ">{notice}</p>}
      {loading ? <Card className="p-5 text-sm text-gray-500">Loading verification status…</Card> : profile && overview && (
        <>
          <Card className="space-y-3 p-5">
            <h2 className="font-bold">Contact verification requirements</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="rounded-lg border p-3 text-sm">Email: <strong>{profile.emailVerified ? 'Verified' : 'Not verified'}</strong></p>
              <p className="rounded-lg border p-3 text-sm">Phone: <strong>{profile.phoneVerified ? 'Verified' : 'Not verified'}</strong></p>
            </div>
            {!profile.phoneVerified && (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={saving} onClick={() => void sendPhoneCode()} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">{saving ? 'Please wait…' : 'Send phone code'}</button>
                <label className="sr-only" htmlFor="phone-code">6-digit phone verification code</label>
                <input id="phone-code" inputMode="numeric" maxLength={6} value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className="rounded-lg border px-3 py-2 text-sm" />
                <button type="button" disabled={saving} onClick={() => void confirmPhoneCode()} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">Confirm phone</button>
              </div>
            )}
            {!profile.emailVerified && <p className="text-sm text-amber-700">Verify your email before submitting evidence. Email verification is handled through the existing account flow.</p>}
            <p className="text-xs text-gray-500">The verification API requires both verified email and phone before evidence can be submitted. Verification is not granted by the browser.</p>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-bold">Account submissions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['HOST', 'IDENTITY'] as const).map((submissionKind) => {
                const submission = latestSubmission(submissionKind);
                const currentStatus = submission?.status ?? (submissionKind === 'HOST' ? profile.verificationStatus : profile.identityVerificationStatus);
                return <div key={submissionKind} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2"><strong>{submissionKind === 'HOST' ? 'Host verification' : 'Identity verification'}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass(currentStatus)}`}>{currentStatus.replaceAll('_', ' ')}</span></div>
                  {submission?.reviewNotes && <p className="mt-3 text-sm text-red-700">Review note: {submission.reviewNotes}</p>}
                  {submission?.submittedAt && <p className="mt-2 text-xs text-gray-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</p>}
                </div>;
              })}
            </div>
            <label className="block text-sm font-semibold">Secure evidence links <span className="font-normal text-gray-500">(HTTPS, one per line; at most 10)</span>
              <textarea rows={3} value={evidence} onChange={(event) => setEvidence(event.target.value)} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm" placeholder="https://…" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold">Submission type
                <select value={kind} onChange={(event) => setKind(event.target.value as 'HOST' | 'IDENTITY')} className="ml-2 rounded-lg border bg-surface px-3 py-2 text-sm"><option value="HOST">Host</option><option value="IDENTITY">Identity</option></select>
              </label>
              <button type="button" disabled={saving || !profile.emailVerified || !profile.phoneVerified || latestSubmission(kind)?.status === 'PENDING' || latestSubmission(kind)?.status === 'APPROVED'} onClick={() => void submitUserVerification()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">{saving ? 'Submitting…' : `Submit ${kind.toLowerCase()} verification`}</button>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-bold">Property verification</h2>
            <p className="text-sm text-gray-500">Property review is separate from host verification. The backend requires host and identity approvals before it can approve a property.</p>
            {overview.properties.length === 0 ? <p className="text-sm text-gray-500">No properties are associated with this account yet.</p> : overview.properties.map((property) => {
              const submission = overview.submissions.find((item) => item.propertyId === property.id);
              return <div key={property.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div><p className="font-semibold">{property.title}</p><p className="text-xs text-gray-500">Verification: {property.verificationStatus.replaceAll('_', ' ')}</p>{submission?.reviewNotes && <p className="mt-1 text-xs text-red-700">Review note: {submission.reviewNotes}</p>}</div>
                <button type="button" disabled={saving || property.verificationStatus === 'PENDING' || property.verificationStatus === 'APPROVED' || !profile.emailVerified || !profile.phoneVerified} onClick={() => void submitProperty(property.id)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">Submit property evidence</button>
              </div>;
            })}
          </Card>
          <p className="text-xs text-gray-500">Never enter CNIC numbers or upload identity documents into this page. It accepts secure evidence links only; sensitive document handling depends on the separate verified backend process.</p>
        </>
      )}
    </div>
  );
}
