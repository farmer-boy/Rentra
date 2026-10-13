import api from './client';
export interface PropertyRecord {
  id: string;
  title: string;
  city: string | null;
  area: string | null;
  address: string;
  propertyType: string;
  price: number;
  bedrooms: number;
  status: string;
  verificationStatus: string;
  [key: string]: unknown;
}

export interface CreatePropertyInput {
  title: string;
  type: string;
  rentalMode: string;
  price: number;
  securityDeposit?: number;
  bedrooms: number;
  bathrooms: number;
  areaSizeSqft?: number;
  furnishedStatus?: string;
  availability?: string;
  rules?: string;
  country: string;
  city: string;
  area: string;
  address: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

export interface PropertyImageUpdateInput {
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export const propertiesAPI = {
  create: async (body: CreatePropertyInput) =>
    (await api.post<PropertyRecord>('/properties', body)).data,
  list: async (params: Record<string, unknown> = {}) =>
    (await api.get<{ items: PropertyRecord[]; pagination: unknown }>('/properties', { params })).data,
  details: async (id: string) =>
    (await api.get<PropertyRecord>(`/properties/${id}`)).data,
  update: async (id: string, body: Partial<CreatePropertyInput>) =>
    (await api.patch<PropertyRecord>(`/properties/${id}`, body)).data,
  expire: async (id: string) =>
    (await api.delete<{ id: string; status: string }>(`/properties/${id}`)).data,
  stats: async (id: string, params?: Record<string, unknown>) =>
    (await api.get(`/properties/${id}/stats`, { params })).data,
  recordView: async (id: string, sessionId?: string) =>
    (await api.post(`/properties/${id}/view`, { sessionId })).data,
  getRoomTypes: async <T = unknown>(id: string) =>
    (await api.get<T[]>(`/properties/${id}/room-types`)).data,
  createRoomType: async <T = unknown>(id: string, body: Record<string, unknown>) =>
    (await api.post<T>(`/properties/${id}/room-types`, body)).data,
  uploadImages: async <T = unknown>(id: string, formData: FormData) =>
    (await api.post<T>(`/properties/${id}/images`, formData)).data,
  updateImage: async <T = unknown>(
    id: string,
    imageId: string,
    body: PropertyImageUpdateInput,
  ) => (await api.patch<T>(`/properties/${id}/images/${imageId}`, body)).data,
  deleteImage: async (id: string, imageId: string) =>
    (await api.delete(`/properties/${id}/images/${imageId}`)).data,
  addAmenities: async <T = unknown>(id: string, amenityIds: string[]) =>
    (await api.post<T>(`/properties/${id}/amenities`, { amenityIds })).data,
  removeAmenity: async (id: string, amenityId: string) =>
    (await api.delete(`/properties/${id}/amenities/${amenityId}`)).data,
  assignManager: async (id: string, userId: string) =>
    (await api.post(`/properties/${id}/managers`, { userId })).data,
  revokeManager: async (id: string, userId: string) =>
    (await api.delete(`/properties/${id}/managers/${userId}`)).data,
};
