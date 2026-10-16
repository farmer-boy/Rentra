import { Heart, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { ApiError } from '../../api/api-error';
import type { FavoriteRecord } from '../../api/favorites';
import { useFavorites, useRemoveFavorite } from '../../hooks/useRentraQueries';
import { useAuthStore } from '../../store/authStore';

interface FavoriteListing extends FavoriteRecord {
  title?: string;
  area?: string | null;
  city?: string | null;
  rent?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  squareFeet?: number;
  areaSizeSqft?: number;
  rentalDuration?: string;
  rentalMode?: string;
  type?: string;
  propertyType?: string;
  images?: Array<{ url: string }>;
  landlord?: { trustScore?: number };
  owner?: { trustScore?: number };
}

const formatDuration = (duration?: string) =>
  (duration ?? 'MONTHLY').toLowerCase().replaceAll('_', ' ');

export default function SavedListings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const favoritesQuery = useFavorites(isAuthenticated);
  const removeFavorite = useRemoveFavorite();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="p-8 text-center">
          <Heart className="mx-auto mb-3 text-rose-500" size={30} />
          <h1 className="text-xl font-bold">Your saved homes, all in one place</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to save listings and pick up where you left off.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: '/favorites' } })}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Log in
            </button>
            <Link to="/register" state={{ from: '/favorites' }} className="rounded-lg border px-4 py-2 text-sm font-semibold">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const favorites = (favoritesQuery.data ?? []) as FavoriteListing[];
  const remove = async (favorite: FavoriteListing) => {
    try {
      await removeFavorite.mutateAsync(favorite.id);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Could not remove this saved home. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-xl font-extrabold">My Favorites</h1>
        <p className="text-sm text-gray-500">Homes saved from the live Rentra listings.</p>
      </header>
      {favoritesQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading saved homes">
          {[0, 1, 2].map((item) => <Card key={item} className="h-64"><div className="h-full animate-pulse bg-gray-50" /></Card>)}
        </div>
      ) : favoritesQuery.isError ? (
        <Card className="p-6">
          <p role="alert" className="text-sm text-red-600">
            {favoritesQuery.error instanceof ApiError
              ? favoritesQuery.error.message
              : 'We could not load your favorites.'}
          </p>
          <button onClick={() => void favoritesQuery.refetch()} className="mt-3 text-sm font-semibold text-emerald-700">
            Try again
          </button>
        </Card>
      ) : favorites.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="mx-auto mb-3 text-rose-500" size={30} />
          <p className="text-sm text-gray-500">No saved homes yet.</p>
          <Link to="/listings" className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            Browse current listings
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => {
            const price = favorite.rent ?? favorite.price;
            const areaSize = favorite.sqft ?? favorite.squareFeet ?? favorite.areaSizeSqft;
            return (
              <Card key={favorite.id} className="overflow-hidden">
                <Link to={`/listings/${favorite.id}`} className="block">
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {favorite.images?.[0]?.url ? (
                      <img src={favorite.images[0].url} alt={favorite.title ?? 'Saved home'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">No property image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold">{favorite.title ?? 'Saved property'}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={13} /> {[favorite.area, favorite.city].filter(Boolean).join(', ') || 'Location not provided'}
                    </p>
                    {price !== undefined && (
                      <p className="mt-3 font-bold text-emerald-700">
                        Rs. {price.toLocaleString()} / {formatDuration(favorite.rentalDuration ?? favorite.rentalMode)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {favorite.bedrooms ?? 0} beds · {favorite.bathrooms ?? 0} baths
                      {areaSize ? ` · ${areaSize.toLocaleString()} sqft` : ''}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {(favorite.type ?? favorite.propertyType ?? 'Property').replaceAll('_', ' ')}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="text-xs text-gray-500">
                    Trust score: {favorite.landlord?.trustScore ?? favorite.owner?.trustScore ?? 'Not available'}
                  </span>
                  <button
                    disabled={removeFavorite.isPending}
                    onClick={() => void remove(favorite)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 disabled:opacity-50"
                  >
                    <Heart size={14} fill="currentColor" /> Remove
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
