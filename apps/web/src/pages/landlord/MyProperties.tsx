import { useEffect, useState } from 'react';
import { MapPin, Pause, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Card from '../../components/ui/Card';

type Listing = { id: string; title: string; area: string; city: string; rent: number; bedrooms: number; bathrooms: number; sqft: number; status: string; availability: string; publicationStatus: string };

export default function MyProperties() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  useEffect(() => { api.get('/listings/landlord/my-listings').then((response) => setListings(response.data.data ?? [])); }, []);
  const toggleAvailability = async (listing: Listing) => {
    const availability = listing.availability === 'RENTED' ? 'AVAILABLE' : 'RENTED';
    await api.patch(`/listings/${listing.id}/availability`, { availability });
    setListings((items) => items.map((item) => item.id === listing.id ? { ...item, availability } : item));
  };
  return <div className="space-y-5"><header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">My Properties</h1><p className="text-sm text-gray-500">Manage your submitted, approved, and rented properties.</p></div><button onClick={() => navigate('/landlord/post')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus size={16} /> Post property</button></header><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{listings.map((listing) => <Card key={listing.id}><div className="flex justify-between gap-3"><div><h2 className="font-bold">{listing.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin size={13} /> {listing.area}, {listing.city}</p></div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${listing.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : listing.availability === 'RENTED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{listing.status === 'PENDING' ? 'Pending review' : listing.availability === 'RENTED' ? 'Rented' : 'Active'}</span></div><p className="mt-4 text-xl font-bold text-emerald-600">Rs. {listing.rent.toLocaleString()} <span className="text-xs font-normal text-gray-500">/ month</span></p><div className="mt-2 text-xs text-gray-500">{listing.bedrooms} beds · {listing.bathrooms} baths · {listing.sqft} sqft</div><div className="mt-4 flex gap-2"><button onClick={() => void toggleAvailability(listing)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">{listing.availability === 'RENTED' ? <Play size={14} /> : <Pause size={14} />}{listing.availability === 'RENTED' ? 'Mark available' : 'Mark rented'}</button><button onClick={() => navigate(`/tenant/listings/${listing.id}`)} className="rounded-lg border px-3 py-2 text-xs font-semibold">View</button></div></Card>)}</div>{listings.length === 0 && <p className="text-sm text-gray-500">No properties found.</p>}</div>;
}
