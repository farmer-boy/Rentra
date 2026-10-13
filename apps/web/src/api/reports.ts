import api from './client';

export interface CreateReportInput {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}

export const reportsAPI = {
  create: async (body: CreateReportInput) => (await api.post('/reports', body)).data,
  mine: async () => (await api.get('/reports/my')).data,
  byId: async (id: string) => (await api.get(`/reports/${id}`)).data,
  adminList: async (params: Record<string, unknown> = {}) =>
    (await api.get('/admin/reports', { params })).data,
  adminDetail: async (id: string) => (await api.get(`/admin/reports/${id}`)).data,
  adminResolve: async (id: string, body: { resolutionNote: string; violationConfirmed: boolean }) =>
    (await api.post(`/admin/reports/${id}/resolve`, body)).data,
  adminModerateStatus: async (id: string, body: Record<string, unknown>) =>
    (await api.patch(`/admin/reports/${id}/status`, body)).data,
  adminRemoveListing: async (id: string, reason: string) =>
    (await api.post(`/admin/reports/${id}/remove-listing`, { reason })).data,
  adminSuspendUser: async (id: string, reason: string) =>
    (await api.post(`/admin/reports/${id}/suspend-user`, { reason })).data,
};
