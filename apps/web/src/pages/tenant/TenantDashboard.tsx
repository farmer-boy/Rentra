import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';
import { Bot, Lightbulb, Star, FileText, CreditCard, Home } from 'lucide-react';
import { usersAPI } from '../../api/users';
import { agreementsAPI } from '../../api/agreements';
import { disputesAPI } from '../../api/disputes';
import { reportsAPI } from '../../api/reports';

interface Profile {
  trustScore: number | null;
}

interface DashboardAgreement {
  id: string;
  tenantId: string;
  listingId: string;
  status: string;
  monthlyRent: number;
  startDate: string;
  endDate: string | null;
  listing?: { title?: string; address?: string } | null;
  property?: { title?: string; city?: string; area?: string } | null;
}

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tenantAgreements, setTenantAgreements] = useState<DashboardAgreement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [signedAgreementCount, setSignedAgreementCount] = useState<number | null>(null);
  const [agreementsLoading, setAgreementsLoading] = useState(true);
  const [agreementsError, setAgreementsError] = useState(false);
  const [resolvedDisputeCount, setResolvedDisputeCount] = useState<number | null>(null);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [disputesError, setDisputesError] = useState(false);
  const [fakeReportCount, setFakeReportCount] = useState<number | null>(null);
  const [fakeReportsLoading, setFakeReportsLoading] = useState(true);
  const [fakeReportsError, setFakeReportsError] = useState(false);

  useEffect(() => {
    let active = true;
    usersAPI.getMe()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfileError(true);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    if (user?.id) {
      agreementsAPI.mine<DashboardAgreement>()
        .then((records) => {
          if (!active) return;
          const signedStatuses = new Set(['ACTIVE', 'ENDED', 'CANCELLED', 'EXPIRED', 'TERMINATED']);
          const mine = records.filter((agreement) => agreement.tenantId === user.id);
          setTenantAgreements(mine);
          setSignedAgreementCount(mine.filter((agreement) => signedStatuses.has(agreement.status)).length);
        })
        .catch(() => { if (active) setAgreementsError(true); })
        .finally(() => { if (active) setAgreementsLoading(false); });

      disputesAPI.mine({ status: 'RESOLVED', page: 1, limit: 100 })
        .then((response) => {
          if (active) setResolvedDisputeCount(response.totalCount);
        })
        .catch(() => { if (active) setDisputesError(true); })
        .finally(() => { if (active) setDisputesLoading(false); });

      reportsAPI.confirmedFakeListingReports()
        .then((reports) => { if (active) setFakeReportCount(reports.length); })
        .catch(() => { if (active) setFakeReportsError(true); })
        .finally(() => { if (active) setFakeReportsLoading(false); });
    } else {
      setAgreementsLoading(false);
      setDisputesLoading(false);
      setFakeReportsLoading(false);
    }
    return () => { active = false; };
  }, [user?.id]);

  const rentalHistory = tenantAgreements.filter((agreement) => (
    ['ACTIVE', 'ENDED', 'EXPIRED', 'TERMINATED'].includes(agreement.status)
  ));
  const rentedPropertyCount = new Set(rentalHistory.map((agreement) => agreement.listingId).filter(Boolean)).size;

  const quickActions = [
    { icon: <Home size={16} />, label: 'Browse Listings', path: '/tenant/listings', color: 'bg-blue-500/20 text-blue-600' },
    { icon: <Bot size={16} />, label: 'Fake Detector', path: '/tenant/detector', color: 'bg-red-500/20 text-red-600' },
    { icon: <Lightbulb size={16} />, label: 'Rent Estimator', path: '/tenant/estimator', color: 'bg-amber-500/20 text-amber-600' },
    { icon: <Star size={16} />, label: 'Trust Scores', path: '/tenant/trust', color: 'bg-green-500/20 text-green-600' },
    { icon: <FileText size={16} />, label: 'Agreements', path: '/tenant/agreement', color: 'bg-purple-500/20 text-purple-600' },
    { icon: <CreditCard size={16} />, label: 'Payments', path: '/tenant/payments', color: 'bg-teal-500/20 text-teal-600' },
  ];
  return (
    <div>
      <div className="mb-3">
        <h1 className={`text-lg font-bold tracking-tight text-text`}>
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className={`text-xs text-text-muted mt-0.5`}>Pakistan's rental platform</p>
      </div>

      <div className="mb-4">
        <div className={`text-xs font-bold mb-2 text-text-muted uppercase tracking-widest`}>Quick Access</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5 md:gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} p-2 rounded-lg hover:opacity-90 transition-all text-center flex flex-col items-center gap-1 hover:bg-opacity-25`}
            >
              {action.icon}
              <span className="text-[10px] font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3 mb-4">
        {[
          { label: 'MY RENTED PROPERTIES', value: agreementsLoading ? '…' : agreementsError ? 'Unavailable' : rentedPropertyCount, change: undefined, color: undefined, path: '/tenant/agreement?status=SIGNED' },
          { label: 'FAKE REPORTS CONFIRMED', value: fakeReportsLoading ? '…' : fakeReportsError ? 'Unavailable' : fakeReportCount ?? '—', change: undefined, color: 'text-red-600', path: '/tenant/detector' },
          { label: 'AGREEMENTS SIGNED', value: agreementsLoading ? '…' : agreementsError ? 'Unavailable' : signedAgreementCount ?? '—', change: undefined, color: 'text-green-600', path: '/tenant/agreement?status=SIGNED' },
          { label: 'DISPUTES RESOLVED', value: disputesLoading ? '…' : disputesError ? 'Unavailable' : resolvedDisputeCount ?? '—', change: undefined, color: 'text-yellow-600', path: '/tenant/disputes?status=RESOLVED' },
        ].map((item) => (
          <button key={item.label} type="button" onClick={() => navigate(item.path)} className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <StatCard label={item.label} value={item.value} change={item.change} color={item.color} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold text-text`}>My Rental History</span>
            <button onClick={() => navigate('/tenant/agreement?status=SIGNED')} className={`text-xs font-mono text-text-muted hover:text-primary-hover`}>View All →</button>
          </div>
          {agreementsLoading ? (
            <p className="py-4 text-xs text-gray-500">Loading your rental history…</p>
          ) : agreementsError ? (
            <p role="alert" className="py-4 text-xs text-red-500">Unable to load your rental history right now.</p>
          ) : rentalHistory.length === 0 ? (
            <p className="py-4 text-xs text-gray-500">No signed rental history yet. Properties you rent through Rentra will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="text-left">
                    {['Property', 'Area', 'Rent', 'Tenancy', 'Status'].map(h => (
                      <th key={h} className={`text-xs font-mono text-text-muted border-border tracking-widest pb-2 border-b`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rentalHistory.map((agreement) => (
                    <tr key={agreement.id} className="transition-colors hover:bg-surface-2">
                      <td className="py-2 text-xs text-text-muted">{agreement.listing?.title ?? agreement.property?.title ?? `Property ${agreement.listingId.slice(0, 8)}`}</td>
                      <td className="py-2 text-xs text-text-muted">{[agreement.property?.area, agreement.property?.city].filter(Boolean).join(', ') || agreement.listing?.address || '—'}</td>
                      <td className="py-2 text-xs text-green-600">Rs {Number(agreement.monthlyRent).toLocaleString()}</td>
                      <td className="py-2 text-xs text-text-muted">{new Date(agreement.startDate).toLocaleDateString()} – {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'Ongoing'}</td>
                      <td className="py-2"><Pill variant={agreement.status === 'ACTIVE' ? 'green' : agreement.status === 'ENDED' || agreement.status === 'EXPIRED' ? 'yellow' : 'red'}>{agreement.status}</Pill></td>
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
