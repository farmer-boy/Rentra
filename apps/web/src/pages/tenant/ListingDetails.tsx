import { useEffect, useState } from 'react';
import { Bath, BedDouble, Check, Heart, MapPin, MessageCircle, Ruler, ShieldCheck, Star } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { listingsAPI } from '../../api/listings';
import { propertiesAPI } from '../../api/properties';
import { reviewsAPI, type PropertyReviewRecord } from '../../api/reviews';
import { messagesAPI } from '../../api/messages';
import { availabilityAPI } from '../../api/availability';
import { bookingsAPI } from '../../api/bookings';
import { rentalRequestsAPI } from '../../api/rentalRequests';
import { ApiError, toApiError } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';
import {
  rentraQueryKeys,
  useFavoriteStatus,
  useListingDetails,
  useListingReviewSummary,
  useToggleFavorite,
} from '../../hooks/useRentraQueries';

type Listing = {
  id: string; title: string; description: string; city: string; area: string; address: string; type: string; rent: number; deposit: number;
  propertyId?: string; isRentraVerified?: boolean; latitude?: number | null; longitude?: number | null;
  bedrooms: number; bathrooms: number; sqft: number; furnishedStatus: string; rentalDuration: string; availableFrom?: string; photos?: string[];
  images?: Array<{ url: string; altText?: string }>; amenities?: Array<{ amenity: { name: string } }>;
  hostelDetails?: { buildingName: string; availableBeds: number; bedCapacity: number; genderPolicy: string; messIncluded: boolean; wifiIncluded: boolean; laundryIncluded: boolean; electricityIncluded: boolean; securityIncluded: boolean };
  hostelRooms?: Array<{ id: string; roomNumber: string; roomType: string; price: number; beds: Array<{ id: string; bedNumber: string; status: string }> }>;
  _count?: { propertyViews: number; favorites: number; rentalRequests: number };
  landlord: { id: string; fullName: string; isVerified: boolean; trustScore?: number };
};

