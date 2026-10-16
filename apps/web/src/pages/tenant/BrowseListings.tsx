import { useEffect, useState } from 'react';
import { Heart, MapPin, Search } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { ApiError } from '../../api/api-error';
import { useFavorites, useListingSearch, useToggleFavorite } from '../../hooks/useRentraQueries';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';

const propertyTypes = ['HOSTEL', 'HOTEL', 'GUEST_HOUSE', 'HOUSE', 'APARTMENT', 'FLAT', 'ROOM', 'PORTION', 'STUDIO', 'FARMHOUSE', 'PG', 'SHARED_ROOM'];
const furnishing = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
const durations = ['DAILY', 'NIGHTLY', 'WEEKLY', 'MONTHLY', 'LONG_TERM'];
const amenities = ['WiFi', 'Parking', 'Electricity', 'Gas', 'Water', 'Generator', 'AC', 'Heating', 'Laundry', 'Security', 'CCTV', 'Lift', 'Furnished', 'Kitchen', 'Mess'];
const markerIcon = new L.DivIcon({ className: 'rentra-marker', html: '<span>Rs</span>', iconSize: [42, 30], iconAnchor: [21, 30] });

type Listing = {
  id: string;
  title: string;
  city: string;
  area: string;
  type: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  furnishedStatus: string;
  rentalDuration: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: Array<{ url: string }>;
};
type Filters = Record<string, string>;

const readParams = (params: URLSearchParams): Filters =>
  Object.fromEntries(params.entries());

function FitMap({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    const points = listings
      .filter((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')
      .map((item) => [item.latitude!, item.longitude!] as [number, number]);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [35, 35] });
  }, [listings, map]);
  return null;
}

