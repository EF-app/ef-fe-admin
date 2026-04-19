import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import { authApi } from '../api/auth';
import { dashboardApi } from '../api/dashboard';
import { usersApi } from '../api/users';
import { reportsApi } from '../api/reports';
import { paymentsApi } from '../api/payments';
import { profileReviewsApi, ProfileReviewListParams } from '../api/profileReviews';
import { noticesApi } from '../api/notices';
import { balGamesApi } from '../api/balGames';
import { auditLogsApi, AuditLogListParams } from '../api/auditLogs';
import type {
  AdminAccount,
  LoginRequest,
  LoginResponse,
} from '../types/admin';
import type { NormalizedError } from '../api/client';
import type {
  User,
  UserDetail,
  UserListParams,
  SuspendUserRequest,
  UserSuspension,
} from '../types/user';
import type {
  Report,
  ReportListParams,
  ProcessReportRequest,
} from '../types/report';
import type {
  PaymentLog,
  PaymentListParams,
  RefundRequest,
} from '../types/payment';
import type {
  Notice,
  NoticeListParams,
  CreateNoticeRequest,
} from '../types/notice';
import type {
  BalApply,
  BalGame,
  BalApplyListParams,
  BalGameListParams,
  RejectBalApplyRequest,
  BalGameUpsertRequest,
  BalGameStats,
} from '../types/balGame';
import type { AuditLog } from '../types/admin';
import type { PageResponse } from '../types/common';
import type {
  DashboardMetrics,
  DashboardAlerts,
  ChartPoint,
} from '../types/dashboard';
import {
  isMockMode,
  mockAdminAccount,
  mockDashboardMetrics,
  mockDashboardAlerts,
  mockDauChart,
  mockRevenueChart,
  mockUsersPage,
  mockUserDetail,
  mockReportsPage,
  mockPaymentsPage,
  mockNoticesPage,
  mockBalAppliesPage,
  mockBalGamesPage,
  mockBalGameStats,
  mockProfileReviewsPage,
  mockAuditLogsPage,
} from '../mocks';

const mocked = <T>(value: T) => (): Promise<T> => Promise.resolve(value);

type QueryOpts<T> = Omit<UseQueryOptions<T, NormalizedError>, 'queryKey' | 'queryFn'>;
type MutationOpts<TData, TVars> = UseMutationOptions<TData, NormalizedError, TVars>;

/* ----------- 인증 ----------- */
export function useMe(options?: QueryOpts<AdminAccount>) {
  return useQuery<AdminAccount, NormalizedError>({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: isMockMode() ? mocked(mockAdminAccount) : authApi.me,
    placeholderData: mockAdminAccount,
    ...options,
  });
}

export function useLoginMutation(options?: MutationOpts<LoginResponse, LoginRequest>) {
  return useMutation<LoginResponse, NormalizedError, LoginRequest>({
    mutationFn: authApi.login,
    ...options,
  });
}

/* ----------- 대시보드 ----------- */
export function useDashboardMetrics(options?: QueryOpts<DashboardMetrics>) {
  return useQuery<DashboardMetrics, NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_METRICS,
    queryFn: isMockMode() ? mocked(mockDashboardMetrics) : dashboardApi.getMetrics,
    placeholderData: mockDashboardMetrics,
    ...options,
  });
}

export function useDashboardAlerts(options?: QueryOpts<DashboardAlerts>) {
  return useQuery<DashboardAlerts, NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_ALERTS,
    queryFn: isMockMode() ? mocked(mockDashboardAlerts) : dashboardApi.getAlerts,
    placeholderData: mockDashboardAlerts,
    ...options,
  });
}

export function useDauChart(days = 30, options?: QueryOpts<ChartPoint[]>) {
  return useQuery<ChartPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_DAU_CHART(days),
    queryFn: isMockMode()
      ? mocked(mockDauChart(days))
      : () => dashboardApi.getDauChart(days),
    placeholderData: mockDauChart(days),
    ...options,
  });
}

export function useRevenueChart(days = 30, options?: QueryOpts<ChartPoint[]>) {
  return useQuery<ChartPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_REVENUE_CHART(days),
    queryFn: isMockMode()
      ? mocked(mockRevenueChart(days))
      : () => dashboardApi.getRevenueChart(days),
    placeholderData: mockRevenueChart(days),
    ...options,
  });
}

