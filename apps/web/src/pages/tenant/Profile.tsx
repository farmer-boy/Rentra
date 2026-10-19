import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '../../api/users';
import { getApiErrorMessage } from '../../api/api-error';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  trustScore: number | null;
  isVerified: boolean;
  verificationStatus: string;
}

export default function Profile() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    usersAPI.getMe().then((data) => {
      setProfile(data);
      setForm({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
      updateUser({ id: data.id, fullName: data.fullName, email: data.email, phone: data.phone ?? '', trustScore: data.trustScore, isVerified: data.isVerified });
    }).catch((requestError: unknown) => setError(getApiErrorMessage(requestError, 'Your profile could not be loaded.')))
      .finally(() => setLoading(false));
  }, [updateUser]);

  const saveProfile = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const data = await usersAPI.updateMe(form);
      setProfile((current) => current ? { ...current, ...data } : current);
      setForm({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
      updateUser({ id: data.id, fullName: data.fullName, email: data.email, phone: data.phone ?? '', trustScore: data.trustScore, isVerified: data.isVerified });
      setMessage('Profile updated.');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Your profile could not be saved.'));
    } finally { setSaving(false); }
  };

  const fieldClass = 'w-full border border-border rounded-lg px-3 py-2 text-[12px] bg-bg text-text outline-none focus:border-primary';
  return (
    <div>
      <div className="mb-6"><h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>My Profile</h2><p className={`text-[13px] text-text-muted`}>View and update your account details</p></div>
      {loading ? <p className="text-sm text-gray-500">Loading profile...</p> : error && !profile ? <p role="alert" className="text-sm text-red-600">{error}</p> : profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <div className={`text-[13px] font-bold mb-4 text-text`}>Personal Information</div>
            <div className="flex gap-3 mb-4 p-3 bg-surface-2 border border-border rounded-lg">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center text-lg font-bold text-green-600 flex-shrink-0">{profile.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div className="flex-1"><div className={`font-bold text-[13px] text-text`}>{profile.fullName}</div><div className={`text-[11px] text-text-muted`}>{profile.email}</div><div className={`text-[11px] text-text-muted`}>{profile.phone || 'Phone number not provided'}</div><div className="mt-1"><Pill variant={profile.isVerified ? 'green' : 'yellow'}>{profile.verificationStatus.replace('_', ' ')}</Pill></div></div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-mono tracking-widest">FULL NAME<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={fieldClass} aria-label="Full name" /></label>
              <label className="block text-[10px] font-mono tracking-widest">EMAIL<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} aria-label="Email" /></label>
              <label className="block text-[10px] font-mono tracking-widest">PHONE<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} aria-label="Phone number" /></label>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}{message && <p role="status" className="mt-3 text-xs text-green-600">{message}</p>}
            <button onClick={() => void saveProfile()} disabled={saving} className="w-full bg-green-500 text-primary-contrast  px-4 py-2.5 rounded-lg font-semibold text-[12px] hover:bg-green-400 transition-colors mt-4 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </Card>
          <Card><div className="text-[13px] font-bold mb-4">My Trust Score</div>
            {profile.trustScore == null ? <p className="text-sm text-gray-500">A trust score is not available for this account.</p> : <div className="flex items-center gap-3"><div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center font-bold text-green-600"><div className="text-center"><div className="text-2xl">{profile.trustScore}</div><div className="text-[8px]">/100</div></div></div><p className="text-sm text-gray-600">Current account trust score</p></div>}
            <p className="mt-5 text-xs text-gray-500">Detailed score factors and rental history are not available from the profile API.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
