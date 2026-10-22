import api from './client';

export interface UserReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  violationConfirmed: boolean;
  createdAt: string;
}

interface UserReportsPage {
  data: UserReport[];
  totalCount: number;
  pagination: { page: number; limit: number; totalPages: number };
}

export interface CreateReportInput {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}

export const reportsAPI = {
  create: async (body: CreateReportInput) => (await api.post('/reports', body)).data,
  mine: async (params: Record<string, unknown> = {}) =>
    (await api.get<UserReportsPage>('/reports/my', { params })).data,
  confirmedFakeListingReports: async (): Promise<UserReport[]> => {
    const firstPage = await reportsAPI.mine({ status: 'RESOLVED', targetType: 'LISTING', page: 1, limit: 100 });
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
        reportsAPI.mine({ status: 'RESOLVED', targetType: 'LISTING', page: index + 2, limit: 100 }),
      ),
    );
    return [firstPage, ...remainingPages].flatMap((page) => page.data).filter((report) => (
      report.violationConfirmed && report.reason === 'FAKE_LISTING'
    ));
  },
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