/* ----------- 유저 ----------- */
export function useUsers(params?: UserListParams, options?: QueryOpts<PageResponse<User>>) {
  return useQuery<PageResponse<User>, NormalizedError>({
    queryKey: QUERY_KEYS.USERS(params),
    queryFn: isMockMode() ? mocked(mockUsersPage) : () => usersApi.list(params),
    placeholderData: mockUsersPage,
    ...options,
  });
}

export function useUserDetail(
  uuid: string | number | undefined,
  options?: QueryOpts<UserDetail>
) {
  return useQuery<UserDetail, NormalizedError>({
    queryKey: QUERY_KEYS.USER_DETAIL(uuid ?? ''),
    queryFn: isMockMode() ? mocked(mockUserDetail) : () => usersApi.detail(uuid!),
    enabled: !!uuid,
    placeholderData: mockUserDetail,
    ...options,
  });
}

export function useSuspendUserMutation(
  options?: MutationOpts<UserSuspension, { uuid: string | number; payload: SuspendUserRequest }>
) {
  const qc = useQueryClient();
  return useMutation<
    UserSuspension,
    NormalizedError,
    { uuid: string | number; payload: SuspendUserRequest }
  >({
    mutationFn: ({ uuid, payload }) => usersApi.suspend(uuid, payload),
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USER_DETAIL(vars.uuid) });
      qc.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/* ----------- 신고 ----------- */
export function useReports(
  params?: ReportListParams,
  options?: QueryOpts<PageResponse<Report>>
) {
  return useQuery<PageResponse<Report>, NormalizedError>({
    queryKey: QUERY_KEYS.REPORTS(params),
    queryFn: isMockMode() ? mocked(mockReportsPage) : () => reportsApi.list(params),
    placeholderData: mockReportsPage,
    ...options,
  });
}

export function useProcessReportMutation(
  options?: MutationOpts<Report, { id: number; payload: ProcessReportRequest }>
) {
  const qc = useQueryClient();
  return useMutation<Report, NormalizedError, { id: number; payload: ProcessReportRequest }>({
    mutationFn: ({ id, payload }) => reportsApi.process(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDismissReportMutation(
  options?: MutationOpts<Report, { id: number; reason?: string }>
) {
  const qc = useQueryClient();
  return useMutation<Report, NormalizedError, { id: number; reason?: string }>({
    mutationFn: ({ id, reason }) => reportsApi.dismiss(id, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/* ----------- 결제 & 환불 ----------- */
export function usePayments(
  params?: PaymentListParams,
  options?: QueryOpts<PageResponse<PaymentLog>>
) {
  return useQuery<PageResponse<PaymentLog>, NormalizedError>({
    queryKey: QUERY_KEYS.PAYMENTS(params),
    queryFn: isMockMode() ? mocked(mockPaymentsPage) : () => paymentsApi.list(params),
    placeholderData: mockPaymentsPage,
    ...options,
  });
}

export function useRefundMutation(
  options?: MutationOpts<PaymentLog, { id: number; payload: RefundRequest }>
) {
  const qc = useQueryClient();
  return useMutation<PaymentLog, NormalizedError, { id: number; payload: RefundRequest }>({
    mutationFn: ({ id, payload }) => paymentsApi.refund(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/* ----------- 프로필 심사 ----------- */
export function useProfileReviews(
  params?: ProfileReviewListParams,
  options?: QueryOpts<PageResponse<User>>
) {
  return useQuery<PageResponse<User>, NormalizedError>({
    queryKey: QUERY_KEYS.PROFILE_REVIEWS(params),
    queryFn: isMockMode()
      ? mocked(mockProfileReviewsPage)
      : () => profileReviewsApi.list(params),
    placeholderData: mockProfileReviewsPage,
    ...options,
  });
}

export function useApproveProfileMutation(options?: MutationOpts<void, string>) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, string>({
    mutationFn: (userUuid) => profileReviewsApi.approve(userUuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['profile-reviews'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useRejectProfileMutation(
  options?: MutationOpts<void, { userUuid: string; reason: string }>
) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, { userUuid: string; reason: string }>({
    mutationFn: ({ userUuid, reason }) => profileReviewsApi.reject(userUuid, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['profile-reviews'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/* ----------- 공지 ----------- */
export function useNotices(
  params?: NoticeListParams,
  options?: QueryOpts<PageResponse<Notice>>
) {
  return useQuery<PageResponse<Notice>, NormalizedError>({
    queryKey: QUERY_KEYS.NOTICES(params),
    queryFn: isMockMode() ? mocked(mockNoticesPage) : () => noticesApi.list(params),
    placeholderData: mockNoticesPage,
    ...options,
  });
}

export function useCreateNoticeMutation(options?: MutationOpts<Notice, CreateNoticeRequest>) {
  const qc = useQueryClient();
  return useMutation<Notice, NormalizedError, CreateNoticeRequest>({
    mutationFn: noticesApi.create,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useSendNoticeMutation(options?: MutationOpts<Notice, string>) {
  const qc = useQueryClient();
  return useMutation<Notice, NormalizedError, string>({
    mutationFn: (uuid) => noticesApi.send(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/* ----------- 밸런스 게임 ----------- */
export function useBalApplies(
  params?: BalApplyListParams,
  options?: QueryOpts<PageResponse<BalApply>>
) {
  return useQuery<PageResponse<BalApply>, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_APPLIES(params),
    queryFn: isMockMode()
      ? mocked(mockBalAppliesPage)
      : () => balGamesApi.listApplies(params),
    placeholderData: mockBalAppliesPage,
    ...options,
  });
}

export function useBalGames(
  params?: BalGameListParams,
  options?: QueryOpts<PageResponse<BalGame>>
) {
  return useQuery<PageResponse<BalGame>, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_GAMES(params),
    queryFn: isMockMode()
      ? mocked(mockBalGamesPage)
      : () => balGamesApi.listGames(params),
    placeholderData: mockBalGamesPage,
    ...options,
  });
}

export function useApproveBalApplyMutation(options?: MutationOpts<BalGame, number>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, number>({
    mutationFn: (id) => balGamesApi.approveApply(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-applies'] });
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useRejectBalApplyMutation(
  options?: MutationOpts<BalApply, { id: number; payload: RejectBalApplyRequest }>
) {
  const qc = useQueryClient();
  return useMutation<
    BalApply,
    NormalizedError,
    { id: number; payload: RejectBalApplyRequest }
  >({
    mutationFn: ({ id, payload }) => balGamesApi.rejectApply(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-applies'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useHideBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    mutationFn: (uuid) => balGamesApi.hideGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function usePublishBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    mutationFn: (uuid) => balGamesApi.publishGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useScheduleBalGameMutation(
  options?: MutationOpts<BalGame, { uuid: string; scheduled_at: string }>
) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, { uuid: string; scheduled_at: string }>({
    mutationFn: ({ uuid, scheduled_at }) => balGamesApi.scheduleGame(uuid, scheduled_at),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useArchiveBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    mutationFn: (uuid) => balGamesApi.archiveGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useCreateBalGameMutation(options?: MutationOpts<BalGame, BalGameUpsertRequest>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, BalGameUpsertRequest>({
    mutationFn: (payload) => balGamesApi.createGame(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateBalGameMutation(
  options?: MutationOpts<BalGame, { uuid: string; payload: BalGameUpsertRequest }>
) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, { uuid: string; payload: BalGameUpsertRequest }>({
    mutationFn: ({ uuid, payload }) => balGamesApi.updateGame(uuid, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useBalGameStats(options?: QueryOpts<BalGameStats>) {
  return useQuery<BalGameStats, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_GAME_STATS,
    queryFn: isMockMode() ? mocked(mockBalGameStats) : balGamesApi.getStats,
    placeholderData: mockBalGameStats,
    ...options,
  });
}

/* ----------- 감사 로그 ----------- */
export function useAuditLogs(
  params?: AuditLogListParams,
  options?: QueryOpts<PageResponse<AuditLog>>
) {
  return useQuery<PageResponse<AuditLog>, NormalizedError>({
    queryKey: QUERY_KEYS.AUDIT_LOGS(params),
    queryFn: isMockMode() ? mocked(mockAuditLogsPage) : () => auditLogsApi.list(params),
    placeholderData: mockAuditLogsPage,
    ...options,
  });
}
