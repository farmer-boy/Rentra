import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import { bookingsAPI } from '../../api/bookings';
import { listingsAPI } from '../../api/listings';
import { useAuthStore } from '../../store/authStore';

interface OwnedListing {
  id: string;
  propertyId?: string | null;
  title: string;
}

interface HostBooking {
  id: string;
  propertyId?: string | null;
  listingId?: string | null;
  startDate: string;
  endDate: string;
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  tenant?: { id: string; fullName: string };
  property?: { id: string; title: string; city?: string | null; area?: string | null };
  listing?: { id: string; title: string; city?: string | null; area?: string | null };
}

const dateLabel = (value: string) => new Date(value).toLocaleDateString();

export default function LandlordBookings() {
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [properties, setProperties] = useState<OwnedListing[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setError('Sign in again to view bookings for your properties.');
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError('');
    const load = async () => {
      try {
        const owned = await listingsAPI.getMyListings<OwnedListing>({ page: 1, limit: 100 });
        const propertyIds = [...new Set(owned.map((listing) => listing.propertyId).filter((id): id is string => Boolean(id)))];
        const results = await Promise.all(propertyIds.map((id) => bookingsAPI.propertyBookings<HostBooking>(id)));
        if (!active) return;
        setProperties(owned);
        setBookings([...new Map(results.flat().map((booking) => [booking.id, booking])).values()]);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Bookings could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [reload, user?.id]);

  const filtered = useMemo(() => {
    const now = new Date();
    return bookings.filter((booking) => {
      if (filter === 'UPCOMING') return new Date(booking.startDate) > now && !['CANCELLED', 'REJECTED', 'EXPIRED'].includes(booking.status);
      if (filter === 'CURRENT') return new Date(booking.startDate) <= now && new Date(booking.endDate) > now && !['CANCELLED', 'REJECTED', 'EXPIRED'].includes(booking.status);
      if (filter === 'COMPLETED') return booking.status === 'COMPLETED';
      if (filter === 'CANCELLED') return booking.status === 'CANCELLED';
      return true;
    }).sort((left, right) => left.startDate.localeCompare(right.startDate));
  }, [bookings, filter]);

  const propertyTitles = new Map(properties.map((property) => [property.propertyId ?? property.id, property.title]));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Bookings</h1><p className="mt-1 text-sm text-gray-500">Short-term reservations for your properties, using booking records returned by the backend.</p></div>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><RefreshCw size={15} />Refresh</button>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Booking status filters">
        {['ALL', 'UPCOMING', 'CURRENT', 'COMPLETED', 'CANCELLED'].map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? 'bg-emerald-600 text-primary-contrast' : 'border bg-surface '}`}>{value.replaceAll('_', ' ')}</button>
        ))}
      </div>
      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading property bookings…</p></Card> : error ? <Card className="space-y-3 p-5"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card> : bookings.length === 0 ? <Card className="p-6 text-sm text-gray-600 ">No short-term bookings are recorded for these properties yet.</Card> : filtered.length === 0 ? <Card className="p-6 text-sm text-gray-600 ">No bookings match this status filter.</Card> : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const property = booking.property ?? booking.listing;
            const location = [property?.area, property?.city].filter(Boolean).join(', ');
            return <Card key={booking.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{property?.title ?? propertyTitles.get(booking.propertyId ?? booking.listingId ?? '') ?? 'Property details unavailable'}</h2>
                  {location && <p className="mt-1 text-sm text-gray-500">{location}</p>}
                  <p className="mt-2 text-sm">Guest: <strong>{booking.tenant?.fullName ?? 'Guest details unavailable'}</strong></p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800  ">{booking.status.replaceAll('_', ' ')}</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <p className="flex items-center gap-2"><CalendarDays size={15} />Check-in: {dateLabel(booking.startDate)}</p>
                <p>Check-out: {dateLabel(booking.endDate)}</p>
                <p>Guests: {booking.guests}</p>
                <p className="font-semibold">{booking.currency} {booking.totalAmount.toLocaleString()}</p>
                <p className="text-gray-500">Created {dateLabel(booking.createdAt)}</p>
              </div>
            </Card>;
          })}
          <p className="text-xs text-gray-500">The property-bookings endpoint does not currently provide pagination or a host-side booking status mutation.</p>
        </div>
      )}
    </div>
  );
}
