import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/client';
import Card from '../../components/ui/Card';

const propertyTypes = ['HOSTEL', 'HOTEL', 'GUEST_HOUSE', 'HOUSE', 'APARTMENT', 'FLAT', 'ROOM', 'PORTION', 'STUDIO', 'FARMHOUSE', 'PG', 'SHARED_ROOM'];
const furnishing = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
const durations = ['DAILY', 'NIGHTLY', 'WEEKLY', 'MONTHLY', 'LONG_TERM'];
const amenities = ['WiFi', 'Parking', 'Electricity', 'Gas', 'Water', 'Generator', 'AC', 'Heating', 'Laundry', 'Security', 'CCTV', 'Lift', 'Furnished', 'Kitchen', 'Mess'];
const markerIcon = new L.DivIcon({ className: 'rentra-marker', html: '<span>Rs</span>', iconSize: [42, 30], iconAnchor: [21, 30] });

type Listing = {
  id: string; title: string; city: string; area: string; type: string; rent: number; bedrooms: number; bathrooms: number; sqft: number;
  furnishedStatus: string; rentalDuration: string; latitude?: number; longitude?: number; images?: Array<{ url: string }>;
  hostelDetails?: { availableBeds: number; genderPolicy: string };
};
type Filters = Record<string, string>;

function FitMap({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    const points = listings.filter((item) => item.latitude !== undefined && item.longitude !== undefined).map((item) => [item.latitude!, item.longitude!] as [number, number]);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [35, 35] });
  }, [listings, map]);
  return null;
}

export default function BrowseListings() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<Filters>({ city: 'Lahore', area: '', propertyType: '', minRent: '', maxRent: '', bedrooms: '', bathrooms: '', furnishedStatus: '', rentalDuration: '', gender: '', availableFrom: '' });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    setLoading(true); setError('');
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, amenities: selectedAmenities.join(',') }).filter(([, value]) => value));
      const response = await api.get('/listings', { params });
      setListings(response.data.data ?? []);
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Could not load properties.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void search(); }, []);
  const setFilter = (name: string, value: string) => setFilters((current) => ({ ...current, [name]: value }));
  const toggleAmenity = (name: string) => setSelectedAmenities((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  const mappedListings = listings.filter((listing) => listing.latitude !== undefined && listing.longitude !== undefined);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-extrabold tracking-tight">Find your next home</h2><p className="text-sm text-gray-500">Search by location, budget, and facilities.</p></div><div className="flex rounded-lg border p-1 bg-white dark:bg-[#151515]"><button onClick={() => setMode('list')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${mode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>LIST</button><button onClick={() => setMode('map')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${mode === 'map' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>MAP</button></div></header>
      <section className="border rounded-xl p-4 space-y-4 bg-white dark:bg-[#151515]"><div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3"><input aria-label="City" value={filters.city} onChange={(event) => setFilter('city', event.target.value)} placeholder="Where do you want to live? City" className="border rounded-lg px-3 py-2 text-sm" /><input aria-label="Area" value={filters.area} onChange={(event) => setFilter('area', event.target.value)} placeholder="Area e.g. Johar Town" className="border rounded-lg px-3 py-2 text-sm" /><button onClick={() => void search()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"><Search size={16} /> Search</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><select aria-label="Property type" value={filters.propertyType} onChange={(event) => setFilter('propertyType', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Property type</option>{propertyTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}</select><input aria-label="Minimum price" type="number" placeholder="Minimum Rs." value={filters.minRent} onChange={(event) => setFilter('minRent', event.target.value)} className="border rounded-lg px-3 py-2 text-sm" /><input aria-label="Maximum price" type="number" placeholder="Maximum Rs." value={filters.maxRent} onChange={(event) => setFilter('maxRent', event.target.value)} className="border rounded-lg px-3 py-2 text-sm" /><select aria-label="Rental duration" value={filters.rentalDuration} onChange={(event) => setFilter('rentalDuration', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Rental duration</option>{durations.map((duration) => <option key={duration} value={duration}>{duration.replace('_', ' ')}</option>)}</select><select aria-label="Bedrooms" value={filters.bedrooms} onChange={(event) => setFilter('bedrooms', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Bedrooms</option>{['1', '2', '3', '4'].map((value) => <option key={value} value={value}>{value === '4' ? '4+' : value}</option>)}</select><select aria-label="Bathrooms" value={filters.bathrooms} onChange={(event) => setFilter('bathrooms', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Bathrooms</option>{['1', '2', '3'].map((value) => <option key={value} value={value}>{value === '3' ? '3+' : value}</option>)}</select><select aria-label="Furnished" value={filters.furnishedStatus} onChange={(event) => setFilter('furnishedStatus', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Furnished</option>{furnishing.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select><select aria-label="Gender" value={filters.gender} onChange={(event) => setFilter('gender', event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Gender: Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="MIXED">Any / Mixed</option></select><input aria-label="Available from" type="date" value={filters.availableFrom} onChange={(event) => setFilter('availableFrom', event.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div><div><p className="text-xs font-semibold mb-2">Amenities</p><div className="flex flex-wrap gap-2">{amenities.map((amenity) => <label key={amenity} className="text-xs border rounded-full px-3 py-1.5 cursor-pointer"><input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="mr-1" />{amenity}</label>)}</div></div></section>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Searching properties...</p> : mode === 'map' ? <div className="space-y-2"><div className="h-[min(68vh,680px)] min-h-[420px] rounded-xl overflow-hidden border"><MapContainer center={[31.5204, 74.3587]} zoom={12} scrollWheelZoom className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitMap listings={mappedListings} />{mappedListings.map((listing) => <Marker key={listing.id} position={[listing.latitude!, listing.longitude!]} icon={markerIcon}><Popup><div className="min-w-[180px]"><strong>{listing.title}</strong><p>Rs. {listing.rent.toLocaleString()} / {listing.rentalDuration.toLowerCase().replace('_', ' ')}</p><p className="text-xs text-gray-500">{listing.area}, {listing.city}</p><button onClick={() => navigate(`/tenant/listings/${listing.id}`)} className="mt-2 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">View property</button></div></Popup></Marker>)}</MapContainer></div>{mappedListings.length === 0 && <p className="text-sm text-amber-700"><MapPin size={14} className="inline" /> These results have no coordinates yet. Add latitude and longitude when publishing to place them on the map.</p>}</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{listings.map((listing) => <Card key={listing.id}><button className="w-full text-left" onClick={() => navigate(`/tenant/listings/${listing.id}`)}><div className="h-36 rounded-lg bg-gray-100 mb-3 overflow-hidden">{listing.images?.[0]?.url && <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />}</div><h3 className="font-bold">{listing.title}</h3><p className="text-xs text-gray-500">{listing.area}, {listing.city}</p><p className="text-emerald-600 font-bold mt-2">Rs. {listing.rent.toLocaleString()} / {listing.rentalDuration.toLowerCase().replace('_', ' ')}</p><p className="text-xs text-gray-500 mt-2">{listing.bedrooms} beds · {listing.bathrooms} baths · {listing.furnishedStatus.replace('_', ' ')}</p></button></Card>)}</div>}
      {!loading && !error && mode === 'list' && listings.length === 0 && <p className="text-sm text-gray-500">No properties match these filters.</p>}
    </div>
  );
}
