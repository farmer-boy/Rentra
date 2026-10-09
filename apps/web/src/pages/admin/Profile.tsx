import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import api from '../../api/client';
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
  const { isDark } = useTheme();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me')
      .then((response) => {
        setProfile(response.data);
        updateUser({
          fullName: response.data.fullName,
          email: response.data.email,
          phone: response.data.phone ?? '',
          trustScore: response.data.trustScore,
          isVerified: response.data.isVerified,
        });
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Your profile could not be loaded.'))
      .finally(() => setLoading(false));
  }, [updateUser]);

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Admin Profile</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-700' : 'text-gray-600'}`}>Your account information</p>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading profile...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : profile && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Card>
            <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Admin Information</div>
            <div className={`flex gap-3 p-3 ${isDark ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-50'} border rounded-lg`}>
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-lg font-bold text-purple-600 flex-shrink-0">
                {profile.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className={`text-[12px] font-bold ${isDark ? 'text-[#ddd]' : 'text-gray-800'}`}>{profile.fullName}</div>
                <div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{profile.email}</div>
                <div className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{profile.phone || 'Phone number not provided'}</div>
                <div className={`mt-1 text-[11px] ${profile.isVerified ? 'text-green-600' : 'text-gray-500'}`}>{profile.verificationStatus.split('_').join(' ')}</div>
              </div>
            </div>
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
