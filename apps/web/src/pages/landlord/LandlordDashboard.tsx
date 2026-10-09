import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, Clock3, Home, MessageCircle, Plus, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';

type Listing = { id: string; title: string; rent: number; status: string; availability: string; area: string; city: string };
type Analytics = { viewsThisMonth: number; favorites: number; requests: number };

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ viewsThisMonth: 0, favorites: 0, requests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/listings/landlord/my-listings'), api.get('/listings/landlord/analytics')])
      .then(([listingResponse, analyticsResponse]) => {
        setListings(listingResponse.data.data ?? []);
        setAnalytics(analyticsResponse.data);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Dashboard data could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const active = listings.filter((item) => item.status === 'PUBLISHED' && item.availability === 'AVAILABLE');
  const pending = listings.filter((item) => item.status === 'PENDING' || item.status === 'DRAFT');
  const rented = listings.filter((item) => item.availability === 'RENTED');

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div><h1 className="text-xl font-extrabold">Landlord Dashboard</h1><p className="text-sm text-gray-500">Manage properties and understand tenant interest.</p></div>
        <button onClick={() => navigate('/landlord/post')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Create property</button>
      </header>
      {loading ? <p className="text-sm text-gray-500">Loading dashboard...</p> : error ? <p role="alert" className="text-sm text-red-600">{error}</p> : <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><StatCard label="ACTIVE" value={active.length} color="text-emerald-600" /><StatCard label="PENDING REVIEW" value={pending.length} color="text-amber-600" /><StatCard label="RENTED" value={rented.length} color="text-blue-600" /><StatCard label="VIEWS THIS MONTH" value={analytics.viewsThisMonth} color="text-indigo-600" /></div>}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card><div className="flex items-center justify-between mb-3"><h2 className="font-bold">Properties</h2><button onClick={() => navigate('/landlord/properties')} className="text-xs font-semibold text-emerald-600">View all</button></div>{loading ? <p className="text-sm text-gray-500">Loading properties...</p> : error ? <p className="text-sm text-red-600">Properties could not be loaded.</p> : listings.length === 0 ? <p className="text-sm text-gray-500">No properties yet. Create your first listing.</p> : <div className="space-y-2">{listings.slice(0, 6).map((listing) => <div key={listing.id} className="flex items-center justify-between border-b py-3 last:border-0"><div><p className="font-semibold text-sm">{listing.title}</p><p className="text-xs text-gray-500">{listing.area}, {listing.city}</p></div><div className="text-right"><p className="font-bold text-emerald-600">Rs {listing.rent.toLocaleString()}</p><span className={`text-[10px] font-semibold ${listing.status === 'PENDING' ? 'text-amber-600' : listing.availability === 'RENTED' ? 'text-blue-600' : listing.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-gray-500'}`}>{listing.availability === 'RENTED' ? 'Rented' : listing.status === 'PENDING' ? 'Pending review' : listing.status === 'PUBLISHED' ? 'Published' : listing.status}</span></div></div>)}</div>}</Card>
        <div className="grid grid-cols-2 gap-3"><button onClick={() => navigate('/landlord/applications')} className="rounded-xl border p-4 text-left hover:border-emerald-500"><Clock3 className="text-amber-600" size={20} /><p className="mt-2 text-sm font-bold">Rental requests</p></button><button onClick={() => navigate('/landlord/messages')} className="rounded-xl border p-4 text-left hover:border-emerald-500"><MessageCircle className="text-blue-600" size={20} /><p className="mt-2 text-sm font-bold">Messages</p></button><button onClick={() => navigate('/landlord/income')} className="rounded-xl border p-4 text-left hover:border-emerald-500"><Wallet className="text-emerald-600" size={20} /><p className="mt-2 text-sm font-bold">Earnings</p></button><button onClick={() => navigate('/landlord/reviews')} className="rounded-xl border p-4 text-left hover:border-emerald-500"><Star className="text-amber-500" size={20} /><p className="mt-2 text-sm font-bold">Reviews</p></button></div>
      </div>
      <Card><div className="flex items-center gap-2 mb-3"><BarChart3 size={18} className="text-emerald-600" /><h2 className="font-bold">Property analytics</h2></div>{loading ? <p className="text-sm text-gray-500">Loading analytics...</p> : error ? <p className="text-sm text-red-600">Analytics could not be loaded.</p> : <><p className="mb-3 text-sm text-gray-500">Your properties have received {analytics.viewsThisMonth} views this month.</p><div className="mb-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-indigo-50 p-3"><strong>{analytics.favorites}</strong><p className="text-xs text-gray-500">Favorites</p></div><div className="rounded-lg bg-amber-50 p-3"><strong>{analytics.requests}</strong><p className="text-xs text-gray-500">Rental requests</p></div></div><div className="flex items-center gap-2"><Home size={17} className="text-gray-500" /><span className="text-sm">Create, submit, verify, and publish your properties.</span><CheckCircle size={17} className="ml-auto text-emerald-600" /></div></>}</Card>
    </div>
  );
}
