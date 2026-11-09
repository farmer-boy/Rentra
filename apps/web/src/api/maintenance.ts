import api from './client';

export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'STRUCTURAL' | 'CLEANING' | 'OTHER';
export type MaintenancePriority = 'NORMAL' | 'URGENT';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface MaintenanceRequest {
  id: string;
  agreementId: string;
  propertyId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  property: { id: string; title: string; city: string | null; area: string | null };
  tenant: { id: string; fullName: string };
  landlord: { id: string; fullName: string };
}

export interface CreateMaintenanceRequestInput {
  agreementId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  subject: string;
  description: string;
}

export const maintenanceAPI = {
  mine: async () => (await api.get<MaintenanceRequest[]>('/maintenance/my')).data,
  received: async () => (await api.get<MaintenanceRequest[]>('/maintenance/received')).data,
  create: async (body: CreateMaintenanceRequestInput) =>
    (await api.post<MaintenanceRequest>('/maintenance', body)).data,
  updateStatus: async (id: string, status: Extract<MaintenanceStatus, 'IN_PROGRESS' | 'RESOLVED'>) =>
    (await api.patch<MaintenanceRequest>(`/maintenance/${id}/status`, { status })).data,
};
