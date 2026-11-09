import { useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { ApiError } from '../../api/api-error';
import { rentEstimateAPI, type RentEstimateResult } from '../../api/rentEstimate';

const types = ['HOUSE', 'APARTMENT', 'FLAT', 'PORTION', 'ROOM', 'HOSTEL', 'HOTEL', 'GUEST_HOUSE', 'STUDIO', 'FARMHOUSE', 'PG', 'SHARED_ROOM'];
const durations = ['MONTHLY', 'LONG_TERM', 'WEEKLY', 'DAILY', 'NIGHTLY'];

export default function RentEstimator() {
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [rentalDuration, setRentalDuration] = useState('MONTHLY');
  const [result, setResult] = useState<RentEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const estimate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await rentEstimateAPI.estimate({
        city: city.trim(),
        ...(area.trim() && { area: area.trim() }),
        ...(propertyType && { propertyType }),
        ...(bedrooms !== '' && { bedrooms: Number(bedrooms) }),
        ...(sqft !== '' && { sqft: Number(sqft) }),
        rentalDuration,
      });
      setResult(response);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Rent estimate could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-text">Fair Rent Estimator</h1>
        <p className="mt-1 text-[13px] text-text-muted">Compare your details with currently published Rentra listings.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={(event) => void estimate(event)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-text">City<input required minLength={2} maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Lahore" className={fieldClass} /></label>
          <label className="text-xs font-semibold text-text">Area (optional)<input maxLength={100} value={area} onChange={(event) => setArea(event.target.value)} placeholder="Gulberg" className={fieldClass} /></label>
          <label className="text-xs font-semibold text-text">Property type<select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className={fieldClass}><option value="">Any type</option>{types.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="text-xs font-semibold text-text">Bedrooms<input type="number" min={0} max={30} value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className={fieldClass} /></label>
          <label className="text-xs font-semibold text-text">Area size (sq ft)<input type="number" min={50} max={100000} value={sqft} onChange={(event) => setSqft(event.target.value)} className={fieldClass} /></label>
          <label className="text-xs font-semibold text-text">Rental period<select value={rentalDuration} onChange={(event) => setRentalDuration(event.target.value)} className={fieldClass}>{durations.map((duration) => <option key={duration} value={duration}>{duration.replaceAll('_', ' ')}</option>)}</select></label>
          <div className="sm:col-span-2 lg:col-span-3"><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast disabled:opacity-60"><Search size={16} />{loading ? 'Comparing listings…' : 'Estimate rent'}</button></div>
        </form>
      </Card>

      {result && (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Comparable listing estimate</p>
              {result.medianRent === null ? <p className="mt-2 text-lg font-semibold text-text">Not enough matching listings</p> : <p className="mt-1 text-3xl font-extrabold text-primary">PKR {result.medianRent.toLocaleString()} <span className="text-sm font-medium text-text-muted">/ {result.rentalDuration.toLowerCase().replaceAll('_', ' ')}</span></p>}
            </div>
            <p className="text-sm text-text-muted">{result.sampleSize} comparable listing{result.sampleSize === 1 ? '' : 's'}</p>
          </div>
          {result.lowerRange !== null && result.upperRange !== null && <p className="text-sm text-text-muted">Typical range in this sample: PKR {result.lowerRange.toLocaleString()}–{result.upperRange.toLocaleString()}</p>}
          {result.sampleSize > 0 && <p className="text-xs text-text-muted">Compared on: city{result.matchedFilters.length ? `, ${result.matchedFilters.join(', ')}` : ' only'}{result.area ? ` · ${result.area}` : ''}.</p>}
          <p className="rounded-lg bg-surface-2 p-3 text-xs leading-5 text-text-muted">{result.notice}</p>
          {result.comparables.length > 0 && <div className="divide-y divide-border">{result.comparables.map((listing) => <div key={listing.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium text-text">{listing.title}<span className="ml-2 text-xs text-text-muted">{[listing.area, listing.city].filter(Boolean).join(', ')}</span></span><span className="text-text-muted">{listing.type.replaceAll('_', ' ')} · {listing.bedrooms} bed · {listing.sqft.toLocaleString()} sqft · PKR {listing.rent.toLocaleString()}</span></div>)}</div>}
        </Card>
      )}
    </div>
  );
}