function ListingFiltersForm({
  params,
  onApply,
}: {
  params: URLSearchParams;
  onApply: (filters: Filters, selectedAmenities: string[]) => void;
}) {
  const [filters, setFilters] = useState<Filters>(() => {
    const initial = readParams(params);
    return {
      city: initial.city ?? '',
      area: initial.area ?? '',
      propertyType: initial.propertyType ?? '',
      minRent: initial.minRent ?? '',
      maxRent: initial.maxRent ?? '',
      bedrooms: initial.bedrooms ?? '',
      bathrooms: initial.bathrooms ?? '',
      furnishedStatus: initial.furnishedStatus ?? '',
      rentalDuration: initial.rentalDuration ?? '',
      gender: initial.gender ?? '',
      availableFrom: initial.availableFrom ?? '',
      sortBy: initial.sortBy ?? 'createdAt',
      sortOrder: initial.sortOrder ?? 'desc',
    };
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    () => params.get('amenities')?.split(',').filter(Boolean) ?? [],
  );
  const setFilter = (name: string, value: string) =>
    setFilters((current) => ({ ...current, [name]: value }));
  const toggleAmenity = (name: string) =>
    setSelectedAmenities((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(filters, selectedAmenities);
      }}
      className="space-y-4 rounded-xl border bg-white p-4 dark:bg-[#151515]"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input aria-label="City" value={filters.city} onChange={(event) => setFilter('city', event.target.value)} placeholder="City" className="rounded-lg border px-3 py-2 text-sm" />
        <input aria-label="Area" value={filters.area} onChange={(event) => setFilter('area', event.target.value)} placeholder="Area or neighbourhood" className="rounded-lg border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"><Search size={16} /> Search</button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <select aria-label="Property type" value={filters.propertyType} onChange={(event) => setFilter('propertyType', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Property type</option>{propertyTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}</select>
        <input aria-label="Minimum price" type="number" placeholder="Minimum Rs." value={filters.minRent} onChange={(event) => setFilter('minRent', event.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
        <input aria-label="Maximum price" type="number" placeholder="Maximum Rs." value={filters.maxRent} onChange={(event) => setFilter('maxRent', event.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
        <select aria-label="Rental duration" value={filters.rentalDuration} onChange={(event) => setFilter('rentalDuration', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Rental duration</option>{durations.map((duration) => <option key={duration} value={duration}>{duration.replace('_', ' ')}</option>)}</select>
        <select aria-label="Bedrooms" value={filters.bedrooms} onChange={(event) => setFilter('bedrooms', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Bedrooms</option>{['1', '2', '3', '4'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Bathrooms" value={filters.bathrooms} onChange={(event) => setFilter('bathrooms', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Bathrooms</option>{['1', '2', '3'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Furnished" value={filters.furnishedStatus} onChange={(event) => setFilter('furnishedStatus', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Furnished</option>{furnishing.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select>
        <select
          aria-label="Sort listings"
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split('_');
            setFilters((current) => ({ ...current, sortBy, sortOrder }));
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="createdAt_desc">Newest first</option>
          <option value="rent_asc">Rent: low to high</option>
          <option value="rent_desc">Rent: high to low</option>
          <option value="sqft_desc">Largest first</option>
          <option value="title_asc">Title: A to Z</option>
        </select>
        <select aria-label="Gender" value={filters.gender} onChange={(event) => setFilter('gender', event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Gender: Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="MIXED">Any / Mixed</option></select>
        <input aria-label="Available from" type="date" value={filters.availableFrom} onChange={(event) => setFilter('availableFrom', event.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <label key={amenity} className="cursor-pointer rounded-full border px-3 py-1.5 text-xs">
              <input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="mr-1" />
              {amenity}
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}

function SaveListingButton({ listingId }: { listingId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const favoritesQuery = useFavorites(isAuthenticated);
  const toggleFavorite = useToggleFavorite();
  const saved = favoritesQuery.data?.some((favorite) => favorite.id === listingId) ?? false;

  const toggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ id: listingId, saved });
      toast.success(saved ? 'Removed from favorites' : 'Saved to favorites');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update favorites.');
    }
  };

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={saved}
      disabled={toggleFavorite.isPending}
      onClick={() => void toggle()}
      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-rose-600 disabled:opacity-60"
    >
      <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

export default function BrowseListings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const appliedFilters = readParams(searchParams);
  const listingQuery = useListingSearch<Listing>(appliedFilters);
  const listings = listingQuery.data?.data ?? [];
  const pagination = listingQuery.data?.pagination;
  const currentPage = pagination?.page ?? 1;
  const error = listingQuery.error instanceof ApiError
    ? listingQuery.error.message
    : listingQuery.error
      ? 'Could not load properties.'
      : '';
  const mappedListings = listings.filter(
    (listing) => typeof listing.latitude === 'number' && typeof listing.longitude === 'number',
  );

  const applySearch = (filters: Filters, selectedAmenities: string[]) => {
    const params = Object.fromEntries(
      Object.entries({
        ...filters,
        amenities: selectedAmenities.join(','),
        page: '1',
        limit: '20',
      }).filter(([, value]) => value),
    );
    setSearchParams(params);
  };
  const clearFilters = () => setSearchParams(new URLSearchParams());
  const activeFilters = Object.entries(appliedFilters).filter(
    ([key, value]) => !['page', 'limit', 'sortBy', 'sortOrder'].includes(key) && value,
  );
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };
  const changePage = (page: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...appliedFilters, page: String(page) }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value)) {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Find your next home</h2>
          <p className="text-sm text-gray-500">Search by location, budget, and facilities.</p>
        </div>
        <div className="flex rounded-lg border bg-white p-1 dark:bg-[#151515]">
          <button onClick={() => setMode('list')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>LIST</button>
          <button onClick={() => setMode('map')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'map' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>MAP</button>
        </div>
      </header>

      <ListingFiltersForm key={searchParams.toString()} params={searchParams} onApply={applySearch} />
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.flatMap(([key, value]) =>
            key === 'amenities'
              ? value.split(',').filter(Boolean).map((amenity) => (
                <button key={`${key}-${amenity}`} onClick={() => {
                  const remaining = value.split(',').filter((item) => item && item !== amenity);
                  const params = new URLSearchParams(searchParams);
                  if (remaining.length) params.set('amenities', remaining.join(','));
                  else params.delete('amenities');
                  params.set('page', '1');
                  setSearchParams(params);
                }} className="rounded-full border px-3 py-1 text-xs">
                  {amenity} <span aria-hidden="true">×</span>
                </button>
              ))
              : [<button key={key} onClick={() => removeFilter(key)} className="rounded-full border px-3 py-1 text-xs">
                {key.replaceAll(/([A-Z])/g, ' $1')}: {value} <span aria-hidden="true">×</span>
              </button>],
          )}
          <button onClick={clearFilters} className="text-xs font-semibold text-emerald-700 underline">Clear all</button>
        </div>
      )}

      {error && <div role="alert" className="text-sm text-red-600">{error}<button onClick={() => void listingQuery.refetch()} className="ml-2 underline">Retry</button></div>}
      {listingQuery.isPending ? <p className="text-sm text-gray-500">Searching properties...</p> : mode === 'map' ? (
        <div className="space-y-2">
          {mappedListings.length > 0 ? (
          <div className="h-[min(68vh,680px)] min-h-[420px] overflow-hidden rounded-xl border">
            <MapContainer center={[mappedListings[0].latitude!, mappedListings[0].longitude!]} zoom={12} scrollWheelZoom className="h-full w-full">
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitMap listings={mappedListings} />
              {mappedListings.map((listing) => (
                <Marker key={listing.id} position={[listing.latitude!, listing.longitude!]} icon={markerIcon}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <strong>{listing.title}</strong>
                      <p>Rs. {listing.rent.toLocaleString()} / {listing.rentalDuration.toLowerCase().replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{listing.area}, {listing.city}</p>
                      <button onClick={() => navigate(`/listings/${listing.id}`)} className="mt-2 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">View property</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          ) : <p className="rounded-xl border p-6 text-sm text-gray-600">
            {listings.length === 0
              ? 'No properties match these filters.'
              : <><MapPin size={14} className="mr-1 inline" /> These results do not include property coordinates, so the map is unavailable.</>}
          </p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <div className="relative">
                <button className="w-full text-left" onClick={() => navigate(`/listings/${listing.id}`)}>
                  <div className="mb-3 h-36 overflow-hidden rounded-lg bg-gray-100">{listing.images?.[0]?.url ? <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-500">No property image</div>}</div>
                  <h3 className="font-bold">{listing.title}</h3>
                  <p className="text-xs text-gray-500">{listing.area}, {listing.city}</p>
                  <p className="mt-2 font-bold text-emerald-600">Rs. {listing.rent.toLocaleString()} / {listing.rentalDuration.toLowerCase().replace('_', ' ')}</p>
                  <p className="mt-2 text-xs text-gray-500">{listing.bedrooms} beds · {listing.bathrooms} baths · {listing.furnishedStatus.replace('_', ' ')}</p>
                </button>
                <SaveListingButton listingId={listing.id} />
              </div>
            </Card>
          ))}
          {listings.length === 0 && <p className="text-sm text-gray-500">No properties match these filters.</p>}
        </div>
      )}
      {!listingQuery.isPending && !error && pagination && pagination.totalPages > 1 && (
        <nav aria-label="Listing pages" className="flex items-center justify-center gap-3">
          <button disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-600">Page {currentPage} of {pagination.totalPages} · {pagination.total} listings</span>
          <button disabled={currentPage >= pagination.totalPages} onClick={() => changePage(currentPage + 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Next</button>
        </nav>
      )}
    </div>
  );
}
