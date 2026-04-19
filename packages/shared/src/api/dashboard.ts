import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type {
  DashboardMetrics,
  DashboardAlerts,
  ChartPoint,
} from '../types/dashboard';

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const { data } = await getApiClient().get<DashboardMetrics>(
      ADMIN_ENDPOINTS.DASHBOARD_METRICS
    );
    return data;
  },

  getAlerts: async (): Promise<DashboardAlerts> => {
    const { data } = await getApiClient().get<DashboardAlerts>(
      ADMIN_ENDPOINTS.DASHBOARD_ALERTS
    );
    return data;
  },

  getDauChart: async (days = 30): Promise<ChartPoint[]> => {
    const { data } = await getApiClient().get<ChartPoint[]>(
      ADMIN_ENDPOINTS.DASHBOARD_DAU,
      { params: { days } }
    );
    return data;
  },

  getRevenueChart: async (days = 30): Promise<ChartPoint[]> => {
    const { data } = await getApiClient().get<ChartPoint[]>(
      ADMIN_ENDPOINTS.DASHBOARD_REVENUE,
      { params: { days } }
    );
    return data;
  },
};
