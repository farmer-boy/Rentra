import api from './client';

export interface SavedSearchInput {
  name: string;
  filters: Record<string, unknown>;
}

export interface SavedSearchRecord {
  id: string;
  name: string;
  filtersJson: Record<string, unknown>;
  createdAt: string;
}

export const savedSearchesAPI = {
  list: async () => (await api.get<SavedSearchRecord[]>('/saved-searches')).data,
  create: async (body: SavedSearchInput) =>
    (await api.post<SavedSearchRecord>('/saved-searches', body)).data,
  update: async (id: string, body: Partial<SavedSearchInput>) =>
    (await api.patch<SavedSearchRecord>(`/saved-searches/${id}`, body)).data,
  remove: async (id: string) =>
    (await api.delete<{ id: string; deleted: boolean }>(`/saved-searches/${id}`)).data,
};
