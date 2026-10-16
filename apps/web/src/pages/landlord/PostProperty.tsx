import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsAPI } from '../../api/listings';
import { propertiesAPI, type PropertyRecord } from '../../api/properties';
import { toApiError } from '../../api/api-error';
import { verificationAPI } from '../../api/verification';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

const PROPERTY_TYPES = [
  ['HOUSE', 'House'],
  ['APARTMENT', 'Apartment'],
  ['FLAT', 'Flat'],
  ['PORTION', 'Portion'],
  ['ROOM', 'Room'],
  ['HOSTEL', 'Hostel'],
  ['HOTEL', 'Hotel'],
  ['GUEST_HOUSE', 'Guest house'],
  ['STUDIO', 'Studio'],
  ['FARMHOUSE', 'Farmhouse'],
  ['PG', 'PG / Paying guest'],
  ['SHARED_ROOM', 'Shared room'],
  ['OTHER', 'Other'],
] as const;

const RENTAL_MODES = ['DAILY', 'NIGHTLY', 'WEEKLY', 'MONTHLY', 'LONG_TERM'] as const;
const AMENITY_SUGGESTIONS = ['Wi-Fi', 'Parking', 'Air conditioning', 'Kitchen', 'Heating', 'Laundry', 'Security'];
const STEPS = ['Property', 'Location', 'Pricing', 'Facilities', 'Preview'];
const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface PropertyForm {
  title: string;
  description: string;
  type: string;
  rentalMode: string;
  price: string;
  securityDeposit: string;
  bedrooms: string;
  bathrooms: string;
  areaSizeSqft: string;
  furnishedStatus: string;
  country: string;
  province: string;
  city: string;
  area: string;
  blockSector: string;
  address: string;
  rules: string;
  amenities: string;
  evidenceUrls: string;
}

interface ExistingImage {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface EditableProperty extends PropertyRecord {
  ownerId?: string;
  description?: string | null;
  rentalMode?: string;
  securityDeposit?: number | null;
  bathrooms?: number;
  areaSizeSqft?: number | null;
  furnishedStatus?: string;
  rules?: string | null;
  images?: ExistingImage[];
  amenities?: Array<{ amenity?: { name?: string } }>;
  location?: {
    parent?: {
      name?: string;
      parent?: { name?: string; parent?: { name?: string } | null } | null;
    } | null;
  } | null;
  listings?: Array<{ id: string; publicationStatus?: string }>;
}

const emptyForm = (): PropertyForm => ({
  title: '',
  description: '',
  type: '',
  rentalMode: 'MONTHLY',
  price: '',
  securityDeposit: '',
  bedrooms: '0',
  bathrooms: '1',
  areaSizeSqft: '',
  furnishedStatus: 'UNFURNISHED',
  country: 'Pakistan',
  province: '',
  city: '',
  area: '',
  blockSector: '',
  address: '',
  rules: '',
  amenities: '',
  evidenceUrls: '',
});

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white';

const statusLabel = (status?: string) => status?.replaceAll('_', ' ') || 'Status unavailable';

const toForm = (property: EditableProperty): PropertyForm => ({
  title: property.title ?? '',
  description: property.description ?? '',
  type: property.propertyType ?? '',
  rentalMode: property.rentalMode ?? 'MONTHLY',
  price: String(property.price ?? ''),
  securityDeposit: property.securityDeposit == null ? '' : String(property.securityDeposit),
  bedrooms: String(property.bedrooms ?? 0),
  bathrooms: String(property.bathrooms ?? 1),
  areaSizeSqft: property.areaSizeSqft == null ? '' : String(property.areaSizeSqft),
  furnishedStatus: property.furnishedStatus ?? 'UNFURNISHED',
  country:
    (typeof property.country === 'string' ? property.country : null) ??
    property.location?.parent?.parent?.parent?.name ??
    'Pakistan',
  province: property.location?.parent?.parent?.name ?? '',
  city: property.city ?? '',
  area: property.area ?? '',
  blockSector: '',
  address: property.address ?? '',
  rules: property.rules ?? '',
  amenities: property.amenities?.map((item) => item.amenity?.name).filter(Boolean).join(', ') ?? '',
  evidenceUrls: '',
});

export default function LandlordPostProperty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const propertyId = searchParams.get('propertyId');
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [initialImages, setInitialImages] = useState<ExistingImage[]>([]);
  const [propertyStatus, setPropertyStatus] = useState<string>();
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const [publicationStatus, setPublicationStatus] = useState<string>();
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [draftError, setDraftError] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const submitLock = useRef(false);

