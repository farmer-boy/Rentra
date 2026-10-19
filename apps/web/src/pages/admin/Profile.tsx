import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { usersAPI } from '../../api/users';
import { useAuthStore } from '../../store/authStore';

interface Profile {
  fullName: string;
  email: string;
  phone: string | null;
  trustScore: number;
  isVerified: boolean;
  verificationStatus: string;
}

export default function AdminProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    usersAPI.getMe()
      .then((data) => {
        setProfile(data);
        updateUser({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone ?? '',
          trustScore: data.trustScore,
          isVerified: data.isVerified,
        });
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Your profile could not be loaded.'))
      .finally(() => setLoading(false));
  }, [updateUser]);

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 text-text`}>Admin Profile</h2>
        <p className={`text-[13px] text-text-muted`}>Your account information</p>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading profile...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : profile && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Card>
            <div className={`text-[13px] font-bold mb-4 text-text`}>Admin Information</div>
            <div className="flex gap-3 p-3 bg-surface-2 border border-border rounded-lg">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
                {profile.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[12px] font-bold text-text">{profile.fullName}</div>
                <div className={`text-[11px] text-text-muted`}>{profile.email}</div>
                <div className={`text-[11px] text-text-muted`}>{profile.phone || 'Phone number not provided'}</div>
                <div className={`mt-1 text-[11px] ${profile.isVerified ? 'text-green-600' : 'text-gray-500'}`}>{profile.verificationStatus.split('_').join(' ')}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className={`text-[13px] font-bold mb-4 text-text`}>My Trust Score</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0 border-2 border-green-500 rounded-full w-20 h-20 bg-green-500/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.trustScore}</div>
                  <div className="text-[8px] text-gray-500">/100</div>
                </div>
              </div>
              <p className={`text-sm text-text-muted`}>Current account trust score from your profile.</p>
            </div>
            <p className={`mt-5 text-xs text-text-muted`}>Detailed score factors are not available from the profile API.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
