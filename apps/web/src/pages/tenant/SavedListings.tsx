import { useEffect, useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Card from '../../components/ui/Card';

type Favorite = { id: string; title: string; area: string; city: string; rent: number; bedrooms: number; bathrooms: number; sqft: number; images?: Array<{ url: string }>; landlord?: { trustScore?: number } };

export default function SavedListings() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useEffect(() => { api.get('/favorites').then((response) => setFavorites(response.data)).catch(() => setFavorites([])); }, []);
  const remove = async (id: string) => { await api.delete(`/favorites/${id}`); setFavorites((items) => items.filter((item) => item.id !== id)); };
  return <div className="space-y-5"><header><h1 className="text-xl font-extrabold">My Favorites</h1><p className="text-sm text-gray-500">Properties you saved for later.</p></header>{favorites.length === 0 ? <Card><div className="py-10 text-center"><Heart className="mx-auto mb-3 text-rose-500" size={30} /><p className="text-sm text-gray-500">You have not saved any properties yet.</p><button onClick={() => navigate('/tenant/listings')} className="mt-3 text-sm font-semibold text-emerald-600">Browse properties</button></div></Card> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{favorites.map((favorite) => <Card key={favorite.id}><button onClick={() => navigate(`/tenant/listings/${favorite.id}`)} className="w-full text-left"><div className="h-40 overflow-hidden rounded-lg bg-gray-100">{favorite.images?.[0]?.url && <img src={favorite.images[0].url} alt={favorite.title} className="h-full w-full object-cover" />}</div><h2 className="mt-3 font-bold">{favorite.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin size={13} /> {favorite.area}, {favorite.city}</p><p className="mt-2 font-bold text-emerald-600">Rs. {favorite.rent.toLocaleString()} / month</p><p className="mt-1 text-xs text-gray-500">{favorite.bedrooms} beds · {favorite.bathrooms} baths · {favorite.sqft} sqft</p></button><div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-xs text-amber-600">Trust: {favorite.landlord?.trustScore ?? '—'}/100</span><button onClick={() => void remove(favorite.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Heart size={14} fill="currentColor" /> Unsave</button></div></Card>)}</div>}</div>;
}
