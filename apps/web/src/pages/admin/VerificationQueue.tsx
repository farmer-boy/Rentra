import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verificationAPI } from '../../api/verification';
import { toApiError } from '../../api/api-error';
import Card from '../../components/ui/Card';

interface VerificationItem {
  id: string;
  kind: string;
  status: string;
  submittedAt: string;
  user?: { id: string; fullName: string };
  property?: AdminPropertyPreview;
}

interface AdminPropertyPreview {
  id: string;
  title: string;
  description?: string | null;
  propertyType?: string;
  rentalMode?: string;
  price?: number;
  securityDeposit?: number | null;
  bedrooms?: number;
  bathrooms?: number;
  areaSizeSqft?: number | null;
  furnishedStatus?: string;
  city?: string | null;
  area?: string | null;
  address?: string;
  images?: Array<{ url: string; altText?: string | null; sortOrder?: number }>;
  amenities?: Array<{ amenity?: { name: string } }>;
  owner?: { fullName: string; isVerified?: boolean; trustScore?: number };
  listings?: Array<{
    id: string;
    title: string;
    description: string;
    area?: string;
    city?: string;
    rent: number;
    deposit?: number | null;
    rentalDuration: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    furnishedStatus: string;
    photos?: string[];
    images?: Array<{ url: string; altText?: string | null }>;
    amenities?: Array<{ amenity?: { name: string } }>;
  }>;
}

interface VerificationDetail extends VerificationItem {
  details?: unknown;
  evidenceUrls?: string[];
  reviewNotes?: string | null;
  user?: VerificationItem['user'] & {
    email?: string;
    phone?: string;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
  };
}

type VerificationQueueKind = 'ALL' | 'USER' | 'PROPERTY';

