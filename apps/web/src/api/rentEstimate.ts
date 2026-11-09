import api from './client';

export interface RentEstimateInput {
  city: string;
  area?: string;
  propertyType?: string;
  bedrooms?: number;
  sqft?: number;
  rentalDuration?: string;
}

export interface RentEstimateResult {
  city: string;
  area: string | null;
  rentalDuration: string;
  matchedFilters: string[];
  sampleSize: number;
  medianRent: number | null;
  lowerRange: number | null;
  upperRange: number | null;
  comparables: Array<{
    id: string;
    title: string;
    city: string;
    area: string;
    type: string;
    bedrooms: number;
    sqft: number;
    rent: number;
    rentalDuration: string;
  }>;
  notice: string;
}

export const rentEstimateAPI = {
  estimate: async (params: RentEstimateInput) =>
    (await api.get<RentEstimateResult>('/listings/rent-estimate', { params })).data,
};
