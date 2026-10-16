import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { ApiError } from '../../api/api-error';
import { useBookings, useCancelBooking } from '../../hooks/useRentraQueries';

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  guests: number;
  property?: { title?: string; area?: string; city?: string } | null;
  listing?: { id?: string; title?: string; area?: string; city?: string } | null;
}

const cancellableStatuses = new Set(['PENDING', 'PAYMENT_PENDING', 'HELD', 'CONFIRMED']);

export default function TenantBookings() {
  const bookingsQuery = useBookings<Booking>();
  const cancelMutation = useCancelBooking<Booking>();
  const bookings = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isPending;
  const error = bookingsQuery.error instanceof ApiError
    ? bookingsQuery.error.message
    : bookingsQuery.error
      ? 'Bookings could not be loaded. Please try again.'
      : '';
  const actionError = cancelMutation.error instanceof ApiError
    ? cancelMutation.error.message
    : cancelMutation.error
      ? 'Booking could not be cancelled. Please try again.'
      : '';
  const cancellingId = cancelMutation.isPending ? cancelMutation.variables : null;

  const cancelBooking = (id: string) => cancelMutation.mutate(id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header><h1 className="text-xl font-extrabold">My Bookings</h1><p className="text-sm text-gray-500">Manage your short-stay property bookings.</p></header>
      {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-600">{actionError}</p></Card>}
      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading your bookings…</p></Card>
        : error ? <Card className="p-5"><p role="alert" className="text-sm text-red-600">{error}</p><button onClick={() => void bookingsQuery.refetch()} className="mt-3 text-sm font-semibold text-emerald-700">Retry</button></Card>
          : bookings.length === 0 ? <Card className="p-8 text-center"><CalendarDays className="mx-auto mb-3 text-emerald-600" /><p className="text-sm text-gray-500">You do not have any bookings yet.</p></Card>
            : <div className="space-y-3">{bookings.map((booking) => {
              const property = booking.property ?? booking.listing;
              const location = [property?.area, property?.city].filter(Boolean).join(', ');
              return <Card key={booking.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{property?.title ?? 'Property details unavailable'}</h2>
                    {booking.listing?.id && <Link to={`/listings/${booking.listing.id}`} className="mt-1 inline-block text-xs font-semibold text-emerald-700 underline">View listing</Link>}
                    {location && <p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{location}</p>}
                    <p className="mt-2 text-sm text-gray-600">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-gray-500">{booking.guests} guest(s) · <span className={booking.status === 'CONFIRMED' ? 'font-semibold text-emerald-700' : booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'font-semibold text-red-600' : 'font-semibold'}>{booking.status.replaceAll('_', ' ')}</span></p>
                    <p className="mt-2 font-semibold text-emerald-700">PKR {booking.totalAmount.toLocaleString()}</p>
                    {booking.status === 'PAYMENT_PENDING' && <p className="mt-2 max-w-lg text-xs leading-5 text-gray-500">This booking is awaiting payment. Online payment is not currently configured; the booking status remains controlled by Rentra.</p>}
                  </div>
                  {cancellableStatuses.has(booking.status) && <button disabled={cancelMutation.isPending} onClick={() => cancelBooking(booking.id)} className="rounded border px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50">{cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}</button>}
                </div>
              </Card>;
            })}</div>}
    </div>
  );
}
