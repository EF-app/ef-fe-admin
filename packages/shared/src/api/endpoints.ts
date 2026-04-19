/** 관리자 API 엔드포인트 (모두 /api/admin/** 이하) */
export const ADMIN_ENDPOINTS = {
  // 인증
  LOGIN: '/api/admin/auth/login',
  LOGOUT: '/api/admin/auth/logout',
  ME: '/api/admin/auth/me',

  // 대시보드
  DASHBOARD_METRICS: '/api/admin/dashboard/metrics',
  DASHBOARD_ALERTS: '/api/admin/dashboard/alerts',
  DASHBOARD_DAU: '/api/admin/dashboard/chart/dau',
  DASHBOARD_REVENUE: '/api/admin/dashboard/chart/revenue',
  DASHBOARD_PAYMENT_SUMMARY: '/api/admin/dashboard/payment-summary',

  // 유저
  USERS: '/api/admin/users',
  USER_DETAIL: (uuid: string | number) => `/api/admin/users/${uuid}`,
  USER_SUSPEND: (uuid: string | number) => `/api/admin/users/${uuid}/suspensions`,
  USER_SUSPENSION_LIFT: (uuid: string | number, suspensionId: number) =>
    `/api/admin/users/${uuid}/suspensions/${suspensionId}/lift`,
  USER_SUSPENSIONS: (uuid: string | number) => `/api/admin/users/${uuid}/suspensions`,

  // 신고
  REPORTS: '/api/admin/reports',
  REPORT_DETAIL: (id: number) => `/api/admin/reports/${id}`,
  REPORT_PROCESS: (id: number) => `/api/admin/reports/${id}/process`,
  REPORT_DISMISS: (id: number) => `/api/admin/reports/${id}/dismiss`,

  // 결제 & 환불
  PAYMENTS: '/api/admin/payments',
  PAYMENT_DETAIL: (id: number) => `/api/admin/payments/${id}`,
  PAYMENT_REFUND: (id: number) => `/api/admin/payments/${id}/refund`,

  // 프로필 심사
  PROFILE_REVIEWS: '/api/admin/profile-reviews',
  PROFILE_REVIEW_DETAIL: (userUuid: string) => `/api/admin/profile-reviews/${userUuid}`,
  PROFILE_REVIEW_APPROVE: (userUuid: string) =>
    `/api/admin/profile-reviews/${userUuid}/approve`,
  PROFILE_REVIEW_REJECT: (userUuid: string) =>
    `/api/admin/profile-reviews/${userUuid}/reject`,

  // 공지
  NOTICES: '/api/admin/notices',
  NOTICE_DETAIL: (uuid: string) => `/api/admin/notices/${uuid}`,
  NOTICE_SEND: (uuid: string) => `/api/admin/notices/${uuid}/send`,
  NOTICE_CANCEL: (uuid: string) => `/api/admin/notices/${uuid}/cancel`,
  NOTICE_CORRECTION: (uuid: string) => `/api/admin/notices/${uuid}/correction`,

  // 밸런스 게임
  BAL_APPLIES: '/api/admin/balance-games/applications',
  BAL_APPLY_APPROVE: (id: number) =>
    `/api/admin/balance-games/applications/${id}/approve`,
  BAL_APPLY_REJECT: (id: number) =>
    `/api/admin/balance-games/applications/${id}/reject`,
  BAL_GAMES: '/api/admin/balance-games',
  BAL_GAME_DETAIL: (uuid: string) => `/api/admin/balance-games/${uuid}`,
  BAL_GAME_HIDE: (uuid: string) => `/api/admin/balance-games/${uuid}/hide`,
  BAL_GAME_PUBLISH: (uuid: string) => `/api/admin/balance-games/${uuid}/publish`,
  BAL_GAME_SCHEDULE: (uuid: string) => `/api/admin/balance-games/${uuid}/schedule`,
  BAL_GAME_ARCHIVE: (uuid: string) => `/api/admin/balance-games/${uuid}/archive`,
  BAL_GAME_STATS: '/api/admin/balance-games/stats',

  // 감사 로그
  AUDIT_LOGS: '/api/admin/audit-logs',
  AUDIT_LOG_DETAIL: (id: number) => `/api/admin/audit-logs/${id}`,
} as const;
