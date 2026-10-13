import api from './client';

export interface AvailabilityQuery {
  startDate: string;
  endDate: string;
  hotelRoomId?: string;
  hostelRoomId?: string;
  hostelBedId?: string;
}

export interface BlockAvailabilityInput extends AvailabilityQuery {
  status: 'BLOCKED' | 'MAINTENANCE';
  reason?: string;
}

export const availabilityAPI = {
  forProperty: async (propertyId: string, params: AvailabilityQuery) =>
    (await api.get(`/properties/${propertyId}/availability`, { params })).data,
  block: async (propertyId: string, body: BlockAvailabilityInput) =>
    (await api.post(`/properties/${propertyId}/availability/block`, body)).data,
  unblock: async (propertyId: string, body: AvailabilityQuery) =>
    (await api.delete(`/properties/${propertyId}/availability/block`, { data: body })).data,
};
