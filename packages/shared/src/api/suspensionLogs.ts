import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  SuspensionLog,
  SuspensionLogListParams,
  LiftSuspensionRequest,
} from '../types/suspensionLog';

export const suspensionLogsApi = {
  list: async (
    params?: SuspensionLogListParams
  ): Promise<PageResponse<SuspensionLog>> => {
    const { data } = await getApiClient().get<PageResponse<SuspensionLog>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOGS,
      { params }
    );
    return data;
  },

  detail: async (id: number): Promise<SuspensionLog> => {
    const { data } = await getApiClient().get<SuspensionLog>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_DETAIL(id)
    );
    return data;
  },

  lift: async (id: number, payload: LiftSuspensionRequest): Promise<SuspensionLog> => {
    const { data } = await getApiClient().patch<SuspensionLog>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_LIFT(id),
      payload
    );
    return data;
  },
};
