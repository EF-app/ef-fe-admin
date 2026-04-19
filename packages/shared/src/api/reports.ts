import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  Report,
  ReportListParams,
  ProcessReportRequest,
} from '../types/report';

export const reportsApi = {
  list: async (params?: ReportListParams): Promise<PageResponse<Report>> => {
    const { data } = await getApiClient().get<PageResponse<Report>>(
      ADMIN_ENDPOINTS.REPORTS,
      { params }
    );
    return data;
  },

  detail: async (id: number): Promise<Report> => {
    const { data } = await getApiClient().get<Report>(
      ADMIN_ENDPOINTS.REPORT_DETAIL(id)
    );
    return data;
  },

  process: async (id: number, payload: ProcessReportRequest): Promise<Report> => {
    const { data } = await getApiClient().post<Report>(
      ADMIN_ENDPOINTS.REPORT_PROCESS(id),
      payload
    );
    return data;
  },

  dismiss: async (id: number, reason?: string): Promise<Report> => {
    const { data } = await getApiClient().patch<Report>(
      ADMIN_ENDPOINTS.REPORT_DISMISS(id),
      { reason }
    );
    return data;
  },
};