type RoomType = {
  id: string;
  name: string;
  capacity: number;
  price: number;
  rooms: Array<{ id: string; roomNumber: string; capacity: number; basePrice: number; isAvailable: boolean }>;
};

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = Boolean(
    location.pathname.startsWith('/admin/') || user?.roles?.includes('ADMIN') || user?.role === 'ADMIN',
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedHotelRoomId, setSelectedHotelRoomId] = useState('');
  const [selectedHostelBedId, setSelectedHostelBedId] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [duration, setDuration] = useState(12);
  const [requestMessage, setRequestMessage] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const listingQuery = useListingDetails<Listing>(id ?? '');
  const listing = listingQuery.data;
  const favoriteQuery = useFavoriteStatus(id ?? '', isAuthenticated);
  const ratingQuery = useListingReviewSummary(id ?? '');
  const propertyReviewsQuery = useQuery({
    queryKey: ['reviews', 'property', id, 1],
    queryFn: () => reviewsAPI.getForProperty(id ?? '', { page: 1, limit: 5 }),
    enabled: Boolean(id),
  });
  const roomTypesQuery = useQuery({
    queryKey: ['properties', 'room-types', listing?.propertyId],
    queryFn: () => propertiesAPI.getRoomTypes<RoomType>(listing?.propertyId ?? ''),
    enabled: Boolean(listing?.propertyId && ['HOTEL', 'GUEST_HOUSE'].includes(listing.type)),
  });
  const toggleFavorite = useToggleFavorite();
  const saved = favoriteQuery.data?.saved ?? false;
  const rating = ratingQuery.data;
  const error = listingQuery.error instanceof ApiError
    ? listingQuery.error.message
    : listingQuery.error
      ? 'Property could not be loaded.'
      : '';
  const loading = listingQuery.isPending;
  const ratingError = ratingQuery.isError;
  useEffect(() => {
    if (!id || isAdmin) return;
    const sessionKey = 'rentra-view-session';
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(sessionKey, sessionId); }
    listingsAPI.recordView(id, sessionId).catch(() => {
      console.warn('Could not record property view.');
    });
  }, [id, isAdmin]);

  if (error) return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 pb-8 sm:px-5 lg:px-6">
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
    </div>
  );
  if (loading || !listing) return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 pb-8 sm:px-5 lg:px-6">
      <div role="status" className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">Loading property details…</div>
    </div>
  );

  const gallery = listing.images?.length ? listing.images.map((image) => image.url) : listing.photos ?? [];
  const amenities = listing.amenities?.map((item) => item.amenity.name) ?? [];
  const locationLabel = [listing.area, listing.city].filter(Boolean).join(', ');
  const toggleSaved = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ id: listing.id, saved });
      toast.success(saved ? 'Removed from saved properties' : 'Property saved');
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : 'Could not update saved properties.');
    }
  };
  const startChat = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    try {
      const conversation = await messagesAPI.getOrCreateConversation(listing.landlord.id, listing.id);
      const otherParticipant = conversation.participant1Id === user?.id
        ? conversation.participant2
        : conversation.participant1;
      navigate('/dashboard/messages', {
        state: { conversation: { ...conversation, otherParticipant } },
      });
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Could not start a conversation.');
    }
  };
  const submitRentalRequest = async () => {
    if (!listing.propertyId || !user) return;
    setActionPending(true);
    try {
      await rentalRequestsAPI.create(listing.propertyId, {
        moveInDate: moveInDate || undefined,
        duration,
        occupants: guests,
        message: requestMessage.trim() || undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rental-requests'] }),
        queryClient.invalidateQueries({ queryKey: rentraQueryKeys.notifications }),
      ]);
      toast.success('Rental request sent to the landlord.');
      navigate('/dashboard/my-requests');
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Could not submit the rental request.');
    } finally {
      setActionPending(false);
    }
  };
  const submitBooking = async () => {
    if (!listing.propertyId) return;
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      toast.error('Choose a valid check-in and check-out date.');
      return;
    }
    if (usesHotelInventory && !selectedHotelRoomId) {
      toast.error('Select an available room before continuing.');
      return;
    }
    if (usesHostelInventory && !selectedHostelBedId) {
      toast.error('Select an available bed before continuing.');
      return;
    }
    setActionPending(true);
    try {
      const availability = await availabilityAPI.forProperty(listing.propertyId, {
        startDate: checkIn,
        endDate: checkOut,
        ...(selectedHotelRoomId && { hotelRoomId: selectedHotelRoomId }),
        ...(selectedHostelBedId && { hostelBedId: selectedHostelBedId }),
      }) as { dates?: Array<{ status: string }> };
      if (!availability.dates?.length || availability.dates.some((day) => day.status !== 'AVAILABLE')) {
        toast.error('The property is not available for all selected dates.');
        return;
      }
      await bookingsAPI.create({
        propertyId: listing.propertyId,
        checkIn,
        checkOut,
        guests,
        ...(selectedHotelRoomId && { hotelRoomId: selectedHotelRoomId }),
        ...(selectedHostelBedId && { hostelBedId: selectedHostelBedId }),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rentraQueryKeys.bookings }),
        queryClient.invalidateQueries({ queryKey: rentraQueryKeys.notifications }),
      ]);
      toast.success('Booking request created. Check its status in your bookings.');
      navigate('/dashboard/my-bookings');
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Could not create the booking.');
    } finally {
      setActionPending(false);
    }
  };
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const canRent = roles.includes('TENANT');
  const isShortTerm = ['DAILY', 'NIGHTLY', 'WEEKLY'].includes(listing.rentalDuration);
  const usesHotelInventory = ['HOTEL', 'GUEST_HOUSE'].includes(listing.type);
  const usesHostelInventory = listing.type === 'HOSTEL';
  const hotelRoomOptions = roomTypesQuery.data?.flatMap((roomType) =>
    roomType.rooms.filter((room) => room.isAvailable).map((room) => ({
      ...room,
      typeName: roomType.name,
    })),
  ) ?? [];
  const hostelBedOptions = listing.hostelRooms?.flatMap((room) =>
    room.beds.filter((bed) => bed.status === 'AVAILABLE').map((bed) => ({
      ...bed,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
    })),
  ) ?? [];
  const reviews: PropertyReviewRecord[] = propertyReviewsQuery.data?.data ?? [];
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 pb-10 text-text sm:px-5 lg:px-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
          <div className="relative h-[min(55vw,440px)] min-h-[260px] overflow-hidden rounded-xl bg-surface2">
            {gallery[selectedImage]
              ? <img src={gallery[selectedImage]} alt={listing.title} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center text-sm text-text-muted">No property image available</div>}
            {listing.isRentraVerified && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-surface px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
                <ShieldCheck size={14} /> Rentra verified
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((image, index) => (
                <button key={image} onClick={() => setSelectedImage(index)} aria-label={`Show image ${index + 1}`} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === selectedImage ? 'border-emerald-500' : 'border-transparent'}`}>
                  <img src={image} alt={`${listing.title} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="border-b border-border pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{listing.type.replaceAll('_', ' ')}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{listing.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted"><MapPin size={15} className="shrink-0 text-primary" /> {locationLabel || 'Location not provided'}</p>
          </div>
          <div className="flex min-h-10 items-center gap-2 rounded-lg bg-surface2 px-3 py-2">
            <Star size={16} className="text-amber-500" />
            {ratingError ? <span className="text-sm text-text-muted">Rating information is unavailable.</span>
              : rating?.count ? <><strong>{Number(rating.averageRating).toFixed(1)}</strong><span className="text-sm text-text-muted">from {rating.count} {rating.count === 1 ? 'review' : 'reviews'}</span></>
                : rating ? <span className="text-sm text-text-muted">No reviews yet</span>
                  : <span className="text-sm text-text-muted">Loading rating...</span>}
          </div>
          <p className="text-3xl font-extrabold text-primary">
            Rs. {listing.rent.toLocaleString()} <span className="text-sm font-medium text-text-muted">/ {listing.rentalDuration.toLowerCase().replaceAll('_', ' ')}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-border bg-surface2/50 p-3"><BedDouble className="mx-auto mb-1 text-primary" size={19} /><strong>{listing.bedrooms}</strong><p className="text-xs text-text-muted">Bedrooms</p></div>
            <div className="rounded-xl border border-border bg-surface2/50 p-3"><Bath className="mx-auto mb-1 text-primary" size={19} /><strong>{listing.bathrooms}</strong><p className="text-xs text-text-muted">Bathrooms</p></div>
            <div className="rounded-xl border border-border bg-surface2/50 p-3"><Ruler className="mx-auto mb-1 text-primary" size={19} /><strong>{listing.sqft.toLocaleString()}</strong><p className="text-xs text-text-muted">sqft</p></div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Check size={13} className="mr-1 inline" />{listing.furnishedStatus.replaceAll('_', ' ')}</span>
            {amenities.map((amenity) => <span key={amenity} className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted">{amenity}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div><p className="text-xs text-text-muted">Security deposit</p><p className="mt-1 font-semibold">{listing.deposit ? `Rs. ${listing.deposit.toLocaleString()}` : 'Not specified'}</p></div>
            <div><p className="text-xs text-text-muted">Available from</p><p className="mt-1 font-semibold">{listing.availableFrom ? new Date(listing.availableFrom).toLocaleDateString() : 'Now / not specified'}</p></div>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">About this property</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-text-muted">{listing.description || 'The landlord has not added a description yet.'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">Location</h2>
            <div className="rounded-xl border border-border bg-surface2 p-4 text-sm">
              <p className="font-semibold">{locationLabel}</p>
              <p className="mt-1 text-text-muted">{listing.address || 'Street address not provided'}</p>
            </div>
            {typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
              ? <div className="mt-3 h-64 overflow-hidden rounded-xl border">
                <MapContainer center={[listing.latitude, listing.longitude]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <CircleMarker center={[listing.latitude, listing.longitude]} radius={8} pathOptions={{ color: 'rgb(var(--rentra-primary))' }} />
                </MapContainer>
              </div>
              : <p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-text-muted">Map location has not been provided for this listing.</p>}
          </div>
          {listing.hostelDetails && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Hostel facilities</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Available beds', `${listing.hostelDetails.availableBeds} / ${listing.hostelDetails.bedCapacity}`],
                  ['Gender', listing.hostelDetails.genderPolicy],
                  ['Mess', listing.hostelDetails.messIncluded ? 'Included' : 'Not included'],
                  ['WiFi', listing.hostelDetails.wifiIncluded ? 'Included' : 'Not included'],
                  ['Laundry', listing.hostelDetails.laundryIncluded ? 'Included' : 'Not included'],
                  ['Security', listing.hostelDetails.securityIncluded ? 'Included' : 'Not included'],
                ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-surface2/50 p-3"><span className="text-xs text-text-muted">{label}</span><p className="font-semibold">{value}</p></div>)}
              </div>
            </div>
          )}
          <section aria-labelledby="property-reviews-heading" className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 id="property-reviews-heading" className="mb-3 text-lg font-bold">Guest reviews</h2>
            {propertyReviewsQuery.isPending ? <p className="text-sm text-text-muted">Loading reviews...</p>
              : propertyReviewsQuery.isError ? <div role="alert" className="text-sm text-red-600">Reviews could not be loaded. <button onClick={() => void propertyReviewsQuery.refetch()} className="underline">Retry</button></div>
                : reviews.length ? <div className="space-y-3">{reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-border bg-surface2/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">{review.user?.fullName ?? 'Rentra user'}</p>
                      <span className="inline-flex items-center gap-1 text-sm"><Star size={14} className="text-amber-500" /> {review.rating}/5</span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                    {review.comment && <p className="mt-3 text-sm leading-6 text-text-muted">{review.comment}</p>}
                  </article>
                ))}</div>
                  : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">No property reviews have been posted yet.</p>}
          </section>
        </div>

        <aside className="h-fit space-y-4 md:sticky md:top-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="border-b border-border pb-3 text-lg font-bold">Landlord and contact</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{listing.landlord.fullName.slice(0, 1) || '?'}</div>
            <div><p className="font-bold">{listing.landlord.fullName}</p><p className="text-xs text-text-muted">Property owner</p></div>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-surface2/50 p-3 text-sm">
            {listing.landlord.isVerified && <p className="font-medium text-primary"><ShieldCheck size={15} className="mr-1 inline" />Identity verified</p>}
            <p className="flex items-center gap-1"><Star size={15} className="text-amber-500" /> Trust Score: <strong>{listing.landlord.trustScore ?? 'Not available'}{listing.landlord.trustScore != null ? '/100' : ''}</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => void toggleSaved()} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-surface2"><Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}</button>
            <button onClick={() => void startChat()} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-surface2"><MessageCircle size={16} /> Chat</button>
          </div>
          {listing.propertyId && canRent ? (
            <div className="space-y-3 border-t border-border pt-4">
              {isShortTerm ? <>
                <h3 className="font-semibold">Book a stay</h3>
                <label className="block text-xs">Check-in<input type="date" min={new Date().toISOString().slice(0, 10)} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-xs">Check-out<input type="date" min={checkIn || new Date().toISOString().slice(0, 10)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-xs">Guests<input type="number" min={1} max={100} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                {usesHotelInventory && (roomTypesQuery.isError
                  ? <div role="alert" className="text-xs text-red-600">Room inventory could not be loaded. <button onClick={() => void roomTypesQuery.refetch()} className="underline">Retry</button></div>
                  : <label className="block text-xs">Available hotel / guest-house room
                    <select value={selectedHotelRoomId} onChange={(event) => setSelectedHotelRoomId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
                      <option value="">{roomTypesQuery.isPending ? 'Loading room inventory...' : 'Select a room'}</option>
                      {hotelRoomOptions.map((room) => <option key={room.id} value={room.id}>{room.typeName} · Room {room.roomNumber} · Rs. {room.basePrice.toLocaleString()}</option>)}
                    </select>
                  </label>)}
                {usesHotelInventory && !roomTypesQuery.isPending && !roomTypesQuery.isError && hotelRoomOptions.length === 0 && <p className="text-xs text-amber-700">No available room inventory is currently listed.</p>}
                {usesHostelInventory && <label className="block text-xs">Available hostel bed
                  <select value={selectedHostelBedId} onChange={(event) => setSelectedHostelBedId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15">
                    <option value="">Select a bed</option>
                    {hostelBedOptions.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.roomNumber} · Bed {bed.bedNumber} · Rs. {bed.price.toLocaleString()}</option>)}
                  </select>
                </label>}
                {usesHostelInventory && hostelBedOptions.length === 0 && <p className="text-xs text-amber-700">No available hostel beds are currently listed.</p>}
                <button disabled={actionPending || roomTypesQuery.isPending || (usesHotelInventory && (roomTypesQuery.isError || hotelRoomOptions.length === 0)) || (usesHostelInventory && hostelBedOptions.length === 0)} onClick={() => void submitBooking()} className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">
                  {actionPending ? 'Checking availability...' : 'Check availability and request booking'}
                </button>
                <p className="text-xs leading-5 text-gray-500">The backend rechecks the selected dates, inventory, and price. A booking request is not a completed or paid reservation. Online payment is not currently configured.</p>
              </> : <>
                <h3 className="font-semibold">Request this rental</h3>
                <label className="block text-xs">Move-in date<input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-xs">Duration (months)<input type="number" min={1} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-xs">Occupants<input type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-xs">Message (optional)<textarea maxLength={2000} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <button disabled={actionPending} onClick={() => void submitRentalRequest()} className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">{actionPending ? 'Sending request...' : 'Send rental request'}</button>
              </>}
            </div>
          ) : listing.propertyId && !isAuthenticated ? (
            <button onClick={() => navigate('/login', { state: { from: `${location.pathname}${location.search}` } })} className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-contrast">Sign in to rent or book</button>
          ) : !listing.propertyId ? (
            <p className="text-xs text-gray-500">Online rental requests and bookings are unavailable because this listing has no linked property record.</p>
          ) : <p className="text-xs text-gray-500">Rental requests and bookings are available to tenant accounts.</p>}
        </aside>
      </section>
    </div>
  );
}
