import api from './client';

export interface FavoriteRecord {
  id: string;
  listingId?: string | null;
  propertyId?: string | null;
  [key: string]: unknown;
}

export const favoritesAPI = {
  list: async <T = FavoriteRecord>() => (await api.get<T[]>('/favorites')).data,
  has: async (targetId: string) =>
    (await api.get<{ saved: boolean }>(`/favorites/${targetId}`)).data,
  add: async (targetId: string) =>
    (await api.post<FavoriteRecord>(`/favorites/${targetId}`)).data,
  remove: async (targetId: string) =>
    (await api.delete<{ saved: false }>(`/favorites/${targetId}`)).data,
};
