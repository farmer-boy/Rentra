import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import api from '../../api/client';

interface Profile {
  trustScore: number | null;
}

export default function TrustScores() {
  const { isDark } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<Profile>('/users/me')
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Trust Score ⭐</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your trust score reported by your account profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>My Score</div>
          {loading ? (
            <p className="py-6 text-center text-[12px] text-gray-500">Loading trust score…</p>
          ) : error ? (
            <p role="alert" className="py-6 text-center text-[12px] text-red-500">Unable to load your trust score right now.</p>
          ) : profile?.trustScore == null ? (
            <p className="py-6 text-center text-[12px] text-gray-500">No trust score is available for your account.</p>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl ${isDark ? 'bg-[#0f3d1f] text-green-400 border-2 border-green-500' : 'bg-green-100 text-green-700 border-2 border-green-400'}`}>
                {profile.trustScore}<span className="text-[11px] ml-1">/100</span>
              </div>
              <p className={`mt-3 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Overall score from your account profile.</p>
            </div>
          )}
        </Card>

        <Card>
          <div className={`text-[13px] font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Other Tenant & Landlord Scores</div>
          <p className={`py-6 text-center text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No backend endpoint is available to retrieve trust scores for other tenants or landlords.
          </p>
        </Card>
      </div>
    </div>
  );
}
