import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import { availabilityAPI, type AvailabilityQuery } from '../../api/availability';
import { listingsAPI } from '../../api/listings';
import { toApiError } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';

interface OwnedListing {
  id: string;
  propertyId?: string | null;
  title: string;
  publicationStatus?: string;
  property?: { status?: string } | null;
}

interface AvailabilityDay {
  date: string;
  status: string;
  blockedReason?: string | null;
}

interface AvailabilityResponse {
  propertyId: string;
  rentalMode: string;
  granularity: string;
  startDate: string;
  endDate: string;
  dates: AvailabilityDay[];
}

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const nextDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return dateOnly(date);
};

export default function LandlordAvailability() {
  const user = useAuthStore((state) => state.user);
  const [properties, setProperties] = useState<OwnedListing[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState(dateOnly(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return dateOnly(date);
  });
  const [status, setStatus] = useState<'BLOCKED' | 'MAINTENANCE'>('BLOCKED');
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setError('Sign in again to manage property availability.');
      setLoadingProperties(false);
      return () => { active = false; };
    }
    setLoadingProperties(true);
    listingsAPI.getMyListings<OwnedListing>({ page: 1, limit: 100 })
      .then((records) => {
        if (!active) return;
        const manageable = records.filter(
          (listing) =>
            listing.propertyId &&
            listing.publicationStatus === 'PUBLISHED' &&
            listing.property?.status === 'ACTIVE',
        );
        setProperties(manageable);
        setPropertyId((current) => current || manageable[0]?.propertyId || '');
      })
      .catch((cause: unknown) => { if (active) setError(toApiError(cause).message || 'Properties could not be loaded.'); })
      .finally(() => { if (active) setLoadingProperties(false); });
    return () => { active = false; };
  }, [reload, user?.id]);

  useEffect(() => {
    let active = true;
    if (!propertyId || !startDate || !endDate) {
      setAvailability(null);
      return () => { active = false; };
    }
    setLoadingDates(true);
    setError('');
    const query: AvailabilityQuery = { startDate, endDate };
    availabilityAPI.forProperty(propertyId, query)
      .then((result) => { if (active) setAvailability(result as AvailabilityResponse); })
      .catch((cause: unknown) => { if (active) setError(toApiError(cause).message || 'Availability could not be loaded.'); })
      .finally(() => { if (active) setLoadingDates(false); });
    return () => { active = false; };
  }, [propertyId, startDate, endDate, reload]);

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) return 'Choose a start date and end date.';
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (days <= 0) return 'End date must be after the start date.';
    if (days > 366) return 'Availability ranges cannot exceed 366 days.';
    return '';
  }, [startDate, endDate]);

  const changeAvailability = async (operation: 'block' | 'unblock', day?: string) => {
    if (!propertyId || dateRangeError || saving) return;
    const from = day ?? startDate;
    const until = day ? nextDate(day) : endDate;
    setSaving(true);
    setError('');
    try {
      if (operation === 'block') {
        await availabilityAPI.block(propertyId, { startDate: from, endDate: until, status, reason: reason.trim() || undefined });
      } else {
        await availabilityAPI.unblock(propertyId, { startDate: from, endDate: until });
      }
      setReload((value) => value + 1);
    } catch (cause) {
      setError(toApiError(cause).message || 'Availability could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Availability</h1><p className="mt-1 text-sm text-gray-500">Availability and reservations are read from the backend. Confirmed bookings cannot be blocked.</p></div>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><RefreshCw size={15} />Refresh</button>
      </header>
      {loadingProperties ? <Card className="p-5 text-sm text-gray-500">Loading your properties…</Card> : properties.length === 0 ? <Card className="p-5 text-sm text-gray-600">No linked properties are available for availability management yet.</Card> : (
        <>
          <Card className="grid gap-4 p-5 md:grid-cols-2">
            <label className="block text-sm font-semibold">Property
              <select className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm " value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                {properties.map((item) => <option key={item.propertyId} value={item.propertyId!}>{item.title}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">Start date<input type="date" className="mt-1 w-full rounded-lg border bg-surface px-2 py-2 text-sm " value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
              <label className="block text-sm font-semibold">End date (exclusive)<input type="date" className="mt-1 w-full rounded-lg border bg-surface px-2 py-2 text-sm " value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] md:col-span-2">
              <label className="block text-sm font-semibold">Mark selected range
                <select className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm " value={status} onChange={(event) => setStatus(event.target.value as 'BLOCKED' | 'MAINTENANCE')}><option value="BLOCKED">Blocked</option><option value="MAINTENANCE">Maintenance</option></select>
              </label>
              <label className="block text-sm font-semibold">Reason (optional)<input className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm " maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <button type="button" disabled={saving || Boolean(dateRangeError) || !propertyId} onClick={() => void changeAvailability('block')} className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">{saving ? 'Saving…' : 'Block dates'}</button>
            </div>
            {dateRangeError && <p role="alert" className="text-sm text-amber-700 md:col-span-2">{dateRangeError}</p>}
          </Card>
          {error && <Card className="flex flex-wrap items-center justify-between gap-3 p-4"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card>}
          {loadingDates ? <Card className="p-5 text-sm text-gray-500">Loading availability…</Card> : availability && (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4"><div className="flex items-center gap-2"><CalendarDays size={18} className="text-emerald-600" /><h2 className="font-bold">Daily availability</h2></div><span className="text-xs text-gray-500">{availability.rentalMode.replaceAll('_', ' ')} · {availability.granularity}</span></div>
              {availability.dates.length === 0 ? <p className="p-5 text-sm text-gray-500">No daily rows were returned for this date range.</p> : <div className="divide-y">
                {availability.dates.map((day) => {
                  const unavailable = ['BLOCKED', 'MAINTENANCE'].includes(day.status);
                  return <div key={day.date} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-medium">{new Date(`${day.date}T00:00:00.000Z`).toLocaleDateString()}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${day.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : day.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{day.status.replaceAll('_', ' ')}</span>
                    {day.blockedReason && <span className="min-w-0 flex-1 text-xs text-gray-500">{day.blockedReason}</span>}
                    {unavailable && <button type="button" disabled={saving} onClick={() => void changeAvailability('unblock', day.date)} className="text-xs font-semibold text-emerald-700 disabled:opacity-50">Remove block</button>}
                  </div>;
                })}
              </div>}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
