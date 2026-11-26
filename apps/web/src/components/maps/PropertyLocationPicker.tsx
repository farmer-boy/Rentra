import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyLocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587];

function ClickToSelect({ onSelect }: { onSelect: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: (event) => onSelect(event.latlng.lat, event.latlng.lng) });
  return null;
}

function KeepMapCentered({ position, hasLocation }: { position: [number, number]; hasLocation: boolean }) {
  const map = useMap();
  useEffect(() => { if (hasLocation) map.setView(position, Math.max(map.getZoom(), 15)); }, [map, position[0], position[1], hasLocation]);
  return null;
}

export default function PropertyLocationPicker({ latitude, longitude, onChange }: PropertyLocationPickerProps) {
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PhotonFeature[]>([]);
  const selectedLabel = useRef('');
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasLocation = latitude.trim() !== '' && longitude.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lng);
  const position: [number, number] = hasLocation ? [lat, lng] : DEFAULT_CENTER;

  useEffect(() => {
    const query = search.trim();
    if (query && query === selectedLabel.current) {
      selectedLabel.current = '';
      return;
    }
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setLocationError('');
      try {
        const url = new URL('https://photon.komoot.io/api/');
        url.search = new URLSearchParams({ q: query, limit: '6', lang: 'en', countrycode: 'PK' }).toString();
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Address search is temporarily unavailable. You can still choose a point on the map.');
        const data = await response.json() as { features?: PhotonFeature[] };
        setSearchResults(data.features ?? []);
        if (!data.features?.length) setLocationError('No matching locations found. Try adding the area or city name.');
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setLocationError(error instanceof Error ? error.message : 'Could not search for that location.');
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const setPoint = (nextLat: number, nextLng: number) => {
    onChange(nextLat.toFixed(6), nextLng.toFixed(6));
    setLocationError('');
  };

  const searchLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch((current) => current.trim());
  };

  const featureLabel = (feature: PhotonFeature) => {
    const p = feature.properties;
    return [p.name, p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street, p.district, p.city, p.county, p.state, p.country]
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .join(', ');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('This browser does not support device location. Click the map to place the pin.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPoint(coords.latitude, coords.longitude),
      () => setLocationError('Could not access your device location. Click the map to place the pin.'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  };

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
    : undefined;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">Exact map location</h3><p className="mt-1 text-xs text-text-muted">Search for a place, then confirm or adjust its pin on the map.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={useCurrentLocation} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface2">Use my location</button>
          {googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface2">Open in Google Maps</a>}
        </div>
      </div>
      <form onSubmit={searchLocation} className="flex flex-col gap-2 sm:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Search address, area, or city..." aria-label="Search map location" autoComplete="off" />
        <button type="submit" disabled={searching || search.trim().length < 3} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{searching ? 'Searching…' : 'Search location'}</button>
      </form>
      {searchResults.length > 0 && <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border" aria-label="Location search results">{searchResults.map((result) => { const label = featureLabel(result); const [resultLng, resultLat] = result.geometry.coordinates; return <li key={`${resultLat},${resultLng}`}><button type="button" onClick={() => { setPoint(resultLat, resultLng); setSearchResults([]); selectedLabel.current = label; setSearch(label); }} className="w-full px-3 py-2 text-left text-sm hover:bg-surface2">{label || 'Unnamed location'}</button></li>; })}</ul>}
      <div className="h-64 overflow-hidden rounded-lg border border-border sm:h-80">
        <MapContainer center={position} zoom={hasLocation ? 16 : 11} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToSelect onSelect={setPoint} />
          <KeepMapCentered position={position} hasLocation={hasLocation} />
          {hasLocation && <CircleMarker center={position} radius={9} pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.85 }} />}
        </MapContainer>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium">Latitude<input type="number" step="any" min="-90" max="90" value={latitude} onChange={(event) => onChange(event.target.value, longitude)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Click the map to set" /></label>
        <label className="block text-xs font-medium">Longitude<input type="number" step="any" min="-180" max="180" value={longitude} onChange={(event) => onChange(latitude, event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" placeholder="Click the map to set" /></label>
      </div>
      {locationError && <p role="status" className="text-xs text-amber-700">{locationError}</p>}
      <p className="text-xs text-text-muted">{hasLocation ? `Pin: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'No map pin selected yet; you can still save the written address.'}</p>
    </section>
  );
}
