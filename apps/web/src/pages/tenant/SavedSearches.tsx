import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { savedSearchesAPI, type SavedSearchRecord } from '../../api/savedSearches';
import Card from '../../components/ui/Card';
import { toApiError } from '../../api/api-error';

type SavedSearch = SavedSearchRecord;

interface SearchFilters extends Record<string, unknown> {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

const getErrorMessage = (error: unknown) => toApiError(error).message;

export default function SavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadSearches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await savedSearchesAPI.list();
      if (!Array.isArray(results)) throw new Error('Invalid saved-search response.');
      setSearches(results);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSearches(); }, [loadSearches]);

  const createSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filters: SearchFilters = {};
    if (city.trim()) filters.city = city.trim();
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      setActionError('Minimum rent cannot be greater than maximum rent.');
      return;
    }

    setSaving(true);
    setActionError('');
    try {
      const created = await savedSearchesAPI.create({ name, filters });
      setSearches((current) => [created, ...current]);
      setName('');
      setCity('');
      setMinPrice('');
      setMaxPrice('');
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const deleteSearch = async (id: string) => {
    setActionError('');
    try {
      await savedSearchesAPI.remove(id);
      setSearches((current) => current.filter((search) => search.id !== id));
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-extrabold">Saved Searches</h1>
        <p className="text-sm text-gray-500">Save property filters so you can come back to them later.</p>
      </header>

      <Card className="p-5">
        <form onSubmit={(event) => void createSearch(event)} className="space-y-4">
          <h2 className="font-semibold">Save a search</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Search name
              <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="Apartments in Lahore" />
            </label>
            <label className="text-sm">City
              <input value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="Lahore" />
            </label>
            <label className="text-sm">Minimum rent (PKR)
              <input type="number" min="0" step="1" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label className="text-sm">Maximum rent (PKR)
              <input type="number" min="0" step="1" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
          </div>
          {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
          <button disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Search'}
          </button>
        </form>
      </Card>

      {loading ? <Card className="p-5"><p className="text-sm text-gray-500">Loading saved searches…</p></Card>
        : error ? <Card className="p-5"><p role="alert" className="text-sm text-red-600">{error}</p><button onClick={() => void loadSearches()} className="mt-3 text-sm font-semibold text-emerald-700">Retry</button></Card>
          : searches.length === 0 ? <Card className="p-8 text-center"><Bookmark className="mx-auto mb-3 text-emerald-600" /><p className="text-sm text-gray-500">You have not saved a search yet.</p></Card>
            : <div className="space-y-3">{searches.map((search) => {
              const filters = search.filtersJson;
              const summary = [
                typeof filters.city === 'string' && filters.city,
                typeof filters.minPrice === 'number' && `from PKR ${filters.minPrice.toLocaleString()}`,
                typeof filters.maxPrice === 'number' && `up to PKR ${filters.maxPrice.toLocaleString()}`,
              ].filter(Boolean).join(' · ');
              const appliedFilters = new URLSearchParams();
              if (typeof filters.city === 'string' && filters.city) appliedFilters.set('city', filters.city);
              if (typeof filters.minPrice === 'number') appliedFilters.set('minRent', String(filters.minPrice));
              if (typeof filters.maxPrice === 'number') appliedFilters.set('maxRent', String(filters.maxPrice));
              const searchQuery = appliedFilters.toString();
              const searchUrl = `/listings${searchQuery ? `?${searchQuery}` : ''}`;
              return <Card key={search.id} className="flex items-center justify-between gap-4 p-4">
                <div><h2 className="font-semibold">{search.name}</h2><p className="mt-1 text-sm text-gray-500">{summary || 'No filters applied'} · Saved {new Date(search.createdAt).toLocaleDateString()}</p><Link to={searchUrl} className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline">Apply search</Link></div>
                <button aria-label={`Delete ${search.name}`} onClick={() => void deleteSearch(search.id)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
              </Card>;
            })}</div>}
    </div>
  );
}