export default function VerificationQueue({ kind }: { kind: VerificationQueueKind }) {
  const [searchParams] = useSearchParams();
  const requestedPropertyId = searchParams.get('propertyId');
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [selected, setSelected] = useState<VerificationDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queueItems = items.filter((item) =>
    kind === 'ALL' || (kind === 'PROPERTY'
      ? item.kind === 'PROPERTY'
      : item.kind === 'IDENTITY' || item.kind === 'HOST'),
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await verificationAPI.pending<VerificationItem>());
    } catch {
      setError('Verification submissions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);
  useEffect(() => { setSelectedImage(0); }, [selected?.id]);

  useEffect(() => {
    if (!requestedPropertyId || selected) return;
    const item = items.find((candidate) => candidate.kind === 'PROPERTY' && candidate.property?.id === requestedPropertyId);
    if (!item) return;
    let active = true;
    void verificationAPI.adminDetail<VerificationDetail>(item.id).then((detail) => {
      if (active) setSelected(detail);
    }).catch(() => {
      if (active) setError('Submission details could not be loaded.');
    });
    return () => { active = false; };
  }, [items, requestedPropertyId, selected]);

  const selectSubmission = async (id: string) => {
    setError('');
    try {
      setSelected(await verificationAPI.adminDetail<VerificationDetail>(id));
    } catch {
      setError('Submission details could not be loaded.');
    }
  };

  const reviewSubmission = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    const reviewNotes = window.prompt(`Reason/notes for ${decision.toLowerCase()}:`);
    if (!reviewNotes?.trim()) return;
    try {
      await verificationAPI.review(selected.id, { decision, reviewNotes });
      setSelected(null);
      await loadQueue();
    } catch (cause) {
      setError(toApiError(cause).message || 'The verification decision could not be saved. The submission may already have been reviewed.');
    }
  };

  const property = selected?.property;
  const listing = property?.listings?.[0];
  const gallery = listing?.images?.length
    ? listing.images.map((image) => image.url)
    : property?.images?.length
      ? property.images.map((image) => image.url)
      : listing?.photos ?? [];
  const amenities = (listing?.amenities?.length ? listing.amenities : property?.amenities ?? [])
    .map((item) => item.amenity?.name)
    .filter((name): name is string => Boolean(name));
  const price = listing?.rent ?? property?.price;
  const deposit = listing?.deposit ?? property?.securityDeposit;
  const type = listing?.type ?? property?.propertyType;
  const description = listing?.description ?? property?.description;
  const area = listing?.area ?? property?.area;
  const city = listing?.city ?? property?.city;
  const bedrooms = listing?.bedrooms ?? property?.bedrooms;
  const bathrooms = listing?.bathrooms ?? property?.bathrooms;
  const sqft = listing?.sqft ?? property?.areaSizeSqft;
  const furnished = listing?.furnishedStatus ?? property?.furnishedStatus;
  const rentPeriod = listing?.rentalDuration ?? property?.rentalMode;

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 ">{kind === 'ALL' ? 'Verification Queue' : kind === 'PROPERTY' ? 'Property Verification' : 'User Verification'}</h1>
        <p className="mt-1 text-sm text-gray-600 ">
          {kind === 'ALL'
            ? 'Review identity, host, and property submissions.'
            : kind === 'PROPERTY'
            ? 'Review posted properties separately from landlord identity and host checks.'
            : 'Review identity and landlord host verification separately from property posts.'}
        </p>
      </header>
      {error && <p role="alert" className="text-sm text-red-600 ">{error}</p>}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
        <Card className="p-0">
          {loading ? <p className="p-5 text-sm text-gray-500">Loading submissions...</p> : queueItems.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">{kind === 'ALL' ? 'No pending verification submissions.' : kind === 'PROPERTY' ? 'No pending property reviews.' : 'No pending user verification submissions.'}</p>
          ) : (
            <ul className="divide-y divide-gray-100 ">
              {queueItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void selectSubmission(item.id)}
                    aria-pressed={selected?.id === item.id}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${selected?.id === item.id ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-200' : ''}`}
                  >
                    <span className="block text-xs font-bold uppercase tracking-wide text-emerald-800">
                      {item.kind === 'HOST' ? 'Landlord verification' : item.kind === 'IDENTITY' ? 'Identity verification' : 'Property review'}
                    </span>
                    <span className="mt-1 block font-semibold text-gray-900 ">{item.property?.title ?? item.user?.fullName ?? item.id}</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {item.status} · {new Date(item.submittedAt).toLocaleString()} · Click to review
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a submission to inspect its information and evidence.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 ">{selected.kind} verification</h2>
                <p className="break-all text-xs text-gray-500">{selected.id}</p>
              </div>
              {selected.user && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-gray-500">Name</dt><dd>{selected.user.fullName}</dd></div>
                  <div><dt className="text-gray-500">Email</dt><dd>{selected.user.email ?? '—'}</dd></div>
                  <div><dt className="text-gray-500">Phone</dt><dd>{selected.user.phone ?? '—'}</dd></div>
                  <div><dt className="text-gray-500">Contact verified</dt><dd>Email {selected.user.emailVerifiedAt ? 'Yes' : 'No'} · Phone {selected.user.phoneVerifiedAt ? 'Yes' : 'No'}</dd></div>
                </dl>
              )}
              {property && (
                <section className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
                  <h3 className="text-lg font-bold">Property preview <span className="text-sm font-normal text-text-muted">(tenant view)</span></h3>
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-2">
                      <div className="h-56 overflow-hidden rounded-lg bg-surface2 sm:h-72">{gallery[selectedImage] ? <img src={gallery[selectedImage]} alt={property.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-text-muted">No property photos</div>}</div>
                      {gallery.length > 1 && <div className="flex gap-2 overflow-x-auto">{gallery.map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Show property photo ${index + 1}`} onClick={() => setSelectedImage(index)} className={`h-14 w-16 shrink-0 overflow-hidden rounded border-2 ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}><img src={url} alt={`${property.title} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{type?.replaceAll('_', ' ') ?? 'Property'}</p>
                      <h4 className="text-2xl font-extrabold">{listing?.title ?? property.title}</h4>
                      <p className="text-sm text-text-muted">{[area, city].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                      {price != null && <p className="text-2xl font-extrabold text-primary">Rs. {Number(price).toLocaleString()} <span className="text-sm font-medium text-text-muted">/ {rentPeriod?.toLowerCase().replaceAll('_', ' ')}</span></p>}
                      <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg border border-border bg-surface2 p-2"><strong>{bedrooms ?? '—'}</strong><p className="text-xs text-text-muted">Bedrooms</p></div><div className="rounded-lg border border-border bg-surface2 p-2"><strong>{bathrooms ?? '—'}</strong><p className="text-xs text-text-muted">Bathrooms</p></div><div className="rounded-lg border border-border bg-surface2 p-2"><strong>{sqft ?? '—'}</strong><p className="text-xs text-text-muted">sqft</p></div></div>
                      {furnished && <span className="inline-block rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-semibold">{furnished.replaceAll('_', ' ')}</span>}
                      {!!amenities.length && <div className="flex flex-wrap gap-1.5">{amenities.map((amenity) => <span key={amenity} className="rounded-full border border-border px-2.5 py-1 text-xs text-text-muted">{amenity}</span>)}</div>}
                      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm"><div><p className="text-xs text-text-muted">Security deposit</p><p className="font-semibold">{deposit ? `Rs. ${Number(deposit).toLocaleString()}` : 'Not specified'}</p></div><div><p className="text-xs text-text-muted">Landlord</p><p className="font-semibold">{property.owner?.fullName ?? selected.user?.fullName ?? '—'}</p></div></div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-border p-3"><h4 className="mb-2 font-semibold">About this property</h4><p className="whitespace-pre-line text-sm leading-6 text-text-muted">{description || 'No description provided.'}</p></div><div className="rounded-lg border border-border p-3"><h4 className="mb-2 font-semibold">Location</h4><p className="text-sm">{[area, city].filter(Boolean).join(', ') || 'Location unavailable'}</p><p className="mt-1 text-xs text-text-muted">{property.address ?? 'Address not provided'}</p></div></div>
                </section>
              )}
              {selected.details !== undefined && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Submitted details</h3>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100  p-3 text-xs whitespace-pre-wrap">{JSON.stringify(selected.details, null, 2)}</pre>
                </div>
              )}
              {!!selected.evidenceUrls?.length && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Verification evidence ({selected.evidenceUrls.length})</h3>
                  <ul className="space-y-1">{selected.evidenceUrls.map((url) => (
                    <li key={url}><a className="break-all text-sm text-blue-600 underline" href={url} target="_blank" rel="noreferrer">{url}</a></li>
                  ))}</ul>
                </div>
              )}
              {selected.kind === 'PROPERTY' && !selected.evidenceUrls?.length && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">No verification evidence links were submitted for this property.</p>}
              {selected.kind !== 'PROPERTY' && !selected.evidenceUrls?.length && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  No evidence links were submitted. Ask the landlord to provide proof before approving this verification.
                </p>
              )}
              {selected.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2 border-t border-gray-200  pt-4">
                  <button type="button" onClick={() => void reviewSubmission('APPROVED')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-primary-contrast">Approve</button>
                  <button type="button" onClick={() => void reviewSubmission('REJECTED')} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-primary-contrast">Reject</button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
