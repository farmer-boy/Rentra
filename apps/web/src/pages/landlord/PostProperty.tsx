import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { listingsAPI } from '../../api/listings';
import { propertiesAPI, type PropertyRecord } from '../../api/properties';
import { toApiError } from '../../api/api-error';
import { verificationAPI } from '../../api/verification';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { AREA_UNITS, convertAreaToSquareFeet, getAreaUnit } from '../../utils/areaUnits';
import PropertyLocationPicker from '../../components/maps/PropertyLocationPicker';

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
const MIN_IMAGES = 5;
const MAX_IMAGES = 15;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PHOTO_CATEGORIES = [['EXTERIOR', 'Exterior'], ['MAIN_ROOM', 'Main room'], ['KITCHEN', 'Kitchen'], ['BATHROOM', 'Bathroom'], ['BEDROOM', 'Bedroom'], ['OTHER', 'Other']] as const;
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

interface PropertyForm {
  title: string;
  description: string;
  type: string;
  rentalMode: string;
  price: string;
  securityDeposit: string;
  bedrooms: string;
  bathrooms: string;
  areaSize: string;
  areaSizeUnit: string;
  floor: string;
  hostelBedsPerRoom: string;
  hostelGenderPolicy: string;
  mealsIncluded: boolean;
  furnishedStatus: string;
  country: string;
  province: string;
  city: string;
  area: string;
  blockSector: string;
  address: string;
  latitude: string;
  longitude: string;
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
  areaSizeMarla?: number | null;
  areaSizeUnit?: string | null;
  floor?: string | null;
  hostelBedsPerRoom?: number | null;
  hostelGenderPolicy?: string | null;
  mealsIncluded?: boolean;
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
  areaSize: '',
  areaSizeUnit: 'sqft',
  floor: '',
  hostelBedsPerRoom: '4',
  hostelGenderPolicy: '',
  mealsIncluded: false,
  furnishedStatus: 'UNFURNISHED',
  country: 'Pakistan',
  province: '',
  city: '',
  area: '',
  blockSector: '',
  address: '',
  latitude: '',
  longitude: '',
  rules: '',
  amenities: '',
  evidenceUrls: '',
});

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 bg-surface px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20   ';

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
  areaSize: property.areaSizeUnit?.startsWith('marla') && property.areaSizeMarla != null ? String(property.areaSizeMarla) : property.areaSizeSqft == null ? '' : String(property.areaSizeSqft),
  areaSizeUnit: property.areaSizeUnit ?? 'sqft',
  floor: String(property.floor ?? ''),
  hostelBedsPerRoom: String(property.hostelBedsPerRoom ?? 4),
  hostelGenderPolicy: String(property.hostelGenderPolicy ?? ''),
  mealsIncluded: Boolean(property.mealsIncluded),
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
  latitude: property.latitude == null ? '' : String(property.latitude),
  longitude: property.longitude == null ? '' : String(property.longitude),
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
  const [photoTags, setPhotoTags] = useState<Record<string, string>>({});
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
          const normalizedImages = (property.images ?? []).map((image) => ({
            ...image,
            altText: PHOTO_CATEGORIES.some(([value]) => value === image.altText) ? image.altText : 'OTHER',
          }));
          setExistingImages(normalizedImages);
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
            if (typeof values.areaSize !== 'string' && typeof values.areaSizeSqft === 'string') {
              restored.areaSize = values.areaSizeSqft;
              restored.areaSizeUnit = 'sqft';
            }
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
      if (form.type !== 'HOSTEL' && !Number.isInteger(Number(form.bedrooms)) || form.type !== 'HOSTEL' && Number(form.bedrooms) < 0) errors.push('bedrooms');
      if (form.type !== 'HOSTEL' && (!Number.isInteger(Number(form.bathrooms)) || Number(form.bathrooms) < 0)) errors.push('bathrooms');
      if (form.type === 'HOSTEL' && (!Number.isInteger(Number(form.hostelBedsPerRoom)) || Number(form.hostelBedsPerRoom) < 1)) errors.push('beds per room');
      if (form.type === 'HOSTEL' && !form.hostelGenderPolicy) errors.push('hostel gender policy');
    }
    if (targetStep === 1) {
      if (!form.country.trim()) errors.push('country');
      if (!form.province.trim()) errors.push('province');
      if (!form.city.trim()) errors.push('city');
      if (!form.area.trim()) errors.push('area / neighborhood');
      if (!form.address.trim()) errors.push('street address');
      if ((form.latitude.trim() === '') !== (form.longitude.trim() === '')) errors.push('both map coordinates or neither');
      if (form.latitude.trim() && (!Number.isFinite(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) errors.push('a valid map latitude');
      if (form.longitude.trim() && (!Number.isFinite(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180)) errors.push('a valid map longitude');
    }
    if (targetStep === 2) {
      if (!Number.isInteger(price) || price < 0) errors.push('a whole-number rent of zero or more');
      if (form.securityDeposit && (!Number.isInteger(deposit) || deposit < 0)) errors.push('a valid non-negative deposit');
      if (form.areaSize && (!Number.isFinite(Number(form.areaSize)) || Number(form.areaSize) < 0)) errors.push('a valid property area');
    }
    if (targetStep === 3) {
      const count = existingImages.length + files.length;
      if (count < MIN_IMAGES) errors.push(`at least ${MIN_IMAGES} property photos`);
      if (count > MAX_IMAGES) errors.push(`no more than ${MAX_IMAGES} property photos`);
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

  const chooseFiles = async (selected: FileList | null) => {
    const picked = Array.from(selected ?? []);
    const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const allowed = picked.filter((file) => validTypes.has(file.type) && file.size <= MAX_IMAGE_BYTES);
    if (allowed.length !== picked.length) {
      toast.error('Photos must be JPG, PNG, or WebP and 10 MB or smaller.');
    }
    const dimensionChecked: File[] = [];
    for (const file of allowed) {
      try {
        const bitmap = await createImageBitmap(file);
        const largeEnough = bitmap.width >= 720 && bitmap.height >= 720;
        bitmap.close();
        if (largeEnough) dimensionChecked.push(file);
        else toast.error(`${file.name} must be at least 720 × 720 pixels.`);
      } catch { toast.error(`${file.name} could not be read as an image.`); }
    }
    const remaining = Math.max(0, MAX_IMAGES - existingImages.length - files.length);
    if (dimensionChecked.length > remaining) toast.error(`A property can have at most ${MAX_IMAGES} photos.`);
    const next = dimensionChecked.slice(0, remaining);
    setFiles((current) => [...current, ...next]);
    setPhotoTags((current) => ({ ...current, ...Object.fromEntries(next.map((file) => [fileKey(file), 'OTHER'])) }));
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
    if (submitForVerification) {
      const count = existingImages.length + files.length;
      if (count < MIN_IMAGES) errors.push(`at least ${MIN_IMAGES} photos`);
      if (count > MAX_IMAGES) errors.push(`no more than ${MAX_IMAGES} photos`);
    }
    if (errors.length) {
      const missingDetails = [...new Set(errors)];
      setSubmitError(`Please complete or correct: ${missingDetails.join(', ')}.`);
      toast.error(`Please complete: ${missingDetails.join(', ')}.`);
      setStep(errors.some((item) => ['country', 'province', 'city', 'area / neighborhood', 'street address'].includes(item)) ? 1 : errors.some((item) => item.includes('rent') || item.includes('deposit') || item.includes('area')) ? 2 : errors.some((item) => item.includes('photos') || item.includes('verification link') || item.includes('HTTPS')) ? 3 : 0);
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
        ...(form.areaSize !== '' && {
          areaSizeSqft: Math.round(convertAreaToSquareFeet(Number(form.areaSize), form.areaSizeUnit)),
          areaSizeUnit: form.areaSizeUnit,
        }),
        ...(form.areaSizeUnit.startsWith('marla') && form.areaSize !== '' && { areaSizeMarla: Number(form.areaSize) }),
        ...(form.floor.trim() && { floor: form.floor.trim() }),
        ...(form.type === 'HOSTEL' && {
          hostelBedsPerRoom: Number(form.hostelBedsPerRoom),
          hostelRentPerBed: Number(form.price),
          hostelGenderPolicy: form.hostelGenderPolicy,
          mealsIncluded: form.mealsIncluded,
        }),
        furnishedStatus: form.furnishedStatus,
        country: form.country.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        ...(form.blockSector.trim() && { blockSector: form.blockSector.trim() }),
        address: form.address.trim(),
        ...(form.latitude.trim() && form.longitude.trim() && { latitude: Number(form.latitude), longitude: Number(form.longitude) }),
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
          altText: image.altText ?? undefined,
        }),
      ));

      if (files.length) {
        const body = new FormData();
        files.forEach((file) => body.append('files', file));
        body.append('photoCategories', JSON.stringify(files.map((file) => photoTags[fileKey(file)] ?? 'OTHER')));
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
      navigate('/dashboard/properties');
    } catch (cause) {
      const message = toApiError(cause).message || 'The property could not be saved.';
      if (savedProperty) {
        localStorage.removeItem(draftKey);
        toast.error(`Property ${propertyId ? 'changes were saved' : 'was created'}, but a follow-up action failed: ${message}`);
        navigate('/dashboard/properties');
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
    return <Card className="p-6"><p className="text-sm text-gray-600 ">Loading property details…</p></Card>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 ">{propertyId ? 'Edit Property' : 'Add a Property'}</h1>
          <p className="mt-1 text-sm text-gray-600 ">
            Follow the steps to enter details, preview the listing, and submit eligible properties for verification.
          </p>
        </div>
        {!propertyId && <button type="button" onClick={saveDraft} className="rounded-lg border px-3 py-2 text-sm font-semibold">Save draft on this device</button>}
      </header>

      {draftError && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800  ">{draftError}</p>}
      {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700  ">{submitError}</p>}
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
                className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold ${step === index ? 'bg-emerald-600 text-primary-contrast' : index < step ? 'bg-emerald-50 text-emerald-800  ' : 'bg-gray-100 text-gray-500 '}`}>
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
            {form.type === 'HOSTEL' ? <label className="block text-sm font-medium">Beds per room<input className={inputClass} type="number" min="1" max="50" step="1" value={form.hostelBedsPerRoom} onChange={(event) => update('hostelBedsPerRoom', event.target.value)} /></label> : <label className="block text-sm font-medium">Bedrooms<input className={inputClass} type="number" min="0" step="1" value={form.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} /></label>}
            {form.type !== 'HOSTEL' && <label className="block text-sm font-medium">Bathrooms<input className={inputClass} type="number" min="0" step="1" value={form.bathrooms} onChange={(event) => update('bathrooms', event.target.value)} /></label>}
            {form.type !== 'HOSTEL' && <label className="block text-sm font-medium">Furnishing
              <select className={inputClass} value={form.furnishedStatus} onChange={(event) => update('furnishedStatus', event.target.value)}>
                {['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
              </select>
            </label>}
            {['HOUSE', 'APARTMENT', 'FLAT', 'PORTION', 'STUDIO'].includes(form.type) && <label className="block text-sm font-medium">Floor<input className={inputClass} value={form.floor} onChange={(event) => update('floor', event.target.value)} placeholder="Ground, 1st, upper, lower" /></label>}
            {form.type === 'HOSTEL' && <label className="block text-sm font-medium">Accommodation<select className={inputClass} value={form.hostelGenderPolicy} onChange={(event) => update('hostelGenderPolicy', event.target.value)}><option value="">Choose boys / girls / mixed</option><option value="MALE">Boys</option><option value="FEMALE">Girls</option><option value="MIXED">Mixed</option></select></label>}
            {form.type === 'HOSTEL' && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.mealsIncluded} onChange={(event) => update('mealsIncluded', event.target.checked)} />Meals included</label>}
          </div>
          <label className="block text-sm font-medium">Description<textarea className={inputClass} maxLength={5000} rows={5} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Location</h2>
          <p className="text-sm text-gray-600 ">Enter the written address, then click the map to pin the exact property location. The pin is saved with the property.</p>
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
          <PropertyLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} />
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
            <label className="block text-sm font-medium">{form.type === 'HOSTEL' ? 'Rent per bed (PKR)' : form.rentalMode === 'NIGHTLY' || form.rentalMode === 'DAILY' ? 'Daily / nightly price (PKR)' : 'Rent (PKR)'}
              <input className={inputClass} type="number" min="0" step="1" value={form.price} onChange={(event) => update('price', event.target.value)} required />
            </label>
            <label className="block text-sm font-medium">Security deposit (PKR, optional)
              <input className={inputClass} type="number" min="0" step="1" value={form.securityDeposit} onChange={(event) => update('securityDeposit', event.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium" htmlFor="property-area-size">Property area {['HOUSE', 'APARTMENT', 'FLAT', 'PORTION'].includes(form.type) ? '(sq ft or marla)' : '(optional)'}</label>
              <div className="mt-1 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <input id="property-area-size" className={inputClass.replace('mt-1 ', '')} type="number" min="0" step="0.01" value={form.areaSize} onChange={(event) => update('areaSize', event.target.value)} placeholder="Enter area" />
                <select className={inputClass.replace('mt-1 ', '')} aria-label="Property area unit" value={form.areaSizeUnit} onChange={(event) => update('areaSizeUnit', event.target.value)}>
                  {AREA_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <label className="block text-sm font-medium">House rules<textarea className={inputClass} maxLength={2000} rows={3} value={form.rules} onChange={(event) => update('rules', event.target.value)} /></label>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Amenities, images, and verification evidence</h2>
          <p className="text-sm text-gray-600">Add at least 5 and no more than 15 photos to continue. Current count: {existingImages.length + files.length}/{MAX_IMAGES}.</p>
          <label className="block text-sm font-medium">Amenities <span className="font-normal text-gray-500">(comma-separated names)</span>
            <input className={inputClass} value={form.amenities} onChange={(event) => update('amenities', event.target.value)} placeholder={AMENITY_SUGGESTIONS.join(', ')} />
          </label>
          <label className="block text-sm font-medium">Property photos <span className="font-normal text-gray-500">(5–15 for verification; JPG, PNG, WebP; at least 720 × 720 pixels; max 10 MB each)</span>
            <input className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5`} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void chooseFiles(event.target.files)} />
          </label>
          {(existingImages.length > 0 || files.length > 0) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {existingImages.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-lg border">
                  <div className="relative"><img src={image.url} alt={image.altText || `Property image ${index + 1}`} className="h-28 w-full object-cover" /><button type="button" aria-label={`Remove saved photo ${index + 1}`} title="Remove photo" onClick={() => setExistingImages((items) => items.filter((item) => item.id !== image.id))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white shadow hover:bg-red-600"><X size={14} /></button></div>
                  <div className="space-y-2 p-2 text-xs"><select className="w-full rounded border px-2 py-1" aria-label={`Saved photo ${index + 1} category`} value={PHOTO_CATEGORIES.some(([value]) => value === image.altText) ? image.altText! : 'OTHER'} onChange={(event) => setExistingImages((items) => items.map((item) => item.id === image.id ? { ...item, altText: event.target.value } : item))}>{PHOTO_CATEGORIES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><div className="flex items-center justify-between"><span>Saved photo {index + 1}</span><span className="flex items-center gap-2"><button type="button" aria-label={`Move saved image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(existingImages, index, -1, setExistingImages)}><ArrowUp size={14} /></button><button type="button" aria-label={`Move saved image ${index + 1} down`} disabled={index === existingImages.length - 1} onClick={() => moveImage(existingImages, index, 1, setExistingImages)}><ArrowDown size={14} /></button></span></div></div>
                </div>
              ))}
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border">
                  <div className="relative"><img src={imageUrls[index] ?? ''} alt={file.name} className="h-28 w-full object-cover" /><button type="button" aria-label={`Remove ${file.name}`} title="Remove photo" onClick={() => { setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index)); setPhotoTags((tags) => { const next = { ...tags }; delete next[fileKey(file)]; return next; }); }} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white shadow hover:bg-red-600"><X size={14} /></button></div>
                  <div className="space-y-2 p-2 text-xs"><select className="w-full rounded border px-2 py-1" aria-label={`${file.name} photo category`} value={photoTags[fileKey(file)] ?? 'OTHER'} onChange={(event) => setPhotoTags((tags) => ({ ...tags, [fileKey(file)]: event.target.value }))}>{PHOTO_CATEGORIES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><div className="flex items-center justify-between gap-2"><span className="truncate">{file.name}</span><span className="flex shrink-0 gap-2"><button type="button" aria-label={`Move new image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(files, index, -1, setFiles)}><ArrowUp size={14} /></button><button type="button" aria-label={`Move new image ${index + 1} down`} disabled={index === files.length - 1} onClick={() => moveImage(files, index, 1, setFiles)}><ArrowDown size={14} /></button></span></div></div>
                </div>
              ))}
            </div>
          )}
          <label className="block text-sm font-medium">Verification evidence links <span className="font-normal text-gray-500">(optional; HTTPS only, up to 10)</span>
            <textarea className={inputClass} rows={3} value={form.evidenceUrls} onChange={(event) => update('evidenceUrls', event.target.value)} placeholder="Paste one secure evidence URL per line" />
          </label>
          {verificationStatus === 'PENDING' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800  ">A property verification submission is already pending. You can save changes, but cannot create a duplicate submission.</p>}
          <p className="text-xs text-gray-500">Phone verification is optional. A verified email is required when submitting verification evidence. This form does not collect or store CNIC or identity-document contents.</p>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-5 p-5">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900   "><strong>Preview — not a published listing.</strong> The saved property and publication status are confirmed by the backend.</div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              {previewImages[0] ? <img src={previewImages[0]} alt={form.title || 'Property preview'} className="h-64 w-full rounded-xl object-cover" /> : <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-500 "><ImagePlus /> <span className="ml-2">No photos added</span></div>}
              {previewImages.length > 1 && <div className="mt-2 grid grid-cols-4 gap-2">{previewImages.slice(1, 5).map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Property preview ${index + 2}`} className="h-16 w-full rounded object-cover" />)}</div>}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{PROPERTY_TYPES.find(([value]) => value === form.type)?.[1] ?? 'Property'}</p>
              <h2 className="text-2xl font-bold">{form.title || 'Untitled property'}</h2>
              <p className="text-sm text-gray-600 ">{[form.area, form.city, form.province, form.country].filter(Boolean).join(', ')}</p>
              <p className="text-xl font-extrabold text-emerald-700">PKR {Number(form.price || 0).toLocaleString()} <span className="text-sm font-medium">{statusLabel(form.rentalMode)}</span></p>
              <p className="text-sm">{form.bedrooms} bedroom(s) · {form.bathrooms} bathroom(s){form.areaSize && ` · ${form.areaSize} ${getAreaUnit(form.areaSizeUnit).shortLabel}`}</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700 ">{form.description || 'No description provided.'}</p>
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
                setSubmitError(`Please complete or correct: ${errors.join(', ')}.`);
                if (errors.some((error) => error.includes('verification link') || error.includes('HTTPS'))) toast.error('Fix the verification evidence links before continuing.');
                if (step === 3 && errors.some((error) => error.includes('property photos'))) toast.error(`Add ${Math.max(0, MIN_IMAGES - existingImages.length - files.length)} more photo(s) to continue.`);
                return;
              }
              setSubmitError('');
              setStep((current) => current + 1);
            }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-primary-contrast">Next<ArrowRight size={16} /></button>
          ) : (
            <>
              <button type="button" disabled={submitting} onClick={() => void saveProperty(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">{submitting ? 'Saving…' : propertyId ? 'Save changes' : 'Create property'}</button>
              <button type="button" disabled={submitting || verificationStatus === 'PENDING'} onClick={() => void saveProperty(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-primary-contrast disabled:opacity-50">{submitting ? 'Submitting…' : 'Save and submit for verification'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
