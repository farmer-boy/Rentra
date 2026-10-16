import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CalendarDays, CheckCircle2, ClipboardList, FileText, Home,
  MessageCircle, Plus, RefreshCw, ShieldCheck, Star,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { agreementsAPI } from '../../api/agreements';
import { bookingsAPI } from '../../api/bookings';
import { listingsAPI } from '../../api/listings';
import { notificationsAPI, type NotificationRecord } from '../../api/notifications';
import { rentalRequestsAPI } from '../../api/rentalRequests';
import { reviewsAPI } from '../../api/reviews';
import { useAuthStore } from '../../store/authStore';

interface HostListing {
  id: string;
  propertyId?: string | null;
  title: string;
  rent: number;
  status: string;
  publicationStatus: string;
  availability: string;
  area?: string;
  city?: string;
  property?: { status?: string; verificationStatus?: string } | null;
}

interface HostRentalRequest {
  id: string;
  status: string;
}

interface HostAgreement {
  id: string;
  landlordId: string;
  status: string;
}

interface HostBooking {
  id: string;
  startDate: string;
  status: string;
  property?: { ownerId?: string };
}

interface HostReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { fullName?: string };
}

interface DashboardData {
  listings: HostListing[];
  analytics: { viewsThisMonth: number; favorites: number; requests: number };
  requests: HostRentalRequest[];
  agreements: HostAgreement[];
  bookings: HostBooking[];
  notifications: NotificationRecord[];
  reviews: HostReview[];
}

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) {
      setError('Sign in again to view your host dashboard.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [listings, analytics, requests, agreements, notifications, reviewResponse] = await Promise.all([
        listingsAPI.getMyListings<HostListing>({ page: 1, limit: 100 }),
        listingsAPI.getLandlordAnalytics(),
        rentalRequestsAPI.received<HostRentalRequest>(),
        agreementsAPI.mine<HostAgreement>(),
        notificationsAPI.list(),
        reviewsAPI.getForUser(user.id),
      ]);
      const propertyIds = [...new Set(listings.map((listing) => listing.propertyId).filter((id): id is string => Boolean(id)))];
      const bookingGroups = await Promise.all(propertyIds.map((id) => bookingsAPI.propertyBookings<HostBooking>(id)));
      const reviewRecords = (reviewResponse as { data?: HostReview[] }).data ?? [];
      setData({
        listings,
        analytics: analytics as DashboardData['analytics'],
        requests,
        agreements: agreements.filter((agreement) => agreement.landlordId === user.id),
        bookings: [...new Map(bookingGroups.flat().map((booking) => [booking.id, booking])).values()],
        notifications,
        reviews: reviewRecords,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard data could not be loaded.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load, reload]);

  const listings = data?.listings ?? [];
  const requests = data?.requests ?? [];
  const activeListings = listings.filter((listing) => listing.property?.status === 'ACTIVE' && listing.publicationStatus === 'PUBLISHED');
  const pendingListings = listings.filter((listing) => ['DRAFT', 'PENDING_VERIFICATION'].includes(listing.property?.status ?? listing.status));
  const rejectedListings = listings.filter((listing) => listing.property?.status === 'REJECTED' || listing.property?.verificationStatus === 'REJECTED');
  const suspendedListings = listings.filter((listing) => listing.property?.status === 'SUSPENDED');
  const rentedListings = listings.filter((listing) => listing.property?.status === 'RENTED' || listing.availability === 'RENTED');
  const upcomingBookings = (data?.bookings ?? []).filter((booking) => new Date(booking.startDate) > new Date() && !['CANCELLED', 'REJECTED', 'EXPIRED'].includes(booking.status));
  const pendingRequests = requests.filter((request) => request.status === 'PENDING');
  const activeAgreements = (data?.agreements ?? []).filter((agreement) => agreement.status === 'ACTIVE');
  const recentNotifications = (data?.notifications ?? []).slice(0, 4);
  const recentReviews = (data?.reviews ?? []).slice(0, 3);

  const actions = [
    { label: 'My properties', path: '/landlord/properties', icon: <Home size={18} /> },
    { label: 'Add property', path: '/landlord/post', icon: <Plus size={18} /> },
    { label: 'Rental requests', path: '/landlord/applications', icon: <ClipboardList size={18} /> },
    { label: 'Bookings', path: '/landlord/bookings', icon: <CalendarDays size={18} /> },
    { label: 'Availability', path: '/landlord/availability', icon: <CalendarDays size={18} /> },
    { label: 'Agreements', path: '/landlord/agreements', icon: <FileText size={18} /> },
    { label: 'Verification', path: '/landlord/verification', icon: <ShieldCheck size={18} /> },
    { label: 'Messages', path: '/landlord/messages', icon: <MessageCircle size={18} /> },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Host Dashboard</h1><p className="mt-1 text-sm text-gray-500">A live overview of your Rentra properties and tenancy activity.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><RefreshCw size={15} />Refresh</button><button type="button" onClick={() => navigate('/landlord/post')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={16} />Add property</button></div>
      </header>

      {loading ? <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />)}</div> : error ? <Card className="flex flex-wrap items-center justify-between gap-3 p-5"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card> : data && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="PROPERTIES" value={listings.length} color="text-gray-800" />
            <StatCard label="PUBLISHED" value={activeListings.length} color="text-emerald-600" />
            <StatCard label="PENDING REVIEW" value={pendingListings.length} color="text-amber-600" />
            <StatCard label="REJECTED" value={rejectedListings.length} color="text-red-600" />
            <StatCard label="SUSPENDED" value={suspendedListings.length} color="text-red-700" />
            <StatCard label="RENTED" value={rentedListings.length} color="text-blue-600" />
            <StatCard label="UPCOMING BOOKINGS" value={upcomingBookings.length} color="text-blue-600" />
            <StatCard label="PENDING RENTAL REQUESTS" value={pendingRequests.length} color="text-amber-600" />
            <StatCard label="ACTIVE AGREEMENTS" value={activeAgreements.length} color="text-indigo-600" />
            <StatCard label="VIEWS THIS MONTH" value={data.analytics.viewsThisMonth} color="text-purple-600" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Your properties</h2><button type="button" onClick={() => navigate('/landlord/properties')} className="text-sm font-semibold text-emerald-700">Manage all</button></div>
              {listings.length === 0 ? <p className="text-sm text-gray-500">You have not added a property yet.</p> : <div className="divide-y">{listings.slice(0, 5).map((listing) => <button type="button" key={listing.id} onClick={() => navigate('/landlord/properties')} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                <div><p className="text-sm font-semibold">{listing.title}</p><p className="text-xs text-gray-500">{[listing.area, listing.city].filter(Boolean).join(', ')}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-emerald-700">PKR {listing.rent.toLocaleString()}</p><p className="text-[10px] text-gray-500">{(listing.property?.status ?? listing.status).replaceAll('_', ' ')} · {listing.publicationStatus.replaceAll('_', ' ')}</p></div>
              </button>)}</div>}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/40"><strong>{data.analytics.favorites}</strong><br /><span className="text-xs text-gray-500">Favorites</span></p><p className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/40"><strong>{data.analytics.requests}</strong><br /><span className="text-xs text-gray-500">All rental requests</span></p></div>
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 font-bold">Host tools</h2>
              <div className="grid grid-cols-2 gap-2">{actions.map((action) => <button type="button" key={action.path} onClick={() => navigate(action.path)} className="flex min-h-16 items-center gap-2 rounded-lg border p-3 text-left text-xs font-semibold hover:border-emerald-500"><span className="text-emerald-700">{action.icon}</span>{action.label}</button>)}</div>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Pending requests</h2><button type="button" onClick={() => navigate('/landlord/applications')} className="text-xs font-semibold text-emerald-700">View all</button></div>{pendingRequests.length === 0 ? <p className="text-sm text-gray-500">No requests need a decision.</p> : pendingRequests.slice(0, 4).map((request) => <button type="button" key={request.id} onClick={() => navigate('/landlord/applications')} className="block w-full border-t py-2 text-left text-sm">Request <span className="font-mono text-xs">{request.id.slice(0, 10)}</span></button>)}</Card>
            <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Bell size={16} />Notifications</h2><button type="button" onClick={() => navigate('/landlord/notifications')} className="text-xs font-semibold text-emerald-700">View all</button></div>{recentNotifications.length === 0 ? <p className="text-sm text-gray-500">No notifications.</p> : recentNotifications.map((notification) => <div key={notification.id} className="border-t py-2"><p className="text-sm font-semibold">{notification.title}</p><p className="line-clamp-2 text-xs text-gray-500">{notification.message}</p></div>)}</Card>
            <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Star size={16} />Recent reviews</h2><button type="button" onClick={() => navigate('/landlord/reviews')} className="text-xs font-semibold text-emerald-700">View all</button></div>{recentReviews.length === 0 ? <p className="text-sm text-gray-500">No host reviews yet.</p> : recentReviews.map((review) => <div key={review.id} className="border-t py-2"><p className="text-sm font-semibold">{review.user?.fullName ?? 'Tenant'} · {review.rating}/5</p><p className="line-clamp-2 text-xs text-gray-500">{review.comment || 'No written comment.'}</p><p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p></div>)}</Card>
          </div>
          <p className="flex items-start gap-2 text-xs text-gray-500"><CheckCircle2 size={14} className="mt-0.5 shrink-0" />Status and summary values come from Rentra APIs. Earnings/payouts are intentionally not included in this non-payment update.</p>
        </>
      )}
    </div>
  );
}
