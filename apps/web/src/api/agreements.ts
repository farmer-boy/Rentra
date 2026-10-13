import api from './client';
import type { Agreement } from './types';

export const agreementsAPI = {
  mine: async <T = Agreement>(): Promise<T[]> =>
    (await api.get<{ data: T[] }>('/agreements/my')).data.data,

  getById: async <T = Agreement>(id: string): Promise<T> =>
    (await api.get<{ data: T }>(`/agreements/${id}`)).data.data,

  terminate: async (id: string, reason?: string): Promise<Agreement> =>
    (
      await api.patch<{ data: Agreement }>(`/agreements/${id}/terminate`, {
        reason,
      })
    ).data.data,
};
