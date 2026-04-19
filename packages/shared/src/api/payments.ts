import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  PaymentLog,
  PaymentListParams,
  RefundRequest,
} from '../types/payment';

export const paymentsApi = {
  list: async (params?: PaymentListParams): Promise<PageResponse<PaymentLog>> => {
    const { data } = await getApiClient().get<PageResponse<PaymentLog>>(
      ADMIN_ENDPOINTS.PAYMENTS,
      { params }
    );
    return data;
  },

  detail: async (id: number): Promise<PaymentLog> => {
    const { data } = await getApiClient().get<PaymentLog>(
      ADMIN_ENDPOINTS.PAYMENT_DETAIL(id)
    );
    return data;
  },

  refund: async (id: number, payload: RefundRequest): Promise<PaymentLog> => {
    const { data } = await getApiClient().post<PaymentLog>(
      ADMIN_ENDPOINTS.PAYMENT_REFUND(id),
      payload
    );
    return data;
  },
};
