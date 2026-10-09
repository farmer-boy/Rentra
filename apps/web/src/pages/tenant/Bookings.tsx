import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/ui/Card';

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  guests: number;
  property?: { title?: string; area?: string; city?: string } | null;
  listing?: { title?: string; area?: string; city?: string } | null;
}

const getErrorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? 'Bookings could not be loaded. Please try again.';

const cancellableStatuses = new Set(['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED']);

export default function TenantBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Booking[]>('/bookings/my');
      if (!Array.isArray(response.data)) throw new Error('Invalid booking response.');
      setBookings(response.data);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBookings(); }, [loadBookings]);

  const cancelBooking = async (id: string) => {
    setCancellingId(id);
    setActionError('');
    try {
      const response = await api.patch<Booking>(`/bookings/${id}/cancel`);
      setBookings((current) => current.map((booking) => booking.id === id ? response.data : booking));
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header><h1 className="text-xl font-extrabold">My Bookings</h1><p className="text-sm text-gray-500">Manage your short-stay property bookings.</p></header>
      {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-600">{actionError}</p></Card>}
      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading your bookings…</p></Card>
        : error ? <Card className="p-5"><p role="alert" className="text-sm text-red-600">{error}</p><button onClick={() => void loadBookings()} className="mt-3 text-sm font-semibold text-emerald-700">Retry</button></Card>
          : bookings.length === 0 ? <Card className="p-8 text-center"><CalendarDays className="mx-auto mb-3 text-emerald-600" /><p className="text-sm text-gray-500">You do not have any bookings yet.</p></Card>
            : <div className="space-y-3">{bookings.map((booking) => {
              const property = booking.property ?? booking.listing;
              const location = [property?.area, property?.city].filter(Boolean).join(', ');
              return <Card key={booking.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{property?.title ?? 'Property details unavailable'}</h2>
                    {location && <p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{location}</p>}
                    <p className="mt-2 text-sm text-gray-600">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-gray-500">{booking.guests} guest(s) · {booking.status.replaceAll('_', ' ')}</p>
                    <p className="mt-2 font-semibold text-emerald-700">PKR {booking.totalAmount.toLocaleString()}</p>
                  </div>
                  {cancellableStatuses.has(booking.status) && <button disabled={cancellingId !== null} onClick={() => void cancelBooking(booking.id)} className="rounded border px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50">{cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}</button>}
                </div>
              </Card>;
            })}</div>}
    </div>
  );
}
