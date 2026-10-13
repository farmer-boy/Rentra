import api from './client';

export interface LocationNode {
  id: string;
  name: string;
  slug: string;
  level: string;
  parentId?: string | null;
}

export const locationsAPI = {
  countries: async () => (await api.get<LocationNode[]>('/locations/countries')).data,
  provinces: async (countryId: string) =>
    (await api.get<LocationNode[]>('/locations/provinces', { params: { countryId } })).data,
  cities: async (provinceId: string) =>
    (await api.get<LocationNode[]>('/locations/cities', { params: { provinceId } })).data,
  areas: async (cityId: string) =>
    (await api.get<LocationNode[]>('/locations/areas', { params: { cityId } })).data,
  search: async (q: string, params: Record<string, unknown> = {}) =>
    (await api.get<LocationNode[]>('/locations/search', { params: { ...params, q } })).data,
  byId: async (id: string) => (await api.get<LocationNode>(`/locations/${id}`)).data,
};
