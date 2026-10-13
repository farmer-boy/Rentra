import api from './client';

export interface CreateBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  hotelRoomId?: string;
  roomTypeId?: string;
  hostelBedId?: string;
}

export const bookingsAPI = {
  mine: async <T = unknown>() => (await api.get<T[]>('/bookings/my')).data,
  byId: async <T = unknown>(id: string) => (await api.get<T>(`/bookings/${id}`)).data,
  create: async <T = unknown>(body: CreateBookingInput) =>
    (await api.post<T>('/bookings', body)).data,
  cancel: async <T = unknown>(id: string) => (await api.patch<T>(`/bookings/${id}/cancel`)).data,
  propertyBookings: async <T = unknown>(propertyId: string) =>
    (await api.get<T[]>(`/properties/${propertyId}/bookings`)).data,
};
