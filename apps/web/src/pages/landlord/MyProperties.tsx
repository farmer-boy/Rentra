import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit3, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import { listingsAPI, type ListingPage } from '../../api/listings';
import { propertiesAPI } from '../../api/properties';
import { toApiError } from '../../api/api-error';
import { useAuthStore } from '../../store/authStore';

interface HostListing {
  id: string;
  propertyId?: string | null;
  title: string;
  description?: string;
  rent: number;
  deposit?: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  city: string;
  area: string;
  type: string;
  status: string;
  publicationStatus: string;
  availability: string;
  rentalDuration: string;
  property?: { id?: string; status?: string; verificationStatus?: string } | null;
}

const PAGE_SIZE = 12;
const formatStatus = (value: string) => value.replaceAll('_', ' ');

export default function MyProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [listings, setListings] = useState<HostListing[]>([]);
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sort, setSort] = useState<'createdAt' | 'rent' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setStatusFilter(searchParams.get('status') ?? 'ALL');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setError('Sign in again to view your properties.');
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError('');
    const loadAll = async () => {
      try {
        const firstPage = await listingsAPI.getMyListingsPage<HostListing>({ page: 1, limit: 100, sortBy: sort, sortOrder });
        const rest = await Promise.all(Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
          listingsAPI.getMyListingsPage<HostListing>({ page: index + 2, limit: 100, sortBy: sort, sortOrder }),
        ));
        const records = [firstPage, ...rest].flatMap((response: ListingPage<HostListing>) => response.data);
        if (active) setListings(records);
      } catch (cause) {
        if (active) setError(toApiError(cause).message || 'Properties could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAll();
    return () => { active = false; };
  }, [reload, sort, sortOrder, user?.id]);

  const types = [...new Set(listings.map((listing) => listing.type).filter(Boolean))].sort();
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesSearch = `${listing.title} ${listing.city} ${listing.area}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'PENDING_REVIEW' && ['DRAFT', 'PENDING_VERIFICATION'].includes(listing.property?.status ?? listing.status))
      || (listing.property?.status ?? listing.status) === statusFilter
      || listing.publicationStatus === statusFilter
      || listing.property?.verificationStatus === statusFilter;
    const matchesType = typeFilter === 'ALL' || listing.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }), [listings, search, statusFilter, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const visibleListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);

  const unpublish = async (listing: HostListing) => {
    if (!window.confirm(`Unpublish "${listing.title}"? It will no longer appear in public search.`)) return;
    setBusyId(listing.id);
    setActionError('');
    try {
      const updated = await listingsAPI.unpublish<HostListing>(listing.id);
      setListings((current) => current.map((item) => item.id === listing.id ? { ...item, ...updated } : item));
    } catch (cause) {
      setActionError(toApiError(cause).message || 'The listing could not be unpublished.');
    } finally {
      setBusyId(null);
    }
  };

  const expireProperty = async (listing: HostListing) => {
    if (!listing.propertyId) {
      setActionError('This older listing has no linked property record, so the supported property-expiration action is unavailable.');
      return;
    }
    if (!window.confirm(`Expire "${listing.title}"? This removes it from publication and cannot be undone from this page.`)) return;
    setBusyId(listing.id);
    setActionError('');
    try {
      await propertiesAPI.expire(listing.propertyId);
      setListings((current) => current.filter((item) => item.id !== listing.id));
    } catch (cause) {
      setActionError(toApiError(cause).message || 'The property could not be expired.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">My Properties</h1><p className="mt-1 text-sm text-gray-500">Search, review server-reported status, edit supported property records, and manage publication.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><RefreshCw size={15} />Refresh</button><button type="button" onClick={() => navigate('/dashboard/post-property')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-contrast"><Plus size={16} />Add property</button></div>
      </header>

      <Card className="grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="relative block text-xs font-semibold">Search title or location
          <Search size={15} className="absolute left-3 top-8 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-1 w-full rounded-lg border bg-surface py-2 pl-9 pr-3 text-sm " placeholder="Property, city, area" />
        </label>
        <label className="block text-xs font-semibold">Property status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm "><option value="ALL">All statuses</option>{['PENDING_REVIEW', 'DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'RENTED', 'EXPIRED', 'REJECTED', 'SUSPENDED', 'PENDING', 'PUBLISHED', 'UNPUBLISHED', 'REMOVED', 'ARCHIVED'].map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select>
        </label>
        <label className="block text-xs font-semibold">Type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm "><option value="ALL">All types</option>{types.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select>
        </label>
        <label className="block text-xs font-semibold">Sort
          <select value={`${sort}:${sortOrder}`} onChange={(event) => {
            const [nextSort, nextOrder] = event.target.value.split(':') as ['createdAt' | 'rent' | 'title', 'asc' | 'desc'];
            setSort(nextSort);
            setSortOrder(nextOrder);
          }} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm "><option value="createdAt:desc">Newest</option><option value="createdAt:asc">Oldest</option><option value="rent:asc">Rent: low to high</option><option value="rent:desc">Rent: high to low</option><option value="title:asc">Title: A–Z</option><option value="title:desc">Title: Z–A</option></select>
        </label>
      </Card>

      {actionError && <Card className="p-4"><p role="alert" className="text-sm text-red-700">{actionError}</p></Card>}
      {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-gray-200 " />)}</div> : error ? <Card className="flex items-center justify-between gap-3 p-5"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="text-sm font-semibold text-emerald-700">Try again</button></Card> : filteredListings.length === 0 ? <Card className="p-6 text-sm text-gray-600">{listings.length ? 'No properties match these filters.' : 'No properties found. Add your first property to get started.'}</Card> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleListings.map((listing) => (
              <Card key={listing.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-bold">{listing.title}</h2><p className="mt-1 text-xs text-gray-500">{[listing.area, listing.city].filter(Boolean).join(', ')}</p></div>
                <div className="flex flex-col items-end gap-1"><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold">{formatStatus(listing.property?.status ?? listing.status)}</span><span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-800">{formatStatus(listing.publicationStatus)}</span></div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500"><span>{formatStatus(listing.type)}</span><span>·</span><span>{listing.bedrooms} beds</span><span>·</span><span>{listing.bathrooms} baths</span><span>·</span><span>{listing.sqft} sqft</span><span>·</span><span>{formatStatus(listing.availability)}</span></div>
                <div className="flex items-end justify-between gap-3"><p className="text-lg font-extrabold text-emerald-700">PKR {listing.rent.toLocaleString()} <span className="text-xs font-medium text-gray-500">/ {formatStatus(listing.rentalDuration)}</span></p><p className="text-xs text-gray-500">Verification: {formatStatus(listing.property?.verificationStatus ?? 'UNVERIFIED')}</p></div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {listing.propertyId ? <button type="button" onClick={() => navigate(`/dashboard/post-property?propertyId=${encodeURIComponent(listing.propertyId!)}`)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"><Edit3 size={14} />Edit</button> : <span className="self-center text-xs text-gray-500">No linked property record; editing is not available for this older listing.</span>}
                  <button type="button" onClick={() => navigate(`/dashboard/listings/${listing.id}`)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"><Eye size={14} />Preview</button>
                  {listing.publicationStatus === 'PUBLISHED' && <button type="button" disabled={busyId !== null} onClick={() => void unpublish(listing)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">{busyId === listing.id ? 'Saving…' : 'Unpublish'}</button>}
                  {listing.propertyId && !['EXPIRED', 'SUSPENDED'].includes(listing.property?.status ?? '') && <button type="button" disabled={busyId !== null} onClick={() => void expireProperty(listing)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"><Trash2 size={14} />Expire</button>}
                </div>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm"><p className="text-gray-500">{filteredListings.length} properties · Page {page} of {totalPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
        </>
      )}
    </div>
  );
}
