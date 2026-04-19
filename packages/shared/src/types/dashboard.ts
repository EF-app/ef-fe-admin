export interface DashboardMetrics {
  dau: number;
  dau_diff: number;
  new_users: number;
  new_users_diff: number;
  today_revenue: number;
  today_revenue_diff: number;
  match_count: number;
  match_count_diff: number;
}

export interface DashboardAlerts {
  pending_reports: number;
  pending_refunds: number;
  pending_bal_applies: number;
  pending_profile_reviews: number;
}

export interface ChartPoint {
  date: string;
  value: number;
}
