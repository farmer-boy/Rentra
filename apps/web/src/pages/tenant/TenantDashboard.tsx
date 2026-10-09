import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { Bot, Lightbulb, Star, FileText, CreditCard, Home } from 'lucide-react';
import api from '../../api/client';

interface Listing {
  id: string;
  title: string;
  city: string;
  area: string;
  rent: number;
  publicationStatus: string;
}

interface Profile {
  trustScore: number | null;
}

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingTotal, setListingTotal] = useState<number | null>(null);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<{ data?: Listing[]; pagination?: { total?: number } }>('/listings', { params: { page: 1, limit: 5 } })
      .then(({ data }) => {
        if (active) {
          setListings(Array.isArray(data.data) ? data.data : []);
          setListingTotal(typeof data.pagination?.total === 'number' ? data.pagination.total : null);
        }
      })
      .catch(() => {
        if (active) setListingsError(true);
      })
      .finally(() => {
        if (active) setListingsLoading(false);
      });
    api.get<Profile>('/users/me')
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfileError(true);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => { active = false; };
  }, []);

  const quickActions = [
    { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings', color: 'bg-blue-500/20 text-blue-600' },
    { icon: <Bot size={16} />, label: 'Fake Detector', path: '/tenant/detector', color: 'bg-red-500/20 text-red-600' },
    { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/tenant/estimator', color: 'bg-amber-500/20 text-amber-600' },
    { icon: <Star size={16} />, label: 'Trust Scores', path: '/tenant/trust', color: 'bg-green-500/20 text-green-600' },
    { icon: <FileText size={16} />, label: 'Agreements', path: '/tenant/agreement', color: 'bg-purple-500/20 text-purple-600' },
    { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments', color: 'bg-teal-500/20 text-teal-600' },
  ];
  const unavailable = 'Not provided by the backend';

  return (
    <div>
      <div className="mb-3">
        <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>Pakistan's rental platform</p>
      </div>

      <div className="mb-4">
        <div className={`text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest`}>Quick Access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} p-2 rounded-lg hover:opacity-90 transition-all text-center flex flex-col items-center gap-1 ${isDark ? 'hover:bg-opacity-30' : 'hover:bg-opacity-25'}`}
            >
              {action.icon}
              <span className="text-[10px] font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <StatCard label="PUBLISHED LISTINGS" value={listingsLoading ? '…' : listingsError ? 'Unavailable' : listingTotal ?? '—'} />
        <StatCard label="FAKE DETECTED" value="—" change={unavailable} color="text-red-600" />
        <StatCard label="AGREEMENTS SIGNED" value="—" change={unavailable} color="text-green-600" />
        <StatCard label="DISPUTES RESOLVED" value="—" change={unavailable} color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>Recent Listings</span>
            <button onClick={() => navigate('/tenant/listings')} className={`text-xs font-mono ${isDark ? 'text-gray-400 hover:text-green-500' : 'text-gray-500 hover:text-green-600'}`}>View All →</button>
          </div>
          {listingsLoading ? (
            <p className="py-4 text-xs text-gray-500">Loading listings…</p>
          ) : listingsError ? (
            <p role="alert" className="py-4 text-xs text-red-500">Unable to load listings right now.</p>
          ) : listings.length === 0 ? (
            <p className="py-4 text-xs text-gray-500">No listings are currently available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="text-left">
                    {['Property', 'Area', 'Rent', 'Status'].map(h => (
                      <th key={h} className={`text-xs font-mono ${isDark ? 'text-gray-400 border-white/10' : 'text-gray-500 border-gray-400'} tracking-widest pb-2 border-b`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className={`${isDark ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`py-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{listing.title}</td>
                      <td className={`py-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{[listing.area, listing.city].filter(Boolean).join(', ') || '—'}</td>
                      <td className="py-2 text-xs text-green-600">Rs {Number(listing.rent).toLocaleString()}</td>
                      <td className="py-2"><Pill variant={listing.publicationStatus === 'PUBLISHED' ? 'green' : 'yellow'}>{listing.publicationStatus}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-xs font-bold mb-3">My Trust Score</div>
          {profileLoading ? (
            <p className="py-4 text-xs text-gray-500">Loading profile…</p>
          ) : profileError ? (
            <p role="alert" className="py-4 text-xs text-red-500">Unable to load your trust score right now.</p>
          ) : profile?.trustScore == null ? (
            <p className="py-4 text-xs text-gray-500">No trust score is available for your account.</p>
          ) : (
            <div className="flex items-center gap-3 py-3">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xl font-extrabold text-green-700">{profile.trustScore}</span>
                <span className="text-xs text-green-600">/100</span>
              </div>
              <div className="text-xs text-gray-500">Overall score reported by your account profile.</div>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="text-xs font-bold mb-2">Recent Activity</div>
        <p className="py-3 text-xs text-gray-500">Live activity data is not available from the backend.</p>
      </Card>
    </div>
  );
}
