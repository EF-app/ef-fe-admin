import type {
  DashboardMetrics,
  DashboardAlerts,
  ChartPoint,
} from '../types/dashboard';

export const mockDashboardMetrics: DashboardMetrics = {
  dau: 12840,
  dau_diff: 0.064,
  new_users: 328,
  new_users_diff: -0.021,
  today_revenue: 2_480_000,
  today_revenue_diff: 0.112,
  match_count: 1942,
  match_count_diff: 0.034,
};

export const mockDashboardAlerts: DashboardAlerts = {
  pending_reports: 14,
  pending_refunds: 3,
  pending_bal_applies: 8,
  pending_profile_reviews: 21,
};

function buildSeries(
  days: number,
  base: number,
  variance: number,
  trend = 0
): ChartPoint[] {
  const today = new Date('2026-04-20T00:00:00.000Z');
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - (days - 1 - i));
    const noise = Math.sin(i * 0.7) * variance;
    const value = Math.max(0, Math.round(base + trend * i + noise));
    return { date: d.toISOString().slice(0, 10), value };
  });
}

export const mockDauChart = (days = 30): ChartPoint[] =>
  buildSeries(days, 12000, 1200, 20);

export const mockRevenueChart = (days = 30): ChartPoint[] =>
  buildSeries(days, 2_200_000, 280_000, 8000);
