import api from './client';

export type BoostProductGroup = 'Listings' | 'Credits';

export interface BoostProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  group: BoostProductGroup;
  recommended: boolean;
}

export interface BoostOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BoostOrder {
  id: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'FAILED';
  subtotal: number;
  total: number;
  currency: string;
  createdAt: string;
  items: BoostOrderItem[];
}

interface BoostCatalogResponse {
  currency: string;
  items: BoostProduct[];
}

interface BoostOrdersResponse {
  data: BoostOrder[];
  count: number;
}

export const boostAPI = {
  getCatalog: async () => (await api.get<BoostCatalogResponse>('/boost/catalog')).data,
  createOrder: async (
    items: Array<{ productId: string; quantity: number }>,
    idempotencyKey: string,
  ) =>
    (
      await api.post<BoostOrder>('/boost/orders', { items }, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data,
  getMyOrders: async () =>
    (await api.get<BoostOrdersResponse>('/boost/orders/my')).data,
  getOrder: async (id: string) => (await api.get<BoostOrder>(`/boost/orders/${id}`)).data,
};
