export * from './enums';
export * from './labels';

export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'ef_admin_token',
  ADMIN_PROFILE: 'ef_admin_profile',
} as const;

export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'] as const,
  DASHBOARD_METRICS: ['dashboard', 'metrics'] as const,
  DASHBOARD_ALERTS: ['dashboard', 'alerts'] as const,
  DASHBOARD_DAU_CHART: (days: number) => ['dashboard', 'dau', days] as const,
  DASHBOARD_REVENUE_CHART: (days: number) => ['dashboard', 'revenue', days] as const,
  USERS: (params?: unknown) => ['users', params] as const,
  USER_DETAIL: (userId: string | number) => ['users', userId] as const,
  REPORTS: (params?: unknown) => ['reports', params] as const,
  REPORT_DETAIL: (reportId: string | number) => ['reports', reportId] as const,
  PAYMENTS: (params?: unknown) => ['payments', params] as const,
  PAYMENT_DETAIL: (paymentId: string | number) => ['payments', paymentId] as const,
  PROFILE_REVIEWS: (params?: unknown) => ['profile-reviews', params] as const,
  NOTICES: (params?: unknown) => ['notices', params] as const,
  BAL_APPLIES: (params?: unknown) => ['bal-applies', params] as const,
  BAL_GAMES: (params?: unknown) => ['bal-games', params] as const,
  BAL_GAME_DETAIL: (uuid: string) => ['bal-games', uuid] as const,
  BAL_GAME_STATS: ['bal-games', 'stats'] as const,
  AUDIT_LOGS: (params?: unknown) => ['audit-logs', params] as const,
} as const;
