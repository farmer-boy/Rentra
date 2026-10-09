import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  trustScore: number;
  isVerified: boolean;
  verificationStatus: string;
}

export default function LandlordProfile() {
  const { isDark } = useTheme();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setProfile(data);
      setForm({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
      updateUser({ id: data.id, fullName: data.fullName, email: data.email, phone: data.phone ?? '', trustScore: data.trustScore, isVerified: data.isVerified });
    }).catch((requestError) => setError(requestError.response?.data?.message || 'Your profile could not be loaded.'))
      .finally(() => setLoading(false));
  }, [updateUser]);

  const saveProfile = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const { data } = await api.patch('/users/me', form);
      setProfile((current) => current ? { ...current, ...data } : current);
      setForm({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
      updateUser({ id: data.id, fullName: data.fullName, email: data.email, phone: data.phone ?? '', trustScore: data.trustScore, isVerified: data.isVerified });
      setSaved(true);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Your profile could not be saved.');
    } finally { setSaving(false); }
  };
  const inputClass = `w-full border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-[#0f0f0f] border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`;

  return (
    <div>
      <div className="mb-6"><h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>My Profile</h2><p className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage your account information</p></div>
      {loading ? <p className="text-sm text-gray-500">Loading profile...</p> : error && !profile ? <p role="alert" className="text-sm text-red-600">{error}</p> : profile && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Card>
            <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Profile Information</div>
            <div className={`flex gap-3 p-3 mb-4 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg`}>
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center text-lg font-bold text-blue-600 flex-shrink-0">{profile.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div><div className={`text-[12px] font-bold ${isDark ? 'text-[#ddd]' : 'text-gray-800'}`}>{profile.fullName}</div><div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{profile.email}</div><div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{profile.phone || 'Phone number not provided'}</div><div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{profile.verificationStatus.replaceAll('_', ' ')}</div></div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold">Full name<input aria-label="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={inputClass} /></label>
              <label className="block text-xs font-semibold">Email<input aria-label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label>
              <label className="block text-xs font-semibold">Phone<input aria-label="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} /></label>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}{saved && <p role="status" className="mt-3 text-xs text-green-600">Profile updated.</p>}
            <button onClick={() => void saveProfile()} disabled={saving} className="w-full bg-green-500 text-black px-4 py-2.5 rounded-lg font-semibold text-[12px] hover:bg-green-400 mt-4 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </Card>
          <Card>
            <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>My Trust Score</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0 border-2 border-green-500 rounded-full w-20 h-20 bg-green-500/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.trustScore}</div>
                  <div className="text-[8px] text-gray-500">/100</div>
                </div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Current account trust score from your profile.</p>
            </div>
            <p className={`mt-5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Detailed score factors are not available from the profile API.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
