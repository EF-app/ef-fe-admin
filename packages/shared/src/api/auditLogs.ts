import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type { AuditLog } from '../types/admin';

export interface AuditLogListParams {
  admin_id?: number;
  action?: string;
  target_type?: string;
  page?: number;
  size?: number;
}

export const auditLogsApi = {
  list: async (params?: AuditLogListParams): Promise<PageResponse<AuditLog>> => {
    const { data } = await getApiClient().get<PageResponse<AuditLog>>(
      ADMIN_ENDPOINTS.AUDIT_LOGS,
      { params }
    );
    return data;
  },

  detail: async (id: number): Promise<AuditLog> => {
    const { data } = await getApiClient().get<AuditLog>(
      ADMIN_ENDPOINTS.AUDIT_LOG_DETAIL(id)
    );
    return data;
  },
};
