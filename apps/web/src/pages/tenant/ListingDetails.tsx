import { useEffect, useState } from 'react';
import { ArrowLeft, Bath, BedDouble, Check, Heart, MapPin, MessageCircle, Phone, Ruler, ShieldCheck, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';

type Listing = {
  id: string; title: string; description: string; city: string; area: string; address: string; type: string; rent: number; deposit: number;
  bedrooms: number; bathrooms: number; sqft: number; furnishedStatus: string; rentalDuration: string; availableFrom?: string; photos?: string[];
  images?: Array<{ url: string; altText?: string }>; amenities?: Array<{ amenity: { name: string } }>;
  hostelDetails?: { buildingName: string; availableBeds: number; bedCapacity: number; genderPolicy: string; messIncluded: boolean; wifiIncluded: boolean; laundryIncluded: boolean; electricityIncluded: boolean; securityIncluded: boolean };
  _count?: { propertyViews: number; favorites: number; rentalRequests: number };
  landlord: { id: string; fullName: string; email: string; phone: string; cnic?: string; isVerified: boolean; trustScore?: number };
};

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    const sessionKey = 'rentra-view-session';
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(sessionKey, sessionId); }
    api.get(`/listings/${id}`).then((response) => { if (active) setListing(response.data.data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Property could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    api.get(`/favorites/${id}`).then((response) => { if (active) setSaved(Boolean(response.data.saved)); }).catch(() => undefined);
    api.post(`/listings/${id}/view`, { sessionId }).catch(() => undefined);
    api.get(`/reviews/listing/${id}`).then((response) => {
      if (active) setRating(response.data.count ? { average: Number(response.data.averageRating), count: response.data.count } : { average: 0, count: 0 });
    }).catch(() => { if (active) setRatingError('Rating information is unavailable.'); });
    return () => { active = false; };
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (loading || !listing) return <p className="text-sm text-gray-500">Loading property...</p>;

  const gallery = listing.images?.length ? listing.images.map((image) => image.url) : listing.photos ?? [];
  const amenities = listing.amenities?.map((item) => item.amenity.name) ?? [];
  const location = [listing.area, listing.city].filter(Boolean).join(', ');
  const toggleSaved = async () => {
    try {
      if (saved) await api.delete(`/favorites/${listing.id}`);
      else await api.post(`/favorites/${listing.id}`);
      setSaved(!saved); toast.success(saved ? 'Removed from saved properties' : 'Property saved');
    } catch { toast.error('Please sign in to save properties.'); }
  };
  const startChat = async () => {
    try { await api.post(`/messages/conversation/${listing.landlord.id}`, {}, { params: { listingId: listing.id } }); navigate('/tenant/messages'); }
    catch { toast.error('Please sign in to start a chat.'); }
  };
  return <div className="max-w-5xl space-y-6 pb-8">
    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"><ArrowLeft size={17} /> Back</button>
    <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-6">
      <section className="space-y-3">
        <div className="h-[min(55vw,440px)] min-h-[280px] rounded-2xl overflow-hidden bg-gray-100">{gallery[selectedImage] ? <img src={gallery[selectedImage]} alt={listing.title} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400">No property image</div>}</div>
        {gallery.length > 1 && <div className="flex gap-2 overflow-x-auto">{gallery.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === selectedImage ? 'border-emerald-500' : 'border-transparent'}`}><img src={image} alt={`${listing.title} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
      </section>
      <section className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{listing.type.replace('_', ' ')}</p><h1 className="mt-1 text-3xl font-extrabold">{listing.title}</h1><p className="mt-2 flex items-center gap-1 text-sm text-gray-500"><MapPin size={15} /> {location}</p></div><div className="flex items-center gap-2"><Star size={16} className="text-amber-500" />{ratingError ? <span className="text-sm text-gray-500">{ratingError}</span> : rating ? rating.count > 0 ? <><strong>{rating.average.toFixed(1)}</strong><span className="text-sm text-gray-500">from {rating.count} {rating.count === 1 ? 'review' : 'reviews'}</span></> : <span className="text-sm text-gray-500">No reviews yet</span> : <span className="text-sm text-gray-500">Loading rating...</span>}</div><p className="text-3xl font-extrabold text-emerald-600">Rs. {listing.rent.toLocaleString()} <span className="text-sm font-medium text-gray-500">/ {listing.rentalDuration.toLowerCase().replace('_', ' ')}</span></p><div className="grid grid-cols-3 gap-2 border-y py-4 text-center"><div><BedDouble className="mx-auto mb-1 text-emerald-600" size={19} /><strong>{listing.bedrooms}</strong><p className="text-xs text-gray-500">Bedrooms</p></div><div><Bath className="mx-auto mb-1 text-emerald-600" size={19} /><strong>{listing.bathrooms}</strong><p className="text-xs text-gray-500">Bathrooms</p></div><div><Ruler className="mx-auto mb-1 text-emerald-600" size={19} /><strong>{listing.sqft.toLocaleString()}</strong><p className="text-xs text-gray-500">sqft</p></div></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Check size={13} className="mr-1 inline" />{listing.furnishedStatus.replace('_', ' ')}</span>{amenities.slice(0, 5).map((amenity) => <span key={amenity} className="rounded-full bg-gray-100 px-3 py-1 text-xs">✓ {amenity}</span>)}</div></section>
    </div>
    <section className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6"><div className="space-y-6"><div><h2 className="mb-2 text-lg font-bold">Description</h2><p className="whitespace-pre-line text-sm leading-7 text-gray-600">{listing.description}</p></div><div><h2 className="mb-2 text-lg font-bold">Location</h2><div className="rounded-xl border bg-gray-50 p-4 text-sm"><p className="font-semibold">{location}</p><p className="mt-1 text-gray-500">{listing.address}</p></div></div>{listing.hostelDetails && <div><h2 className="mb-2 text-lg font-bold">Hostel facilities</h2><div className="grid grid-cols-2 gap-2 text-sm">{[['Available beds', `${listing.hostelDetails.availableBeds} / ${listing.hostelDetails.bedCapacity}`], ['Gender', listing.hostelDetails.genderPolicy], ['Mess', listing.hostelDetails.messIncluded ? 'Included' : 'Not included'], ['WiFi', listing.hostelDetails.wifiIncluded ? 'Included' : 'Not included'], ['Laundry', listing.hostelDetails.laundryIncluded ? 'Included' : 'Not included'], ['Security', listing.hostelDetails.securityIncluded ? 'Included' : 'Not included']].map(([label, value]) => <div key={label} className="rounded-lg border p-3"><span className="text-xs text-gray-500">{label}</span><p className="font-semibold">{value}</p></div>)}</div></div>}</div><aside className="h-fit rounded-2xl border p-5 space-y-4"><h2 className="text-lg font-bold">Landlord</h2><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">{listing.landlord.fullName.slice(0, 1)}</div><div><p className="font-bold">{listing.landlord.fullName}</p><p className="text-xs text-gray-500">Property owner</p></div></div><div className="space-y-2 text-sm">{listing.landlord.isVerified && <p className="text-emerald-700"><ShieldCheck size={15} className="mr-1 inline" />Identity verified</p>}<p className="flex items-center gap-1"><Star size={15} className="text-amber-500" /> Trust Score: <strong>{listing.landlord.trustScore ?? 'Not available'}{listing.landlord.trustScore != null ? '/100' : ''}</strong></p></div><div className="grid grid-cols-2 gap-2"><button onClick={toggleSaved} className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"><Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}</button><button onClick={startChat} className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"><MessageCircle size={16} /> Chat</button><a href={`tel:${listing.landlord.phone}`} className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold"><Phone size={16} /> Contact</a></div><p className="text-xs text-gray-500">Rental requests cannot be submitted here because there is no rental-request endpoint for listings.</p></aside></section>
  </div>;
}