  const draftKey = `rentra:landlord-property-draft:${user?.id ?? 'unknown'}:${propertyId ?? 'new'}`;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setImageUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    let active = true;
    setLoading(Boolean(propertyId));
    setDraftReady(false);
    setDraftError('');

    const restore = async () => {
      if (propertyId) {
        try {
          const property = await propertiesAPI.details<EditableProperty>(propertyId);
          if (!active) return;
          setForm(toForm(property));
          setExistingImages(property.images ?? []);
          setInitialImages(property.images ?? []);
          setPropertyStatus(property.status);
          setVerificationStatus(property.verificationStatus);
          setPublicationStatus(property.listings?.[0]?.publicationStatus);
        } catch (cause) {
          if (active) setSubmitError(toApiError(cause).message || 'Property details could not be loaded.');
        } finally {
          if (active) {
            setLoading(false);
            setDraftReady(true);
          }
        }
        return;
      }

      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed: unknown = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            const values = parsed as Record<string, unknown>;
            const defaults = emptyForm();
            const restored = Object.assign(
              defaults,
              Object.fromEntries(
                Object.keys(defaults).map((key) => [
                  key,
                  typeof values[key] === 'string'
                    ? values[key]
                    : defaults[key as keyof PropertyForm],
                ]),
              ),
            );
            setForm(restored);
          }
        }
      } catch {
        setDraftError('The saved draft could not be read from this browser.');
      } finally {
        if (active) {
          setLoading(false);
          setDraftReady(true);
        }
      }
    };

    void restore();
    return () => {
      active = false;
    };
  }, [draftKey, propertyId]);

  useEffect(() => {
    if (!draftReady || propertyId) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {
      setDraftError('This browser could not save the draft. You can continue, but it may not be recoverable after closing the tab.');
    }
  }, [draftKey, draftReady, form, propertyId]);

  const previewImages = useMemo(
    () => [...existingImages.map((image) => image.url), ...imageUrls],
    [existingImages, imageUrls],
  );

  const validationErrors = (targetStep = step) => {
    const errors: string[] = [];
    const price = Number(form.price);
    const deposit = Number(form.securityDeposit);
    if (targetStep === 0) {
      if (!form.title.trim()) errors.push('property title');
      if (!form.type) errors.push('property type');
      if (!form.description.trim()) errors.push('description');
      if (!Number.isInteger(Number(form.bedrooms)) || Number(form.bedrooms) < 0) errors.push('bedrooms');
      if (!Number.isInteger(Number(form.bathrooms)) || Number(form.bathrooms) < 0) errors.push('bathrooms');
    }
    if (targetStep === 1) {
      if (!form.country.trim()) errors.push('country');
      if (!form.province.trim()) errors.push('province');
      if (!form.city.trim()) errors.push('city');
      if (!form.area.trim()) errors.push('area / neighborhood');
      if (!form.address.trim()) errors.push('street address');
    }
    if (targetStep === 2) {
      if (!Number.isInteger(price) || price < 0) errors.push('a whole-number rent of zero or more');
      if (form.securityDeposit && (!Number.isInteger(deposit) || deposit < 0)) errors.push('a valid non-negative deposit');
      if (form.areaSizeSqft && (!Number.isInteger(Number(form.areaSizeSqft)) || Number(form.areaSizeSqft) < 0)) errors.push('a valid property area');
    }
    if (targetStep === 3) {
      const evidence = form.evidenceUrls.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      if (evidence.length > 10) errors.push('no more than 10 verification links');
      if (evidence.some((url) => {
        try {
          return new URL(url).protocol !== 'https:';
        } catch {
          return true;
        }
      })) errors.push('valid HTTPS evidence links');
    }
    return errors;
  };

  const update = <K extends keyof PropertyForm>(key: K, value: PropertyForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = () => {
    if (propertyId) {
      toast('Draft saving is available for new properties; existing properties save through the server.');
      return;
    }
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      toast.success('Draft saved on this device.');
      setDraftError('');
    } catch {
      setDraftError('The draft could not be saved to this browser.');
    }
  };

  const chooseFiles = (selected: FileList | null) => {
    const picked = Array.from(selected ?? []);
    const allowed = picked.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES);
    if (allowed.length !== picked.length) {
      toast.error('Only image files up to 10 MB each can be uploaded.');
    }
    const remaining = Math.max(0, MAX_IMAGES - existingImages.length);
    if (allowed.length > remaining) toast.error(`A property can have at most ${MAX_IMAGES} images.`);
    setFiles(allowed.slice(0, remaining));
  };

  const moveImage = <T,>(items: T[], index: number, direction: -1 | 1, setItems: (next: T[]) => void) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
  };

  const saveProperty = async (submitForVerification: boolean) => {
    if (submitLock.current) return;
    const errors = [...validationErrors(0), ...validationErrors(1), ...validationErrors(2), ...validationErrors(3)];
    if (errors.length) {
      setSubmitError(`Please correct: ${[...new Set(errors)].join(', ')}.`);
      toast.error('Some property details need attention before saving.');
      setStep(errors.some((item) => ['country', 'province', 'city', 'area / neighborhood', 'street address'].includes(item)) ? 1 : errors.some((item) => item.includes('rent') || item.includes('deposit') || item.includes('area')) ? 2 : 0);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setSubmitError('');
    let savedProperty: EditableProperty | null = null;
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        rentalMode: form.rentalMode,
        price: Number(form.price),
        ...(form.securityDeposit !== '' && { securityDeposit: Number(form.securityDeposit) }),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        ...(form.areaSizeSqft !== '' && { areaSizeSqft: Number(form.areaSizeSqft) }),
        furnishedStatus: form.furnishedStatus,
        country: form.country.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        ...(form.blockSector.trim() && { blockSector: form.blockSector.trim() }),
        address: form.address.trim(),
        rules: form.rules.trim(),
      };

      savedProperty = propertyId
        ? await propertiesAPI.update(propertyId, payload) as EditableProperty
        : await propertiesAPI.create(payload) as EditableProperty;

      const linkedListingId = savedProperty.listings?.[0]?.id;
      if (linkedListingId) {
        await listingsAPI.setAmenities(linkedListingId, form.amenities.split(',').map((value) => value.trim()).filter(Boolean));
      } else if (form.amenities.trim()) {
        throw new Error('The property was saved, but no linked listing was returned for its amenities.');
      }

      const removedImages = initialImages.filter((image) => !existingImages.some((current) => current.id === image.id));
      await Promise.all(removedImages.map((image) => propertiesAPI.deleteImage(savedProperty!.id, image.id)));
      await Promise.all(existingImages.map((image, index) =>
        propertiesAPI.updateImage(savedProperty!.id, image.id, {
          sortOrder: index,
          isPrimary: index === 0,
        }),
      ));

      if (files.length) {
        const body = new FormData();
        files.forEach((file) => body.append('files', file));
        body.append('altText', 'Property photo');
        await propertiesAPI.uploadImages(savedProperty.id, body);
      }

      if (submitForVerification && savedProperty.verificationStatus !== 'PENDING') {
        await verificationAPI.submitProperty(savedProperty.id, {
          evidenceUrls: form.evidenceUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
        });
      } else if (submitForVerification && savedProperty.verificationStatus === 'PENDING') {
        toast('A property verification submission is already pending.');
      }

      localStorage.removeItem(draftKey);
      const finalStatus = submitForVerification && savedProperty.verificationStatus !== 'PENDING'
        ? 'PENDING verification'
        : statusLabel(savedProperty.status);
      toast.success(propertyId ? `Property saved. Current status: ${finalStatus}.` : `Property created. Current status: ${finalStatus}.`);
      navigate('/landlord/properties');
    } catch (cause) {
      const message = toApiError(cause).message || 'The property could not be saved.';
      if (savedProperty) {
        localStorage.removeItem(draftKey);
        toast.error(`Property ${propertyId ? 'changes were saved' : 'was created'}, but a follow-up action failed: ${message}`);
        navigate('/landlord/properties');
      } else {
        setSubmitError(message);
        toast.error(message);
      }
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Card className="p-6"><p className="text-sm text-gray-600 dark:text-gray-300">Loading property details…</p></Card>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{propertyId ? 'Edit Property' : 'Add a Property'}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Follow the steps to enter details, preview the listing, and submit eligible properties for verification.
          </p>
        </div>
        {!propertyId && <button type="button" onClick={saveDraft} className="rounded-lg border px-3 py-2 text-sm font-semibold">Save draft on this device</button>}
      </header>

      {draftError && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{draftError}</p>}
      {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{submitError}</p>}
      {propertyId && (
        <Card className="flex flex-wrap gap-x-6 gap-y-2 p-4 text-sm">
          <span>Property: <strong>{statusLabel(propertyStatus)}</strong></span>
          <span>Verification: <strong>{statusLabel(verificationStatus)}</strong></span>
          <span>Publication: <strong>{statusLabel(publicationStatus)}</strong></span>
        </Card>
      )}

      <Card className="p-4">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Property form progress">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button type="button" onClick={() => index < step && setStep(index)} aria-current={step === index ? 'step' : undefined}
                className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold ${step === index ? 'bg-emerald-600 text-white' : index < step ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                <span className="mr-1">{index + 1}.</span>{label}
              </button>
            </li>
          ))}
        </ol>
      </Card>

      {step === 0 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Property details</h2>
          <label className="block text-sm font-medium">Title<input className={inputClass} maxLength={120} value={form.title} onChange={(event) => update('title', event.target.value)} required /></label>
          <label className="block text-sm font-medium">Property type
            <select className={inputClass} value={form.type} onChange={(event) => update('type', event.target.value)} required>
              <option value="">Choose a supported property type</option>
              {PROPERTY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">Bedrooms<input className={inputClass} type="number" min="0" step="1" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} /></label>
            <label className="block text-sm font-medium">Bathrooms<input className={inputClass} type="number" min="0" step="1" value={form.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} /></label>
            <label className="block text-sm font-medium">Furnishing
              <select className={inputClass} value={form.furnishedStatus} onChange={(event) => update('furnishedStatus', event.target.value)}>
                {['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">Description<textarea className={inputClass} maxLength={5000} rows={5} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Location</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Enter the property location. The backend resolves these names into Rentra’s location hierarchy; coordinates are optional and are not guessed.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['country', 'Country'],
              ['province', 'Province / state'],
              ['city', 'City'],
              ['area', 'Area / neighborhood'],
              ['blockSector', 'Block / sector (optional)'],
              ['address', 'Street address'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">{label}
                <input className={inputClass} value={form[key]} onChange={(event) => update(key, event.target.value)} required={key !== 'blockSector'} maxLength={key === 'address' ? 300 : undefined} />
              </label>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Pricing and rental terms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Rental period
              <select className={inputClass} value={form.rentalMode} onChange={(event) => update('rentalMode', event.target.value)}>
                {RENTAL_MODES.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">{form.rentalMode === 'NIGHTLY' || form.rentalMode === 'DAILY' ? 'Daily / nightly price (PKR)' : 'Rent (PKR)'}
              <input className={inputClass} type="number" min="0" step="1" value={form.price} onChange={(event) => update('price', event.target.value)} required />
            </label>
            <label className="block text-sm font-medium">Security deposit (PKR, optional)
              <input className={inputClass} type="number" min="0" step="1" value={form.securityDeposit} onChange={(event) => update('securityDeposit', event.target.value)} />
            </label>
            <label className="block text-sm font-medium">Area (square feet, optional)
              <input className={inputClass} type="number" min="0" step="1" value={form.areaSizeSqft} onChange={(event) => update('areaSizeSqft', event.target.value)} />
            </label>
          </div>
          <label className="block text-sm font-medium">House rules<textarea className={inputClass} maxLength={2000} rows={3} value={form.rules} onChange={(event) => update('rules', event.target.value)} /></label>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Amenities, images, and verification evidence</h2>
          <label className="block text-sm font-medium">Amenities <span className="font-normal text-gray-500">(comma-separated names)</span>
            <input className={inputClass} value={form.amenities} onChange={(event) => update('amenities', event.target.value)} placeholder={AMENITY_SUGGESTIONS.join(', ')} />
          </label>
          <label className="block text-sm font-medium">Property photos <span className="font-normal text-gray-500">(up to 12 total; image files up to 10 MB each)</span>
            <input className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5`} type="file" accept="image/*" multiple onChange={(event) => chooseFiles(event.target.files)} />
          </label>
          {(existingImages.length > 0 || files.length > 0) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {existingImages.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-lg border">
                  <img src={image.url} alt={image.altText || `Property image ${index + 1}`} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between p-2 text-xs"><span>Saved image {index + 1}</span><span className="flex items-center gap-2"><button type="button" aria-label={`Move saved image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(existingImages, index, -1, setExistingImages)}><ArrowUp size={14} /></button><button type="button" aria-label={`Move saved image ${index + 1} down`} disabled={index === existingImages.length - 1} onClick={() => moveImage(existingImages, index, 1, setExistingImages)}><ArrowDown size={14} /></button><button type="button" aria-label="Remove saved image" onClick={() => setExistingImages((items) => items.filter((item) => item.id !== image.id))}><Trash2 size={15} /></button></span></div>
                </div>
              ))}
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border">
                  <img src={imageUrls[index] ?? ''} alt={file.name} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2 text-xs"><span className="truncate">{file.name}</span><span className="flex shrink-0 gap-2"><button type="button" aria-label={`Move new image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(files, index, -1, setFiles)}><ArrowUp size={14} /></button><button type="button" aria-label={`Move new image ${index + 1} down`} disabled={index === files.length - 1} onClick={() => moveImage(files, index, 1, setFiles)}><ArrowDown size={14} /></button></span></div>
                </div>
              ))}
            </div>
          )}
          <label className="block text-sm font-medium">Verification evidence links <span className="font-normal text-gray-500">(optional; HTTPS only, up to 10)</span>
            <textarea className={inputClass} rows={3} value={form.evidenceUrls} onChange={(event) => update('evidenceUrls', event.target.value)} placeholder="Paste one secure evidence URL per line" />
          </label>
          {verificationStatus === 'PENDING' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">A property verification submission is already pending. You can save changes, but cannot create a duplicate submission.</p>}
          <p className="text-xs text-gray-500">Verification requires verified email and phone. This form does not collect or store CNIC or identity-document contents.</p>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-5 p-5">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"><strong>Preview — not a published listing.</strong> The saved property and publication status are confirmed by the backend.</div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              {previewImages[0] ? <img src={previewImages[0]} alt={form.title || 'Property preview'} className="h-64 w-full rounded-xl object-cover" /> : <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800"><ImagePlus /> <span className="ml-2">No photos added</span></div>}
              {previewImages.length > 1 && <div className="mt-2 grid grid-cols-4 gap-2">{previewImages.slice(1, 5).map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Property preview ${index + 2}`} className="h-16 w-full rounded object-cover" />)}</div>}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{PROPERTY_TYPES.find(([value]) => value === form.type)?.[1] ?? 'Property'}</p>
              <h2 className="text-2xl font-bold">{form.title || 'Untitled property'}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{[form.area, form.city, form.province, form.country].filter(Boolean).join(', ')}</p>
              <p className="text-xl font-extrabold text-emerald-700">PKR {Number(form.price || 0).toLocaleString()} <span className="text-sm font-medium">{statusLabel(form.rentalMode)}</span></p>
              <p className="text-sm">{form.bedrooms} bedroom(s) · {form.bathrooms} bathroom(s){form.areaSizeSqft ? ` · ${form.areaSizeSqft} sqft` : ''}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{form.description || 'No description provided.'}</p>
              {form.amenities.trim() && <p className="text-sm"><strong>Amenities:</strong> {form.amenities}</p>}
              {form.rules.trim() && <p className="whitespace-pre-wrap text-sm"><strong>Rules:</strong> {form.rules}</p>}
              {form.address && <p className="text-sm"><strong>Address:</strong> {form.address}</p>}
              <p className="text-xs text-gray-500">Availability is managed through the backend after property creation.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || submitting} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40"><ArrowLeft size={16} />Back</button>
        <div className="ml-auto flex flex-wrap gap-2">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => {
              const errors = validationErrors();
              if (errors.length) {
                setSubmitError(`Please complete: ${errors.join(', ')}.`);
                return;
              }
              setSubmitError('');
              setStep((current) => current + 1);
            }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Next<ArrowRight size={16} /></button>
          ) : (
            <>
              <button type="button" disabled={submitting} onClick={() => void saveProperty(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">{submitting ? 'Saving…' : propertyId ? 'Save changes' : 'Create property'}</button>
              <button type="button" disabled={submitting || verificationStatus === 'PENDING'} onClick={() => void saveProperty(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Save and submit for verification'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
