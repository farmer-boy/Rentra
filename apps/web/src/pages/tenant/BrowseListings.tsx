import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  List,
  Map,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { ApiError } from '../../api/api-error';
import { useFavorites, useListingSearch, useToggleFavorite } from '../../hooks/useRentraQueries';
import { useAuthStore } from '../../store/authStore';

const propertyTypes = ['HOSTEL', 'HOTEL', 'GUEST_HOUSE', 'HOUSE', 'APARTMENT', 'FLAT', 'ROOM', 'PORTION', 'STUDIO', 'FARMHOUSE', 'PG', 'SHARED_ROOM'];
const furnishing = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
const durations = ['DAILY', 'NIGHTLY', 'WEEKLY', 'MONTHLY', 'LONG_TERM'];
const amenities = ['WiFi', 'Parking', 'Electricity', 'Gas', 'Water', 'Generator', 'AC', 'Heating', 'Laundry', 'Security', 'CCTV', 'Lift', 'Furnished', 'Kitchen', 'Mess'];
const markerIcon = new L.DivIcon({ className: 'rentra-marker', html: '<span>Rs</span>', iconSize: [42, 30], iconAnchor: [21, 30] });
const filterFieldClass =
  'w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

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
      className="space-y-5 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <SlidersHorizontal size={16} className="text-primary" />
        Refine your search
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input aria-label="City" value={filters.city} onChange={(event) => setFilter('city', event.target.value)} placeholder="City" className={filterFieldClass} />
        <input aria-label="Area" value={filters.area} onChange={(event) => setFilter('area', event.target.value)} placeholder="Area or neighbourhood" className={filterFieldClass} />
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover"><Search size={16} /> Search homes</button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <select aria-label="Property type" value={filters.propertyType} onChange={(event) => setFilter('propertyType', event.target.value)} className={filterFieldClass}><option value="">Property type</option>{propertyTypes.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}</select>
        <input aria-label="Minimum price" type="number" placeholder="Minimum Rs." value={filters.minRent} onChange={(event) => setFilter('minRent', event.target.value)} className={filterFieldClass} />
        <input aria-label="Maximum price" type="number" placeholder="Maximum Rs." value={filters.maxRent} onChange={(event) => setFilter('maxRent', event.target.value)} className={filterFieldClass} />
        <select aria-label="Rental duration" value={filters.rentalDuration} onChange={(event) => setFilter('rentalDuration', event.target.value)} className={filterFieldClass}><option value="">Rental duration</option>{durations.map((duration) => <option key={duration} value={duration}>{duration.replace('_', ' ')}</option>)}</select>
        <select aria-label="Bedrooms" value={filters.bedrooms} onChange={(event) => setFilter('bedrooms', event.target.value)} className={filterFieldClass}><option value="">Bedrooms</option>{['1', '2', '3', '4'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Bathrooms" value={filters.bathrooms} onChange={(event) => setFilter('bathrooms', event.target.value)} className={filterFieldClass}><option value="">Bathrooms</option>{['1', '2', '3'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Furnished" value={filters.furnishedStatus} onChange={(event) => setFilter('furnishedStatus', event.target.value)} className={filterFieldClass}><option value="">Furnished</option>{furnishing.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select>
        <select
          aria-label="Sort listings"
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split('_');
            setFilters((current) => ({ ...current, sortBy, sortOrder }));
          }}
          className={filterFieldClass}
        >
          <option value="createdAt_desc">Newest first</option>
          <option value="rent_asc">Rent: low to high</option>
          <option value="rent_desc">Rent: high to low</option>
          <option value="sqft_desc">Largest first</option>
          <option value="title_asc">Title: A to Z</option>
        </select>
        <select aria-label="Gender" value={filters.gender} onChange={(event) => setFilter('gender', event.target.value)} className={filterFieldClass}><option value="">Gender: Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="MIXED">Any / Mixed</option></select>
        <input aria-label="Available from" type="date" value={filters.availableFrom} onChange={(event) => setFilter('availableFrom', event.target.value)} className={filterFieldClass} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-text">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <label key={amenity} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedAmenities.includes(amenity) ? 'border-primary bg-primary-soft text-text' : 'border-border text-text-muted hover:bg-surface2'}`}>
              <input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="sr-only" />
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
      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/95 text-rose-600 disabled:opacity-60"
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
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface2"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Rentra homes</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-text sm:text-2xl">Find your next home</h1>
            <p className="mt-1 text-sm text-text-muted">Search by location, budget, and facilities.</p>
          </div>
        </div>
        <div className="flex rounded-xl border border-border bg-surface2 p-1" aria-label="Listing view">
          <button
            type="button"
            onClick={() => setMode('list')}
            aria-pressed={mode === 'list'}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${mode === 'list' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            <List size={15} /> List
          </button>
          <button
            type="button"
            onClick={() => setMode('map')}
            aria-pressed={mode === 'map'}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${mode === 'map' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-text-muted hover:text-text'}`}
          >
            <Map size={15} /> Map
          </button>
        </div>
      </header>

      <ListingFiltersForm key={searchParams.toString()} params={searchParams} onApply={applySearch} />
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          <span className="mr-1 text-xs font-semibold text-text-muted">Filters:</span>
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
                }} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted transition-colors hover:bg-surface2">
                  {amenity} <span aria-hidden="true">×</span>
                </button>
              ))
              : [<button key={key} onClick={() => removeFilter(key)} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted transition-colors hover:bg-surface2">
                {key.replaceAll(/([A-Z])/g, ' $1')}: {value} <span aria-hidden="true">×</span>
              </button>],
          )}
          <button onClick={clearFilters} className="text-xs font-semibold text-primary underline underline-offset-2">Clear all</button>
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">{error}<button onClick={() => void listingQuery.refetch()} className="ml-2 font-semibold underline">Retry</button></div>}
      {!listingQuery.isPending && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-text-muted" aria-live="polite">
            <span className="font-semibold text-text">{pagination?.total ?? listings.length}</span>
            {' '}homes found
            {activeFilters.length > 0 && <span> matching your filters</span>}
          </p>
          {pagination && pagination.totalPages > 1 && (
            <span className="text-xs text-text-muted">Page {currentPage} of {pagination.totalPages}</span>
          )}
        </div>
      )}
      {listingQuery.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Searching properties">
          {[0, 1, 2].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="aspect-[4/3] animate-pulse bg-surface2" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface2" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface2" />
                <div className="h-8 w-full animate-pulse rounded bg-surface2" />
              </div>
            </div>
          ))}
        </div>
      ) : mode === 'map' ? (
        <div className="space-y-2">
          {mappedListings.length > 0 ? (
          <div className="h-[min(68vh,680px)] min-h-[360px] overflow-hidden rounded-2xl border border-border shadow-sm">
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
                      <button onClick={() => navigate(`/listings/${listing.id}`)} className="mt-2 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-primary-contrast">View property</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          ) : <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted shadow-sm">
            {listings.length === 0
              ? <><Home size={28} className="mx-auto mb-3 text-[var(--text3)]" />No properties match these filters.</>
              : <><MapPin size={14} className="mr-1 inline" /> These results do not include property coordinates, so the map is unavailable.</>}
          </div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <article key={listing.id} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface2">
                {listing.images?.[0]?.url
                  ? <img src={listing.images[0].url} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  : <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--text3)]"><Home size={28} />Photo coming soon</div>}
                <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-[11px] font-semibold capitalize text-white backdrop-blur-sm">
                  {listing.type.replaceAll('_', ' ').toLowerCase()}
                </span>
                <SaveListingButton listingId={listing.id} />
              </div>
              <div className="p-4 sm:p-5">
                <button className="block w-full text-left" onClick={() => navigate(`/listings/${listing.id}`)}>
                  <h2 className="truncate text-base font-bold text-text transition-colors group-hover:text-primary" title={listing.title}>{listing.title}</h2>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin size={14} className="shrink-0 text-primary" />
                    <span className="truncate">{[listing.area, listing.city].filter(Boolean).join(', ')}</span>
                  </p>
                </button>
                <div className="mt-4 flex items-baseline gap-1.5 border-t border-border pt-3">
                  <span className="text-xl font-extrabold tracking-tight text-primary">Rs. {listing.rent.toLocaleString()}</span>
                  <span className="text-xs capitalize text-text-muted">/ {listing.rentalDuration.toLowerCase().replaceAll('_', ' ')}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1.5"><BedDouble size={14} className="text-[var(--text3)]" />{listing.bedrooms} beds</span>
                  <span className="inline-flex items-center gap-1.5"><Bath size={14} className="text-[var(--text3)]" />{listing.bathrooms} baths</span>
                  {listing.sqft > 0 && <span className="inline-flex items-center gap-1.5"><Ruler size={14} className="text-[var(--text3)]" />{listing.sqft.toLocaleString()} sqft</span>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="truncate text-xs text-text-muted">{listing.furnishedStatus.replaceAll('_', ' ').toLowerCase()}</span>
                  <button type="button" onClick={() => navigate(`/listings/${listing.id}`)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft">
                    View details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {listings.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface2 text-text-muted"><Search size={21} /></span>
              <h2 className="mt-4 text-base font-bold text-text">No homes found</h2>
              <p className="mt-1 text-sm text-text-muted">Try changing your search or clearing some filters.</p>
              {activeFilters.length > 0 && <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover">Clear filters</button>}
            </div>
          )}
        </div>
      )}
      {!listingQuery.isPending && !error && pagination && pagination.totalPages > 1 && (
        <nav aria-label="Listing pages" className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <button disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} />Previous</button>
          <span className="text-sm text-text-muted">Page <strong className="text-text">{currentPage}</strong> of <strong className="text-text">{pagination.totalPages}</strong> · {pagination.total} listings</span>
          <button disabled={currentPage >= pagination.totalPages} onClick={() => changePage(currentPage + 1)} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight size={16} /></button>
        </nav>
      )}
    </div>
  );
}
