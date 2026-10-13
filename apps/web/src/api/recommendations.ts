import api from './client';

export interface RecommendationQuery {
  city?: string;
  area?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
}

export const recommendationsAPI = {
  list: async (params: RecommendationQuery = {}) =>
    (await api.get('/recommendations', { params })).data,
};
