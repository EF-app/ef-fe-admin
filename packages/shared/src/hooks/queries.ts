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
import { userBeApi } from '../api/userBe';
import { balCommentBeApi } from '../api/balCommentBe';
import { blockBeApi } from '../api/blockBe';
import { reportsApi } from '../api/reports';
import { reportsBeApi } from '../api/reportsBe';
import { paymentsApi } from '../api/payments';
import { profileReviewsApi, ProfileReviewListParams } from '../api/profileReviews';
import { noticesApi } from '../api/notices';
import { balGamesApi } from '../api/balGames';
import { auditLogsApi, AuditLogListParams } from '../api/auditLogs';
import { suspensionLogsApi } from '../api/suspensionLogs';
import { postItsApi } from '../api/postIts';
import { feedbackBeApi } from '../api/feedbackBe';
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
  UserBalGameComment,
  SuspendUserRequest,
  UserSuspension,
} from '../types/user';
import type {
  Report,
  ReportListParams,
  ReportGroup,
  ReportGroupListParams,
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
  SuspensionLog,
  SuspensionLogListParams,
  LiftSuspensionRequest,
} from '../types/suspensionLog';
import type { PostIt, PostItListParams } from '../types/postIt';
import type {
  Feedback,
  FeedbackListParams,
  UpdateFeedbackRequest,
} from '../types/feedback';
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
  mockUserDetailSuspended,
  mockUserDetailWithdrawing,
  mockReportsPage,
  mockReports,
  mockReportGroupsPage,
  mockPaymentsPage,
  mockPayments,
  mockNoticesPage,
  mockBalAppliesPage,
  mockBalGamesPage,
  mockBalGameStats,
  mockProfileReviewsPage,
  mockAuditLogsPage,
  mockSuspensionLogsPage,
  mockSuspensionLogs,
  mockPostItsPage,
  mockPostIts,
  mockFeedbacksPage,
  mockFeedbacks,
  mockBlocksPage,
  mockBannedWordsPage,
  mockBannedWords,
  mockPremiumMembersPage,
  mockRevenueSummary,
  mockRevenueByMethod,
  mockRevenueByPlan,
  mockRevenueDailyChart,
  mockPaymentDailySummary,
  mockMatchingFunnel,
  mockMatchingDailyChart,
  mockMatchingWeights,
  mockAdminsPage,
  mockAdmins,
  mockPoliciesPage,
  mockPolicies,
  mockSystemMessagesPage,
  mockSystemMessages,
} from '../mocks';
import type { BlockEntry, BlockListParams } from '../types/block';
import type {
  BannedWord,
  BannedWordListParams,
  BannedWordUpsertRequest,
} from '../types/bannedWord';
import type { PremiumMember, PremiumListParams } from '../types/premium';
import type {
  RevenueSummary,
  RevenueByMethod,
  RevenueByPlan,
  PaymentDailySummary,
} from '../types/revenue';
import type {
  MatchingFunnel,
  MatchingDailyPoint,
  MatchingWeights,
  UpdateMatchingWeightsRequest,
} from '../types/matchingMetrics';
import type {
  AdminListParams,
  CreateAdminRequest,
  UpdateAdminRequest,
} from '../types/adminMgmt';
import type {
  PolicyDoc,
  PolicyListParams,
  PolicyUpsertRequest,
} from '../types/policy';
import type {
  SystemMessageTemplate,
  SystemMessageListParams,
  SystemMessageUpsertRequest,
  SystemMessageBroadcastRequest,
} from '../types/systemMessage';

const mocked = <T>(value: T) => (): Promise<T> => Promise.resolve(value);

type QueryOpts<T> = Omit<UseQueryOptions<T, NormalizedError>, 'queryKey' | 'queryFn'>;
type MutationOpts<TData, TVars> = UseMutationOptions<TData, NormalizedError, TVars>;

/* ----------- 인증 ----------- */
import { authBeApi } from '../api/authBe';
import { ADMIN_ROLE } from '../constants/enums';

/**
 * BE 로그인/me 응답을 FE 의 AdminAccount 모양으로 변환.
 * BE 의 AdminLoginRspDto / AdminInfoRspDto 는 role 을 내려주지 않고
 * 모든 관리자에게 단일 ROLE_ADMIN 권한이 JWT claim 으로만 박힘.
 * 따라서 FE 측에서는 role 을 ADMIN_ROLE.ADMIN 으로 하드코딩한다.
 * 향후 BE 가 응답 DTO 에 role 을 추가하면 인자로 받아 normalize 하는 가드 추가 예정.
 */
function adminAccountFromBe(be: {
  loginId: string;
  name: string;
}): AdminAccount {
  const now = new Date().toISOString();
  return {
    id: 0,
    uuid: '',
    login_id: be.loginId,
    name: be.name,
    email: '',
    phone: '',
    role: ADMIN_ROLE.ADMIN,
    is_active: true,
    deactivated_at: null,
    deactivated_reason: null,
    last_login_at: now,
    last_login_ip: null,
    create_time: now,
    update_time: now,
  };
}

export function useMe(options?: QueryOpts<AdminAccount>) {
  return useQuery<AdminAccount, NormalizedError>({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: isMockMode()
      ? mocked(mockAdminAccount)
      : async () => {
          const be = await authBeApi.me();
          return adminAccountFromBe(be);
        },
    placeholderData: mockAdminAccount,
    ...options,
  });
}

/** mock 전용 — 팀원 데모용 계정 (admin02 / 1234) */
const MOCK_LOGIN_ACCOUNTS: Record<
  string,
  { password: string; admin: AdminAccount }
> = {
  admin02: {
    password: '1234',
    admin: {
      id: 2,
      uuid: 'admin-02-mock',
      login_id: 'admin02',
      name: '팀원',
      email: 'team@ef.test',
      phone: '010-0000-0002',
      role: ADMIN_ROLE.ADMIN,
      is_active: true,
      deactivated_at: null,
      deactivated_reason: null,
      last_login_at: new Date().toISOString(),
      last_login_ip: '127.0.0.1',
      create_time: '2026-01-01T00:00:00.000Z',
      update_time: new Date().toISOString(),
    },
  },
};

export function useLoginMutation(options?: MutationOpts<LoginResponse, LoginRequest>) {
  return useMutation<LoginResponse, NormalizedError, LoginRequest>({
    ...options,
    // BE 연결됨. VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? (payload) => {
          const acc = MOCK_LOGIN_ACCOUNTS[payload.login_id];
          if (!acc || acc.password !== payload.password) {
            return Promise.reject<LoginResponse>({
              status: 401,
              message: '아이디 또는 비밀번호가 올바르지 않습니다.',
            } satisfies NormalizedError);
          }
          return Promise.resolve<LoginResponse>({
            token: `mock-token-${payload.login_id}-${Date.now()}`,
            admin: acc.admin,
            expires_in: 3600,
          });
        }
      : async (payload) => {
          // BE: camelCase 키, /v1/admin/auth/login
          const be = await authBeApi.login({
            loginId: payload.login_id,
            password: payload.password,
            scodeStep: false,
            platform: 'WEB',
          });
          // refreshToken 은 localStorage 에 별도 보관 (인터셉터/갱신용)
          if (typeof window !== 'undefined' && be.refreshToken) {
            try {
              window.localStorage.setItem('ef_admin_refresh_token', be.refreshToken);
            } catch {
              /* ignore */
            }
          }
          return {
            token: be.accessToken,
            admin: adminAccountFromBe(be),
            expires_in: 3600,
          };
        },
  });
}

/* ----------- 대시보드 ----------- */
export function useDashboardMetrics(options?: QueryOpts<DashboardMetrics>) {
  return useQuery<DashboardMetrics, NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_METRICS,
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockDashboardMetrics) : dashboardApi.getMetrics,
    placeholderData: mockDashboardMetrics,
    ...options,
  });
}

export function useDashboardAlerts(options?: QueryOpts<DashboardAlerts>) {
  return useQuery<DashboardAlerts, NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_ALERTS,
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockDashboardAlerts) : dashboardApi.getAlerts,
    placeholderData: mockDashboardAlerts,
    ...options,
  });
}

export function useDauChart(days = 30, options?: QueryOpts<ChartPoint[]>) {
  return useQuery<ChartPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_DAU_CHART(days),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
      ? mocked(mockDauChart(days))
      : () => dashboardApi.getDauChart(days),
    placeholderData: mockDauChart(days),
    ...options,
  });
}

export function useRevenueChart(days = 30, options?: QueryOpts<ChartPoint[]>) {
  return useQuery<ChartPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.DASHBOARD_REVENUE_CHART(days),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
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
    // BE 연결됨 (AdminUserController GET /v1/admin/user). VITE_USE_MOCK=true 면 mock.
    queryFn: isMockMode() ? mocked(mockUsersPage) : () => userBeApi.getUser(params),
    placeholderData: mockUsersPage,
    ...options,
  });
}

function pickMockUserDetail(id: string | number | undefined): UserDetail {
  if (id === 'u-103' || id === 103) return mockUserDetailSuspended;
  if (id === 'u-104' || id === 104) return mockUserDetailWithdrawing;
  return mockUserDetail;
}

export function useUserDetail(
  id: number | undefined,
  options?: QueryOpts<UserDetail>
) {
  return useQuery<UserDetail, NormalizedError>({
    queryKey: QUERY_KEYS.USER_DETAIL(id ?? ''),
    // BE 연결됨 (AdminUserController GET /v1/admin/user/{id}). VITE_USE_MOCK=true 면 mock.
    queryFn: isMockMode()
      ? mocked(pickMockUserDetail(id))
      : () => userBeApi.getUserDetail(id!),
    enabled: id != null,
    placeholderData: pickMockUserDetail(id),
    ...options,
  });
}

/** 유저가 작성한 밸런스 게임 댓글 — 유저 상세 "작성한 글" 탭. (/v1/admin/bal-comment) */
export function useUserBalComments(
  userId: number | undefined,
  options?: QueryOpts<UserBalGameComment[]>
) {
  const fallback = pickMockUserDetail(userId).recent_bal_comments ?? [];
  return useQuery<UserBalGameComment[], NormalizedError>({
    queryKey: ['user-bal-comments', userId],
    queryFn: isMockMode()
      ? mocked(fallback)
      : () => balCommentBeApi.getUserBalComments(userId!),
    enabled: userId != null,
    placeholderData: fallback,
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
    ...options,
    mutationFn: ({ uuid, payload }) => usersApi.suspend(uuid, payload),
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USER_DETAIL(vars.uuid) });
      qc.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 신고 ----------- */
export function useReports(
  params?: ReportListParams,
  options?: QueryOpts<PageResponse<Report>>
) {
  return useQuery<PageResponse<Report>, NormalizedError>({
    queryKey: QUERY_KEYS.REPORTS(params),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(mockReportsPage)
      : () => reportsBeApi.list(params),
    placeholderData: mockReportsPage,
    ...options,
  });
}

/**
 * 그룹화된 신고 목록 — BE `GET /v1/admin/reports/grouped`.
 * 같은 (target_type, target_id) 신고들이 한 그룹으로 묶이고,
 * 그룹 내부는 시간 ASC. 첫 항목이 BE 의 "자동 첫 신고 대표" 후보.
 */
export function useReportsGrouped(
  params?: ReportGroupListParams,
  options?: QueryOpts<PageResponse<ReportGroup>>
) {
  return useQuery<PageResponse<ReportGroup>, NormalizedError>({
    queryKey: QUERY_KEYS.REPORTS_GROUPED(params),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(mockReportGroupsPage)
      : () => reportsBeApi.listGrouped(params),
    placeholderData: mockReportGroupsPage,
    ...options,
  });
}

export function useReportDetail(
  id: number | undefined,
  options?: QueryOpts<Report>
) {
  const fallback = mockReports.find((r) => r.id === id) ?? mockReports[0];
  return useQuery<Report, NormalizedError>({
    queryKey: QUERY_KEYS.REPORT_DETAIL(id ?? 0),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : () => reportsBeApi.detail(id!),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useProcessReportMutation(
  options?: MutationOpts<Report, { id: number; payload: ProcessReportRequest }>
) {
  const qc = useQueryClient();
  return useMutation<Report, NormalizedError, { id: number; payload: ProcessReportRequest }>({
    ...options,
    mutationFn: ({ id, payload }) => reportsApi.process(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDismissReportMutation(
  options?: MutationOpts<Report, { id: number; reason?: string }>
) {
  const qc = useQueryClient();
  return useMutation<Report, NormalizedError, { id: number; reason?: string }>({
    ...options,
    mutationFn: ({ id, reason }) => reportsApi.dismiss(id, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 결제 & 환불 ----------- */
export function usePayments(
  params?: PaymentListParams,
  options?: QueryOpts<PageResponse<PaymentLog>>
) {
  return useQuery<PageResponse<PaymentLog>, NormalizedError>({
    queryKey: QUERY_KEYS.PAYMENTS(params),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockPaymentsPage) : () => paymentsApi.list(params),
    placeholderData: mockPaymentsPage,
    ...options,
  });
}

export function usePaymentDetail(
  id: number | undefined,
  options?: QueryOpts<PaymentLog>
) {
  const fallback = mockPayments.find((p) => p.id === id) ?? mockPayments[0];
  return useQuery<PaymentLog, NormalizedError>({
    queryKey: QUERY_KEYS.PAYMENT_DETAIL(id ?? 0),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(fallback) : () => paymentsApi.detail(id!),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useRefundMutation(
  options?: MutationOpts<PaymentLog, { id: number; payload: RefundRequest }>
) {
  const qc = useQueryClient();
  return useMutation<PaymentLog, NormalizedError, { id: number; payload: RefundRequest }>({
    ...options,
    mutationFn: ({ id, payload }) => paymentsApi.refund(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_ALERTS });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 프로필 심사 ----------- */
export function useProfileReviews(
  params?: ProfileReviewListParams,
  options?: QueryOpts<PageResponse<User>>
) {
  return useQuery<PageResponse<User>, NormalizedError>({
    queryKey: QUERY_KEYS.PROFILE_REVIEWS(params),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
      ? mocked(mockProfileReviewsPage)
      : () => profileReviewsApi.list(params),
    placeholderData: mockProfileReviewsPage,
    ...options,
  });
}

export function useApproveProfileMutation(options?: MutationOpts<void, string>) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, string>({
    ...options,
    mutationFn: (userUuid) => profileReviewsApi.approve(userUuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['profile-reviews'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRejectProfileMutation(
  options?: MutationOpts<void, { userUuid: string; reason: string }>
) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, { userUuid: string; reason: string }>({
    ...options,
    mutationFn: ({ userUuid, reason }) => profileReviewsApi.reject(userUuid, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['profile-reviews'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 공지 ----------- */
export function useNotices(
  params?: NoticeListParams,
  options?: QueryOpts<PageResponse<Notice>>
) {
  return useQuery<PageResponse<Notice>, NormalizedError>({
    queryKey: QUERY_KEYS.NOTICES(params),
    // BE 미구현 (레거시 notice — 새 NoticeBe 가 BE 연결됨). true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockNoticesPage) : () => noticesApi.list(params),
    placeholderData: mockNoticesPage,
    ...options,
  });
}

export function useCreateNoticeMutation(options?: MutationOpts<Notice, CreateNoticeRequest>) {
  const qc = useQueryClient();
  return useMutation<Notice, NormalizedError, CreateNoticeRequest>({
    ...options,
    mutationFn: noticesApi.create,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useSendNoticeMutation(options?: MutationOpts<Notice, string>) {
  const qc = useQueryClient();
  return useMutation<Notice, NormalizedError, string>({
    ...options,
    mutationFn: (uuid) => noticesApi.send(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 밸런스 게임 ----------- */
export function useBalApplies(
  params?: BalApplyListParams,
  options?: QueryOpts<PageResponse<BalApply>>
) {
  return useQuery<PageResponse<BalApply>, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_APPLIES(params),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
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
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
      ? mocked(mockBalGamesPage)
      : () => balGamesApi.listGames(params),
    placeholderData: mockBalGamesPage,
    ...options,
  });
}

export function useApproveBalApplyMutation(options?: MutationOpts<BalGame, number>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, number>({
    ...options,
    mutationFn: (id) => balGamesApi.approveApply(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-applies'] });
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
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
    ...options,
    mutationFn: ({ id, payload }) => balGamesApi.rejectApply(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-applies'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useHideBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    ...options,
    mutationFn: (uuid) => balGamesApi.hideGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function usePublishBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    ...options,
    mutationFn: (uuid) => balGamesApi.publishGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useScheduleBalGameMutation(
  options?: MutationOpts<BalGame, { uuid: string; scheduled_at: string }>
) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, { uuid: string; scheduled_at: string }>({
    ...options,
    mutationFn: ({ uuid, scheduled_at }) => balGamesApi.scheduleGame(uuid, scheduled_at),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useArchiveBalGameMutation(options?: MutationOpts<BalGame, string>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, string>({
    ...options,
    mutationFn: (uuid) => balGamesApi.archiveGame(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateBalGameMutation(options?: MutationOpts<BalGame, BalGameUpsertRequest>) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, BalGameUpsertRequest>({
    ...options,
    mutationFn: (payload) => balGamesApi.createGame(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateBalGameMutation(
  options?: MutationOpts<BalGame, { uuid: string; payload: BalGameUpsertRequest }>
) {
  const qc = useQueryClient();
  return useMutation<BalGame, NormalizedError, { uuid: string; payload: BalGameUpsertRequest }>({
    ...options,
    mutationFn: ({ uuid, payload }) => balGamesApi.updateGame(uuid, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useBalGameStats(options?: QueryOpts<BalGameStats>) {
  return useQuery<BalGameStats, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_GAME_STATS,
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockBalGameStats) : balGamesApi.getStats,
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
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockAuditLogsPage) : () => auditLogsApi.list(params),
    placeholderData: mockAuditLogsPage,
    ...options,
  });
}

/* ----------- 제재 로그 ----------- */
export function useSuspensionLogs(
  params?: SuspensionLogListParams,
  options?: QueryOpts<PageResponse<SuspensionLog>>
) {
  return useQuery<PageResponse<SuspensionLog>, NormalizedError>({
    queryKey: QUERY_KEYS.SUSPENSION_LOGS(params),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
      ? mocked(mockSuspensionLogsPage)
      : () => suspensionLogsApi.list(params),
    placeholderData: mockSuspensionLogsPage,
    ...options,
  });
}

export function useSuspensionLogDetail(
  id: number | undefined,
  options?: QueryOpts<SuspensionLog>
) {
  const fallback =
    mockSuspensionLogs.find((s) => s.id === id) ?? mockSuspensionLogs[0];
  return useQuery<SuspensionLog, NormalizedError>({
    queryKey: QUERY_KEYS.SUSPENSION_LOG_DETAIL(id ?? 0),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true
      ? mocked(fallback)
      : () => suspensionLogsApi.detail(id!),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useLiftSuspensionMutation(
  options?: MutationOpts<SuspensionLog, { id: number; payload: LiftSuspensionRequest }>
) {
  const qc = useQueryClient();
  return useMutation<
    SuspensionLog,
    NormalizedError,
    { id: number; payload: LiftSuspensionRequest }
  >({
    ...options,
    mutationFn: ({ id, payload }) => suspensionLogsApi.lift(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['suspension-logs'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
}

/** 탈퇴 신청 철회 (30일 유예 중에만 가능 — is_withdraw=false, withdraw_date=null 로 리셋) */
export function useCancelWithdrawalMutation(
  options?: MutationOpts<UserDetail, { uuid: string | number; reason?: string }>
) {
  const qc = useQueryClient();
  return useMutation<UserDetail, NormalizedError, { uuid: string | number; reason?: string }>({
    ...options,
    mutationFn: ({ uuid }) => {
      // mock: pickMockUserDetail 의 대상 객체를 직접 변형
      const target =
        uuid === 'u-103' || uuid === 103
          ? mockUserDetailSuspended
          : uuid === 'u-104' || uuid === 104
            ? mockUserDetailWithdrawing
            : mockUserDetail;
      target.is_withdraw = false;
      target.withdraw_date = null;
      target.update_time = new Date().toISOString();
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USER_DETAIL(vars.uuid) });
      qc.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 포스트잇 ----------- */
export function usePostIts(
  params?: PostItListParams,
  options?: QueryOpts<PageResponse<PostIt>>
) {
  return useQuery<PageResponse<PostIt>, NormalizedError>({
    queryKey: QUERY_KEYS.POST_ITS(params),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(mockPostItsPage) : () => postItsApi.list(params),
    placeholderData: mockPostItsPage,
    ...options,
  });
}

export function usePostItDetail(
  uuid: string | undefined,
  options?: QueryOpts<PostIt>
) {
  const fallback = mockPostIts.find((p) => p.uuid === uuid) ?? mockPostIts[0];
  return useQuery<PostIt, NormalizedError>({
    queryKey: QUERY_KEYS.POST_IT_DETAIL(uuid ?? ''),
    // BE 미구현 — true 를 isMockMode() 로 되돌리면 BE 분기 복귀.
    queryFn: true ? mocked(fallback) : () => postItsApi.detail(uuid!),
    enabled: !!uuid,
    placeholderData: fallback,
    ...options,
  });
}

export function useHidePostItMutation(
  options?: MutationOpts<PostIt, { uuid: string; reason?: string }>
) {
  const qc = useQueryClient();
  return useMutation<PostIt, NormalizedError, { uuid: string; reason?: string }>({
    ...options,
    mutationFn: ({ uuid, reason }) => postItsApi.hide(uuid, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['post-its'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRestorePostItMutation(options?: MutationOpts<PostIt, string>) {
  const qc = useQueryClient();
  return useMutation<PostIt, NormalizedError, string>({
    ...options,
    mutationFn: (uuid) => postItsApi.restore(uuid),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['post-its'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 버그·기능 피드백 ----------- */
export function useFeedbacks(
  params?: FeedbackListParams,
  options?: QueryOpts<PageResponse<Feedback>>
) {
  return useQuery<PageResponse<Feedback>, NormalizedError>({
    queryKey: QUERY_KEYS.FEEDBACKS(params),
    // BE 연결됨 (AdminFeedbackController GET /v1/admin/feedback). VITE_USE_MOCK=true 면 mock.
    queryFn: isMockMode() ? mocked(mockFeedbacksPage) : () => feedbackBeApi.list(params),
    placeholderData: mockFeedbacksPage,
    ...options,
  });
}

export function useFeedbackDetail(
  id: number | undefined,
  options?: QueryOpts<Feedback>
) {
  const fallback = mockFeedbacks.find((f) => f.id === id) ?? mockFeedbacks[0];
  return useQuery<Feedback, NormalizedError>({
    queryKey: QUERY_KEYS.FEEDBACK_DETAIL(id ?? 0),
    // BE 연결됨 (AdminFeedbackController GET /v1/admin/feedback/{id}). VITE_USE_MOCK=true 면 mock.
    queryFn: isMockMode() ? mocked(fallback) : () => feedbackBeApi.detail(id!),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useUpdateFeedbackMutation(
  options?: MutationOpts<Feedback, { id: number; payload: UpdateFeedbackRequest }>
) {
  const qc = useQueryClient();
  return useMutation<
    Feedback,
    NormalizedError,
    { id: number; payload: UpdateFeedbackRequest }
  >({
    ...options,
    // BE 연결됨 (AdminFeedbackController PATCH /v1/admin/feedback/{id}). VITE_USE_MOCK=true 면 mock.
    mutationFn: isMockMode()
      ? ({ id, payload }) => {
          // mock — 새 객체를 만들어 반환(+ mockFeedbacks 항목 교체)해 재조회/리렌더가 확실하도록
          const idx = mockFeedbacks.findIndex((x) => x.id === id);
          const base = idx >= 0 ? mockFeedbacks[idx] : mockFeedbacks[0];
          const updated: Feedback = {
            ...base,
            status: payload.status ?? base.status,
            admin_reply: payload.admin_reply ?? base.admin_reply,
            admin_internal_memo: payload.admin_internal_memo ?? base.admin_internal_memo,
          };
          if (idx >= 0) mockFeedbacks[idx] = updated;
          return Promise.resolve(updated);
        }
      : ({ id, payload }) => feedbackBeApi.update(id, payload),
    onSuccess: (...args) => {
      const [data, vars] = args;
      // 뮤테이션이 돌려준 최신 데이터를 상세 캐시에 직접 반영 — 재조회 없이 즉시 화면 갱신
      qc.setQueryData(QUERY_KEYS.FEEDBACK_DETAIL(vars.id), data);
      // refetchType:'all' — 비활성 목록 쿼리까지 즉시 재조회해 목록 도착 시 최신 상태
      qc.invalidateQueries({ queryKey: ['feedbacks'], refetchType: 'all' });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 차단 내역 (전체) ----------- */
export function useBlocks(
  params?: BlockListParams,
  options?: QueryOpts<PageResponse<BlockEntry>>
) {
  return useQuery<PageResponse<BlockEntry>, NormalizedError>({
    queryKey: QUERY_KEYS.BLOCKS(params),
    // BE 연결됨 (AdminBlockController GET /v1/admin/block). VITE_USE_MOCK=true 면 mock.
    queryFn: isMockMode() ? mocked(mockBlocksPage) : () => blockBeApi.getBlocks(params),
    placeholderData: mockBlocksPage,
    ...options,
  });
}

/* ----------- 금칙어 ----------- */
export function useBannedWords(
  params?: BannedWordListParams,
  options?: QueryOpts<PageResponse<BannedWord>>
) {
  return useQuery<PageResponse<BannedWord>, NormalizedError>({
    queryKey: QUERY_KEYS.BANNED_WORDS(params),
    queryFn: mocked(mockBannedWordsPage),
    placeholderData: mockBannedWordsPage,
    ...options,
  });
}

export function useCreateBannedWordMutation(
  options?: MutationOpts<BannedWord, BannedWordUpsertRequest>
) {
  const qc = useQueryClient();
  return useMutation<BannedWord, NormalizedError, BannedWordUpsertRequest>({
    ...options,
    mutationFn: (payload) => {
      const next: BannedWord = {
        id: Date.now(),
        word: payload.word,
        severity: payload.severity,
        category: payload.category,
        is_active: payload.is_active ?? true,
        hit_count: 0,
        created_by_admin_id: 1,
        created_by_admin_name: '관리자',
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
      };
      mockBannedWords.unshift(next);
      return Promise.resolve(next);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['banned-words'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useToggleBannedWordMutation(
  options?: MutationOpts<BannedWord, { id: number; is_active: boolean }>
) {
  const qc = useQueryClient();
  return useMutation<BannedWord, NormalizedError, { id: number; is_active: boolean }>({
    ...options,
    mutationFn: ({ id, is_active }) => {
      const target = mockBannedWords.find((w) => w.id === id)!;
      target.is_active = is_active;
      target.update_time = new Date().toISOString();
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['banned-words'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteBannedWordMutation(options?: MutationOpts<void, number>) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, number>({
    ...options,
    mutationFn: (id) => {
      const idx = mockBannedWords.findIndex((w) => w.id === id);
      if (idx >= 0) mockBannedWords.splice(idx, 1);
      return Promise.resolve();
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['banned-words'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 프리미엄 회원 ----------- */
export function usePremiumMembers(
  params?: PremiumListParams,
  options?: QueryOpts<PageResponse<PremiumMember>>
) {
  return useQuery<PageResponse<PremiumMember>, NormalizedError>({
    queryKey: QUERY_KEYS.PREMIUM_MEMBERS(params),
    queryFn: mocked(mockPremiumMembersPage),
    placeholderData: mockPremiumMembersPage,
    ...options,
  });
}

/* ----------- 매출/정산 ----------- */
export function useRevenueSummary(options?: QueryOpts<RevenueSummary>) {
  return useQuery<RevenueSummary, NormalizedError>({
    queryKey: QUERY_KEYS.REVENUE_SUMMARY('30d'),
    queryFn: mocked(mockRevenueSummary),
    placeholderData: mockRevenueSummary,
    ...options,
  });
}

export function useRevenueByMethod(options?: QueryOpts<RevenueByMethod[]>) {
  return useQuery<RevenueByMethod[], NormalizedError>({
    queryKey: QUERY_KEYS.REVENUE_BY_METHOD('30d'),
    queryFn: mocked(mockRevenueByMethod),
    placeholderData: mockRevenueByMethod,
    ...options,
  });
}

export function useRevenueByPlan(options?: QueryOpts<RevenueByPlan[]>) {
  return useQuery<RevenueByPlan[], NormalizedError>({
    queryKey: QUERY_KEYS.REVENUE_BY_PLAN('30d'),
    queryFn: mocked(mockRevenueByPlan),
    placeholderData: mockRevenueByPlan,
    ...options,
  });
}

export function useRevenueDailyChart(days = 30, options?: QueryOpts<ChartPoint[]>) {
  return useQuery<ChartPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.REVENUE_DAILY_CHART(days),
    queryFn: mocked(mockRevenueDailyChart(days)),
    placeholderData: mockRevenueDailyChart(days),
    ...options,
  });
}

export function usePaymentDailySummary(
  days = 14,
  options?: QueryOpts<PaymentDailySummary[]>
) {
  return useQuery<PaymentDailySummary[], NormalizedError>({
    queryKey: QUERY_KEYS.PAYMENT_DAILY_SUMMARY(days),
    queryFn: mocked(mockPaymentDailySummary.slice(0, days)),
    placeholderData: mockPaymentDailySummary.slice(0, days),
    ...options,
  });
}

/* ----------- 매칭 운영 지표 ----------- */
export function useMatchingFunnel(options?: QueryOpts<MatchingFunnel>) {
  return useQuery<MatchingFunnel, NormalizedError>({
    queryKey: QUERY_KEYS.MATCHING_FUNNEL,
    queryFn: mocked(mockMatchingFunnel),
    placeholderData: mockMatchingFunnel,
    ...options,
  });
}

export function useMatchingDailyChart(days = 14, options?: QueryOpts<MatchingDailyPoint[]>) {
  return useQuery<MatchingDailyPoint[], NormalizedError>({
    queryKey: QUERY_KEYS.MATCHING_DAILY(days),
    queryFn: mocked(mockMatchingDailyChart(days)),
    placeholderData: mockMatchingDailyChart(days),
    ...options,
  });
}

export function useMatchingWeights(options?: QueryOpts<MatchingWeights>) {
  return useQuery<MatchingWeights, NormalizedError>({
    queryKey: QUERY_KEYS.MATCHING_WEIGHTS,
    queryFn: mocked(mockMatchingWeights),
    placeholderData: mockMatchingWeights,
    ...options,
  });
}

export function useUpdateMatchingWeightsMutation(
  options?: MutationOpts<MatchingWeights, UpdateMatchingWeightsRequest>
) {
  const qc = useQueryClient();
  return useMutation<MatchingWeights, NormalizedError, UpdateMatchingWeightsRequest>({
    ...options,
    mutationFn: (payload) => {
      Object.assign(mockMatchingWeights, payload, {
        updated_at: new Date().toISOString(),
        updated_by_admin_name: '관리자',
      });
      return Promise.resolve(mockMatchingWeights);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MATCHING_WEIGHTS });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 관리자 계정 관리 ----------- */
export function useAdmins(
  params?: AdminListParams,
  options?: QueryOpts<PageResponse<AdminAccount>>
) {
  return useQuery<PageResponse<AdminAccount>, NormalizedError>({
    queryKey: QUERY_KEYS.ADMINS(params),
    queryFn: mocked(mockAdminsPage),
    placeholderData: mockAdminsPage,
    ...options,
  });
}

export function useCreateAdminMutation(
  options?: MutationOpts<AdminAccount, CreateAdminRequest>
) {
  const qc = useQueryClient();
  return useMutation<AdminAccount, NormalizedError, CreateAdminRequest>({
    ...options,
    mutationFn: (payload) => {
      const next: AdminAccount = {
        id: Date.now(),
        uuid: `admin-${Date.now()}`,
        login_id: payload.login_id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        is_active: true,
        deactivated_at: null,
        deactivated_reason: null,
        last_login_at: null,
        last_login_ip: null,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
      };
      mockAdmins.unshift(next);
      return Promise.resolve(next);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['admins'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateAdminMutation(
  options?: MutationOpts<AdminAccount, { id: number; payload: UpdateAdminRequest }>
) {
  const qc = useQueryClient();
  return useMutation<AdminAccount, NormalizedError, { id: number; payload: UpdateAdminRequest }>({
    ...options,
    mutationFn: ({ id, payload }) => {
      const target = mockAdmins.find((a) => a.id === id)!;
      if (payload.name) target.name = payload.name;
      if (payload.email) target.email = payload.email;
      if (payload.phone) target.phone = payload.phone;
      if (payload.role) target.role = payload.role;
      if (payload.is_active !== undefined) {
        target.is_active = payload.is_active;
        if (!payload.is_active) {
          target.deactivated_at = new Date().toISOString();
          target.deactivated_reason = payload.deactivated_reason ?? null;
        } else {
          target.deactivated_at = null;
          target.deactivated_reason = null;
        }
      }
      target.update_time = new Date().toISOString();
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['admins'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 정책 (FAQ/약관) ----------- */
export function usePolicies(
  params?: PolicyListParams,
  options?: QueryOpts<PageResponse<PolicyDoc>>
) {
  return useQuery<PageResponse<PolicyDoc>, NormalizedError>({
    queryKey: QUERY_KEYS.POLICIES(params),
    queryFn: mocked(mockPoliciesPage),
    placeholderData: mockPoliciesPage,
    ...options,
  });
}

export function usePolicyDetail(uuid: string | undefined, options?: QueryOpts<PolicyDoc>) {
  const fallback = mockPolicies.find((p) => p.uuid === uuid) ?? mockPolicies[0];
  return useQuery<PolicyDoc, NormalizedError>({
    queryKey: QUERY_KEYS.POLICY_DETAIL(uuid ?? ''),
    queryFn: mocked(fallback),
    enabled: !!uuid,
    placeholderData: fallback,
    ...options,
  });
}

export function useCreatePolicyMutation(
  options?: MutationOpts<PolicyDoc, PolicyUpsertRequest>
) {
  const qc = useQueryClient();
  return useMutation<PolicyDoc, NormalizedError, PolicyUpsertRequest>({
    ...options,
    mutationFn: (payload) => {
      const now = new Date().toISOString();
      const next: PolicyDoc = {
        id: Date.now(),
        uuid: `pol-${Date.now()}`,
        policy_type: payload.policy_type,
        version: payload.version,
        title: payload.title,
        content: payload.content,
        summary: payload.summary ?? null,
        is_required: payload.is_required,
        effective_date: payload.effective_date,
        expires_at: payload.expires_at ?? null,
        is_active: payload.is_active ?? false,
        requires_reagreement: payload.requires_reagreement ?? false,
        create_time: now,
        update_time: now,
        create_user: 1,
        create_user_name: '관리자',
        update_user: 1,
        consent_count: 0,
      };
      mockPolicies.unshift(next);
      return Promise.resolve(next);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      options?.onSuccess?.(...args);
    },
  });
}

/** 정책 활성화/비활성화 단순 토글 */
export function useTogglePolicyActiveMutation(
  options?: MutationOpts<PolicyDoc, { uuid: string; is_active: boolean }>
) {
  const qc = useQueryClient();
  return useMutation<PolicyDoc, NormalizedError, { uuid: string; is_active: boolean }>({
    ...options,
    mutationFn: ({ uuid, is_active }) => {
      const target = mockPolicies.find((p) => p.uuid === uuid)!;
      target.is_active = is_active;
      target.update_time = new Date().toISOString();
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      options?.onSuccess?.(...args);
    },
  });
}

/**
 * 정책 활성화 (자동 스왑) — 대상 버전을 활성화하면서
 * 같은 policy_type 의 다른 활성 버전은 모두 자동 비활성화.
 * 한 시점에 같은 타입의 활성 버전이 유일하도록 보장.
 */
export function useActivatePolicyMutation(
  options?: MutationOpts<PolicyDoc, { uuid: string }>
) {
  const qc = useQueryClient();
  return useMutation<PolicyDoc, NormalizedError, { uuid: string }>({
    ...options,
    mutationFn: ({ uuid }) => {
      const target = mockPolicies.find((p) => p.uuid === uuid)!;
      const now = new Date().toISOString();
      mockPolicies.forEach((p) => {
        if (p.policy_type === target.policy_type && p.uuid !== uuid && p.is_active) {
          p.is_active = false;
          p.update_time = now;
        }
      });
      target.is_active = true;
      target.update_time = now;
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- FAQ (code_faq) ----------- */
import type {
  FaqItem,
  FaqListParams,
  FaqUpsertRequest,
} from '../types/faq';
import { mockFaqs, mockFaqsPage } from '../mocks/faqs';

export function useFaqs(
  params?: FaqListParams,
  options?: QueryOpts<PageResponse<FaqItem>>
) {
  return useQuery<PageResponse<FaqItem>, NormalizedError>({
    queryKey: QUERY_KEYS.FAQS(params),
    queryFn: mocked(mockFaqsPage),
    placeholderData: mockFaqsPage,
    ...options,
  });
}

export function useFaqDetail(id: number | undefined, options?: QueryOpts<FaqItem>) {
  const fallback = mockFaqs.find((f) => f.id === id) ?? mockFaqs[0];
  return useQuery<FaqItem, NormalizedError>({
    queryKey: QUERY_KEYS.FAQ_DETAIL(id ?? 0),
    queryFn: mocked(fallback),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useCreateFaqMutation(options?: MutationOpts<FaqItem, FaqUpsertRequest>) {
  const qc = useQueryClient();
  return useMutation<FaqItem, NormalizedError, FaqUpsertRequest>({
    ...options,
    mutationFn: (payload) => {
      const now = new Date().toISOString();
      const next: FaqItem = {
        id: Date.now(),
        category: payload.category,
        question: payload.question,
        answer: payload.answer,
        display_order: payload.display_order ?? 0,
        is_popular: payload.is_popular ?? false,
        is_active: payload.is_active ?? true,
        create_time: now,
        update_time: now,
      };
      mockFaqs.unshift(next);
      return Promise.resolve(next);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateFaqMutation(
  options?: MutationOpts<FaqItem, { id: number; payload: FaqUpsertRequest }>
) {
  const qc = useQueryClient();
  return useMutation<FaqItem, NormalizedError, { id: number; payload: FaqUpsertRequest }>({
    ...options,
    mutationFn: ({ id, payload }) => {
      const target = mockFaqs.find((f) => f.id === id)!;
      target.category = payload.category;
      target.question = payload.question;
      target.answer = payload.answer;
      if (payload.display_order !== undefined) target.display_order = payload.display_order;
      if (payload.is_popular !== undefined) target.is_popular = payload.is_popular;
      if (payload.is_active !== undefined) target.is_active = payload.is_active;
      target.update_time = new Date().toISOString();
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteFaqMutation(options?: MutationOpts<void, number>) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, number>({
    ...options,
    mutationFn: (id) => {
      const idx = mockFaqs.findIndex((f) => f.id === id);
      if (idx >= 0) mockFaqs.splice(idx, 1);
      return Promise.resolve();
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 시스템 메시지 ----------- */
export function useSystemMessages(
  params?: SystemMessageListParams,
  options?: QueryOpts<PageResponse<SystemMessageTemplate>>
) {
  return useQuery<PageResponse<SystemMessageTemplate>, NormalizedError>({
    queryKey: QUERY_KEYS.SYSTEM_MESSAGES(params),
    queryFn: mocked(mockSystemMessagesPage),
    placeholderData: mockSystemMessagesPage,
    ...options,
  });
}

export function useUpdateSystemMessageMutation(
  options?: MutationOpts<
    SystemMessageTemplate,
    { uuid: string; payload: SystemMessageUpsertRequest }
  >
) {
  const qc = useQueryClient();
  return useMutation<
    SystemMessageTemplate,
    NormalizedError,
    { uuid: string; payload: SystemMessageUpsertRequest }
  >({
    ...options,
    mutationFn: ({ uuid, payload }) => {
      const target = mockSystemMessages.find((m) => m.uuid === uuid)!;
      target.title = payload.title;
      target.body = payload.body;
      target.event_code = payload.event_code;
      if (payload.is_active !== undefined) target.is_active = payload.is_active;
      target.update_time = new Date().toISOString();
      target.update_user_name = '관리자';
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['system-messages'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useBroadcastSystemMessageMutation(
  options?: MutationOpts<{ sent: number }, SystemMessageBroadcastRequest>
) {
  return useMutation<{ sent: number }, NormalizedError, SystemMessageBroadcastRequest>({
    ...options,
    mutationFn: (payload) => Promise.resolve({ sent: payload.target === 'PREMIUM_CHATS' ? 482 : 2814 }),
  });
}
// suppress unused warning for AdminListParams (kept for API surface)
export type { AdminListParams };

/* ----------- 공지사항 (BE /v1/notices) ----------- */
import { noticesBeApi } from '../api/noticesBe';
import type {
  NoticeBe,
  NoticeBePage,
  NoticeBeListParams,
  NoticeBeUpsertRequest,
} from '../types/noticeBe';
import { mockNoticesBe, buildMockNoticesBePage } from '../mocks/noticesBe';

export function useAdminNotices(
  params?: NoticeBeListParams,
  options?: QueryOpts<NoticeBePage>
) {
  return useQuery<NoticeBePage, NormalizedError>({
    queryKey: QUERY_KEYS.NOTICES_BE(params),
    // BE 연결됨 (NoticeController GET /v1/notices). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    queryFn: isMockMode()
      ? mocked(buildMockNoticesBePage(params?.page ?? 0, params?.category))
      : () => noticesBeApi.list(params),
    placeholderData: buildMockNoticesBePage(params?.page ?? 0, params?.category),
    ...options,
  });
}

export function useAdminNoticeDetail(
  id: number | undefined,
  options?: QueryOpts<NoticeBe>
) {
  const fallback = mockNoticesBe.find((n) => n.id === id) ?? mockNoticesBe[0];
  return useQuery<NoticeBe, NormalizedError>({
    queryKey: QUERY_KEYS.NOTICE_BE_DETAIL(id ?? 0),
    // BE 연결됨 (NoticeController GET /v1/notices/{id}). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    queryFn: isMockMode() ? mocked(fallback) : () => noticesBeApi.detail(id!),
    enabled: id != null,
    // id 가 없을 땐 placeholderData 미제공 — 신규 등록 화면에 mock 첫번째 공지가
    // 흘러들어가 작성자/시각이 잘못 표시되는 문제 회피.
    placeholderData: id != null ? fallback : undefined,
    ...options,
  });
}

export function useCreateAdminNoticeMutation(
  options?: MutationOpts<NoticeBe, NoticeBeUpsertRequest>
) {
  const qc = useQueryClient();
  return useMutation<NoticeBe, NormalizedError, NoticeBeUpsertRequest>({
    ...options,
    // BE 연결됨 (AdminNoticeController POST /v1/admin/notice). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? (payload) => {
          const next: NoticeBe = {
            id: Date.now(),
            title: payload.title,
            author: '관리자',
            content: payload.content,
            category: payload.category,
            originalNoticeId: payload.originalNoticeId ?? null,
            createTime: new Date().toISOString().slice(0, 19),
            viewCount: 0,
            status: payload.status,
            scheduledAt: payload.status === 'SCHEDULED' ? payload.scheduledAt ?? null : null,
            publishedAt:
              payload.status === 'PUBLISHED'
                ? new Date().toISOString().slice(0, 19)
                : null,
          };
          mockNoticesBe.unshift(next);
          return Promise.resolve(next);
        }
      : (payload) => noticesBeApi.create(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateAdminNoticeMutation(
  options?: MutationOpts<NoticeBe, { id: number; payload: NoticeBeUpsertRequest }>
) {
  const qc = useQueryClient();
  return useMutation<NoticeBe, NormalizedError, { id: number; payload: NoticeBeUpsertRequest }>({
    ...options,
    // BE 연결됨 (AdminNoticeController PATCH /v1/admin/notice/{id}). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? ({ id, payload }) => {
          const target = mockNoticesBe.find((n) => n.id === id)!;
          target.title = payload.title;
          target.content = payload.content;
          target.category = payload.category;
          target.status = payload.status;
          target.scheduledAt =
            payload.status === 'SCHEDULED' ? payload.scheduledAt ?? null : null;
          if (payload.status === 'PUBLISHED' && !target.publishedAt) {
            target.publishedAt = new Date().toISOString().slice(0, 19);
          }
          if (payload.status === 'DRAFT') {
            target.publishedAt = null;
          }
          return Promise.resolve(target);
        }
      : ({ id, payload }) => noticesBeApi.update(id, payload),
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: ['notices-be'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTICE_BE_DETAIL(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteAdminNoticeMutation(options?: MutationOpts<void, number>) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedError, number>({
    ...options,
    // BE 연결됨 (AdminNoticeController DELETE /v1/admin/notice/{id}). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? (id) => {
          const idx = mockNoticesBe.findIndex((n) => n.id === id);
          if (idx >= 0) mockNoticesBe.splice(idx, 1);
          return Promise.resolve();
        }
      : (id) => noticesBeApi.remove(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['notices-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 밸런스 게임 (BE /v1/admin/bal-apply, /v1/admin/bal-game) ----------- */
import { balGamesBeApi } from '../api/balGamesBe';
import type {
  BalApplyBe,
  BalApplyBeListParams,
  BalApplyDecisionRequest,
  BalGameBe,
  BalGameBeSummary,
  BalGameBeListParams,
  BalGameCreateRequest,
  BalGameUpdateRequest,
} from '../types/balGameBe';
import {
  mockBalAppliesBe,
  mockBalGamesBe,
  buildMockBalApplyBePage,
  buildMockBalGameBePage,
} from '../mocks/balGamesBe';

interface PageOf<T> {
  content: T[];
  page?: number;
  number?: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** BE Spring Page 와 mock Page (page vs number) 차이 흡수 */
function normalizePage<T>(p: {
  content: T[];
  page?: number;
  number?: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}): PageOf<T> {
  return { ...p, page: p.page ?? p.number ?? 0 };
}

export function useBalAppliesBe(
  params?: BalApplyBeListParams,
  options?: QueryOpts<PageOf<BalApplyBe>>
) {
  const fallback = normalizePage(
    buildMockBalApplyBePage(params?.page ?? 0, params?.status)
  );
  return useQuery<PageOf<BalApplyBe>, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_APPLIES_BE(params),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : async () => {
          const r = await balGamesBeApi.listApplies(params);
          return normalizePage(r);
        },
    placeholderData: fallback,
    ...options,
  });
}

export function useDecideBalApplyMutation(
  options?: MutationOpts<BalGameBeSummary, { applyId: number; payload: BalApplyDecisionRequest }>
) {
  const qc = useQueryClient();
  return useMutation<
    BalGameBeSummary,
    NormalizedError,
    { applyId: number; payload: BalApplyDecisionRequest }
  >({
    ...options,
    // BE 연결됨 — 거절: PATCH /v1/admin/bal-apply/{id}/reject.
    // 승인 흐름은 mutation 호출 없이 ApplyQueue [승인 → 초안] 버튼이 /balance/new?fromApply=N 으로 이동,
    // Editor 의 [초안 저장] 등에서 POST /v1/admin/bal-game body 의 applyId 로 BE 가 APPROVED 처리.
    // VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? ({ applyId, payload }) => {
          const target = mockBalAppliesBe.find((a) => a.id === applyId)!;
          target.status = payload.status;
          target.adminMemo = payload.adminMemo ?? null;
          // 승인일 경우 DRAFT BalGame 생성 (mock)
          const summary: BalGameBeSummary = {
            id: Date.now(),
            optionA: target.optionA,
            optionADesc: null,
            optionB: target.optionB,
            optionBDesc: null,
            optionAEmoji: target.optionAEmoji,
            optionBEmoji: target.optionBEmoji,
            categoryCode: target.categoryCode,
            status: 'DRAFT',
            totalCount: 0,
            aCount: 0,
            bCount: 0,
            commentCount: 0,
            scheduledAt: null,
            applicantUserId: target.userId,
            applicantNickname: target.userNickname ?? null,
            createTime: new Date().toISOString().slice(0, 19),
          };
          return Promise.resolve(summary);
        }
      : async ({ applyId, payload }) => {
          // BE 모드에서는 거절만 mutation 으로 처리. 승인은 페이지 이동 + POST /v1/admin/bal-game 로 갈림.
          if (payload.status !== 'REJECTED') {
            throw new Error(
              '승인 흐름은 [승인 → 초안] 으로 Editor 에서 처리해주세요.'
            );
          }
          const rejected = await balGamesBeApi.rejectApply(
            applyId,
            payload.adminMemo
          );
          // mutation 시그니처(BalGameBeSummary) 호환을 위한 dummy. 호출부는 반환값을 사용하지 않음.
          return {
            id: 0,
            optionA: rejected.optionA,
            optionADesc: null,
            optionB: rejected.optionB,
            optionBDesc: null,
            optionAEmoji: rejected.optionAEmoji,
            optionBEmoji: rejected.optionBEmoji,
            categoryCode: rejected.categoryCode,
            status: 'DRAFT',
            totalCount: 0,
            aCount: 0,
            bCount: 0,
            commentCount: 0,
            scheduledAt: null,
            applicantUserId: null,
            applicantNickname: null,
            createTime: rejected.createTime,
          } satisfies BalGameBeSummary;
        },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-applies-be'] });
      qc.invalidateQueries({ queryKey: ['bal-games-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useBalApplyBeDetail(
  id: number | undefined,
  options?: QueryOpts<BalApplyBe>
) {
  const fallback = mockBalAppliesBe.find((a) => a.id === id) ?? mockBalAppliesBe[0];
  return useQuery<BalApplyBe, NormalizedError>({
    queryKey: ['bal-applies-be', 'detail', id],
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : async () => {
          // BE는 단건 신청 조회 endpoint 가 없음 — 목록에서 찾는 방식
          const list = await balGamesBeApi.listApplies({ size: 50 });
          const found = list.content.find((a) => a.id === id);
          if (!found) throw new Error('신청 정보를 찾을 수 없습니다.');
          return found;
        },
    enabled: id != null,
    // placeholderData 는 mock 모드에서만 의미 있음. BE 모드에서 mock fallback 을 placeholder 로
    // 흘려보내면 Editor 의 prefill ref 가드가 잘못된 mock 으로 즉시 trip 되어 BE 응답을 누락함.
    placeholderData: isMockMode() ? fallback : undefined,
    ...options,
  });
}

export function useBalGamesBe(
  params?: BalGameBeListParams,
  options?: QueryOpts<PageOf<BalGameBeSummary>>
) {
  const fallback = normalizePage(
    buildMockBalGameBePage(params?.page ?? 0, params?.categoryCode, params?.status)
  );
  return useQuery<PageOf<BalGameBeSummary>, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_GAMES_BE(params),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : async () => {
          const r = await balGamesBeApi.listGames(params);
          return normalizePage(r);
        },
    placeholderData: fallback,
    ...options,
  });
}

export function useBalGameBeDetail(
  gameId: number | undefined,
  options?: QueryOpts<BalGameBe>
) {
  // mock 분기에서는 voteStats 도 동적으로 생성해 단건 상세 화면이 자연스럽게 보이도록.
  // BE 분기는 BE 가 voteStats 를 포함해 내려보냄.
  const base = mockBalGamesBe.find((g) => g.id === gameId) ?? mockBalGamesBe[0];
  const fallback: BalGameBe =
    gameId != null ? { ...base, voteStats: buildMockVoteStats(base.id) } : base;
  return useQuery<BalGameBe, NormalizedError>({
    queryKey: QUERY_KEYS.BAL_GAME_BE_DETAIL(gameId ?? 0),
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : () => balGamesBeApi.gameDetail(gameId!),
    enabled: gameId != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useCreateBalGameBeMutation(
  options?: MutationOpts<BalGameBe, BalGameCreateRequest>
) {
  const qc = useQueryClient();
  return useMutation<BalGameBe, NormalizedError, BalGameCreateRequest>({
    ...options,
    // BE 연결됨 (AdminBalGameController POST /v1/admin/bal-game).
    // status 생략 시 DRAFT, SCHEDULED 면 scheduledAt 필수(미래·10분 단위), ARCHIVED 신규 거부.
    // VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? (payload) => {
          const next: BalGameBe = {
            id: Date.now(),
            optionA: payload.optionA,
            optionADesc: payload.optionADesc ?? null,
            optionAEmoji: payload.optionAEmoji ?? null,
            optionB: payload.optionB,
            optionBDesc: payload.optionBDesc ?? null,
            optionBEmoji: payload.optionBEmoji ?? null,
            description: payload.description ?? null,
            categoryCode: payload.categoryCode,
            status: payload.status ?? 'DRAFT',
            scheduledAt: payload.scheduledAt ?? null,
            scheduledEndAt: payload.scheduledEndAt ?? null,
            totalCount: 0,
            aCount: 0,
            bCount: 0,
            commentCount: 0,
            applicantUserId: null,
            applicantNickname: null,
            voteStats: null,
            createTime: new Date().toISOString().slice(0, 19),
            updateTime: new Date().toISOString().slice(0, 19),
          };
          mockBalGamesBe.unshift(next);
          return Promise.resolve(next);
        }
      : (payload) => balGamesBeApi.createGame(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['bal-games-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

// useBalGameCommentsBe / 댓글 액션 — 어드민 댓글 페이지
import {
  getMockBalComments,
  mockBalCommentsByGame,
} from '../mocks/balCommentsBe';
import type { BalCommentBe } from '../types/balCommentBe';

export function useBalGameCommentsBe(
  gameId: number | undefined,
  options?: QueryOpts<BalCommentBe[]>
) {
  const fallback = gameId != null ? getMockBalComments(gameId) : [];
  return useQuery<BalCommentBe[], NormalizedError>({
    queryKey: ['bal-comments-be', gameId],
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : () => balGamesBeApi.gameComments(gameId!),
    enabled: gameId != null,
    placeholderData: fallback,
    ...options,
  });
}

export function useHideBalCommentMutation(
  options?: MutationOpts<BalCommentBe, { gameId: number; commentId: number }>
) {
  const qc = useQueryClient();
  return useMutation<BalCommentBe, NormalizedError, { gameId: number; commentId: number }>({
    ...options,
    mutationFn: ({ gameId, commentId }) => {
      const list = mockBalCommentsByGame[gameId] ?? [];
      const target = list.find((c) => c.id === commentId);
      if (!target) throw new Error('댓글을 찾을 수 없습니다.');
      target.hidden = !target.hidden;
      if (!target.hidden) target.reportCount = 0;
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: ['bal-comments-be', vars.gameId] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateBalGameBeMutation(
  options?: MutationOpts<
    BalGameBe,
    { gameId: number; payload: BalGameUpdateRequest }
  >
) {
  const qc = useQueryClient();
  return useMutation<BalGameBe, NormalizedError, { gameId: number; payload: BalGameUpdateRequest }>({
    ...options,
    // mock 분기 (팀원 데모용) — VITE_USE_MOCK=true 면 mock, false 면 BE 호출.
    mutationFn: isMockMode()
      ? ({ gameId, payload }) => {
          const target = mockBalGamesBe.find((g) => g.id === gameId)!;
          if (payload.optionA !== undefined) target.optionA = payload.optionA;
          if (payload.optionB !== undefined) target.optionB = payload.optionB;
          if (payload.optionADesc !== undefined) target.optionADesc = payload.optionADesc ?? null;
          if (payload.optionBDesc !== undefined) target.optionBDesc = payload.optionBDesc ?? null;
          if (payload.optionAEmoji !== undefined) target.optionAEmoji = payload.optionAEmoji ?? null;
          if (payload.optionBEmoji !== undefined) target.optionBEmoji = payload.optionBEmoji ?? null;
          if (payload.description !== undefined) target.description = payload.description ?? null;
          if (payload.categoryCode !== undefined) target.categoryCode = payload.categoryCode;
          if (payload.status !== undefined) target.status = payload.status;
          if (payload.scheduledAt !== undefined) target.scheduledAt = payload.scheduledAt ?? null;
          if (payload.scheduledEndAt !== undefined) target.scheduledEndAt = payload.scheduledEndAt ?? null;
          target.updateTime = new Date().toISOString().slice(0, 19);
          return Promise.resolve(target);
        }
      : ({ gameId, payload }) => balGamesBeApi.updateGame(gameId, payload),
    onSuccess: (...args) => {
      const [, vars] = args;
      qc.invalidateQueries({ queryKey: ['bal-games-be'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BAL_GAME_BE_DETAIL(vars.gameId) });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 포스트잇 (BE /v1/admin/post-its, post_it DDL 정합) ----------- */
import { postItsBeApi } from '../api/postItsBe';
import type { PostItBe, PostItBeListParams } from '../types/postItBe';
import {
  mockPostItsBe,
  buildMockPostItBePage,
  type MockPostItPage,
} from '../mocks/postItsBe';

export function usePostItsBe(
  params?: PostItBeListParams,
  options?: QueryOpts<MockPostItPage>
) {
  const fallback = buildMockPostItBePage({
    page: params?.page,
    size: params?.size,
    keyword: params?.keyword,
    categoryCode: params?.categoryCode,
    isHidden: params?.isHidden,
    isDeleted: params?.isDeleted,
  });
  return useQuery<MockPostItPage, NormalizedError>({
    queryKey: QUERY_KEYS.POST_ITS_BE(params),
    // BE 연결됨 (AdminPostItController GET /v1/admin/post-its). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : async () => {
          const r = await postItsBeApi.list(params);
          return {
            content: r.content,
            page: r.number,
            size: r.size,
            totalElements: r.totalElements,
            totalPages: r.totalPages,
            last: r.last,
          };
        },
    placeholderData: fallback,
    ...options,
  });
}

export function useHidePostItBeMutation(
  options?: MutationOpts<PostItBe, { id: number; reason?: string }>
) {
  const qc = useQueryClient();
  return useMutation<PostItBe, NormalizedError, { id: number; reason?: string }>({
    ...options,
    // BE 연결됨 (AdminPostItController POST /v1/admin/post-its/{id}/hide). VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? ({ id }) => {
          const target = mockPostItsBe.find((p) => p.id === id)!;
          target.hidden = true;
          target.updateTime = new Date().toISOString().slice(0, 19);
          return Promise.resolve(target);
        }
      : ({ id, reason }) => postItsBeApi.hide(id, reason),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['post-its-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRestorePostItBeMutation(options?: MutationOpts<PostItBe, number>) {
  const qc = useQueryClient();
  return useMutation<PostItBe, NormalizedError, number>({
    ...options,
    // BE 연결됨 (AdminPostItController POST /v1/admin/post-its/{id}/restore — is_hidden=false + report_count=0 리셋).
    // VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    mutationFn: isMockMode()
      ? (id) => {
          const target = mockPostItsBe.find((p) => p.id === id)!;
          target.hidden = false;
          // DDL 주석: 숨김 해제 시 report_count 도 0 리셋
          target.reportCount = 0;
          target.updateTime = new Date().toISOString().slice(0, 19);
          return Promise.resolve(target);
        }
      : (id) => postItsBeApi.restore(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['post-its-be'] });
      options?.onSuccess?.(...args);
    },
  });
}

/* ----------- 어드민 — 한 게임의 개별 투표자 목록 ----------- */
import type {
  AdminBalVote,
  AdminBalVoteListParams,
} from '../types/balVoteBe';
import {
  buildMockBalVotePage,
  buildMockVoteStats,
  type MockBalVotePage,
} from '../mocks/balVotesBe';

export function useBalGameVotesBe(
  gameId: number | undefined,
  params?: AdminBalVoteListParams,
  options?: QueryOpts<MockBalVotePage>
) {
  const fallback =
    gameId != null
      ? buildMockBalVotePage(gameId, params)
      : {
          content: [] as AdminBalVote[],
          page: 0,
          size: params?.size ?? 50,
          totalElements: 0,
          totalPages: 1,
          last: true,
        };
  return useQuery<MockBalVotePage, NormalizedError>({
    queryKey: ['admin-bal-votes', gameId, params],
    // BE 연결됨 (AdminBalVoteController GET /v1/admin/bal-game/{gameId}/votes).
    // VITE_USE_MOCK=true 면 mock, false 면 실제 BE 호출.
    queryFn: isMockMode()
      ? mocked(fallback)
      : async () => {
          const r = await balGamesBeApi.gameVotes(gameId!, params);
          return {
            content: r.content,
            page: r.number,
            size: r.size,
            totalElements: r.totalElements,
            totalPages: r.totalPages,
            last: r.last,
          };
        },
    enabled: gameId != null,
    placeholderData: fallback,
    ...options,
  });
}

/* ----------- 푸시 발송 (push) ----------- */
import type {
  Push,
  PushListParams,
  PushUpsertRequest,
} from '../types/push';
import { mockPushes, mockPushesPage } from '../mocks/pushes';

export function usePushes(
  params?: PushListParams,
  options?: QueryOpts<PageResponse<Push>>
) {
  const filtered = mockPushes.filter((p) => {
    if (params?.status && params.status !== 'ALL' && p.status !== params.status) return false;
    if (params?.kind && p.kind !== params.kind) return false;
    return true;
  });
  const page: PageResponse<Push> = {
    ...mockPushesPage,
    content: filtered,
    totalElements: filtered.length,
  };
  return useQuery<PageResponse<Push>, NormalizedError>({
    queryKey: QUERY_KEYS.PUSHES(params),
    queryFn: mocked(page),
    placeholderData: page,
    ...options,
  });
}

export function usePushDetail(
  id: number | undefined,
  options?: QueryOpts<Push>
) {
  const fallback = mockPushes.find((p) => p.id === id) ?? mockPushes[0];
  return useQuery<Push, NormalizedError>({
    queryKey: QUERY_KEYS.PUSH_DETAIL(id ?? ''),
    queryFn: mocked(fallback),
    enabled: id != null,
    placeholderData: fallback,
    ...options,
  });
}

/** 생성. status=SENT 이면 즉시 발송으로 간주하여 sentAt/sentCount 즉시 채움. */
export function useCreatePushMutation(
  options?: MutationOpts<Push, PushUpsertRequest>
) {
  const qc = useQueryClient();
  return useMutation<Push, NormalizedError, PushUpsertRequest>({
    ...options,
    mutationFn: (payload) => {
      const now = new Date().toISOString();
      const targetCount = estimateTargetCount(payload.target);
      const status = payload.status;
      const next: Push = {
        id: Date.now(),
        title: payload.title,
        body: payload.body,
        deepLink: payload.deepLink ?? null,
        target: payload.target,
        segmentDesc: payload.segmentDesc ?? null,
        kind: payload.kind,
        linkedNoticeId: payload.linkedNoticeId ?? null,
        scheduledAt: payload.scheduledAt ?? null,
        sentAt: status === 'SENT' ? now : null,
        sentCount: status === 'SENT' ? targetCount : 0,
        targetCount,
        status,
        createTime: now,
        createdBy: '관리자',
      };
      mockPushes.unshift(next);
      return Promise.resolve(next);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['pushes'] });
      options?.onSuccess?.(...args);
    },
  });
}

/** 예약된 푸시를 즉시 발송 (SCHEDULED → SENT 강제 전환) */
export function useSendPushNowMutation(
  options?: MutationOpts<Push, { id: number }>
) {
  const qc = useQueryClient();
  return useMutation<Push, NormalizedError, { id: number }>({
    ...options,
    mutationFn: ({ id }) => {
      const target = mockPushes.find((p) => p.id === id)!;
      target.status = 'SENT';
      target.sentAt = new Date().toISOString();
      target.sentCount = target.targetCount;
      target.scheduledAt = null;
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['pushes'] });
      options?.onSuccess?.(...args);
    },
  });
}

/** 예약 취소 (SCHEDULED → CANCELED) */
export function useCancelPushMutation(
  options?: MutationOpts<Push, { id: number }>
) {
  const qc = useQueryClient();
  return useMutation<Push, NormalizedError, { id: number }>({
    ...options,
    mutationFn: ({ id }) => {
      const target = mockPushes.find((p) => p.id === id)!;
      target.status = 'CANCELED';
      return Promise.resolve(target);
    },
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['pushes'] });
      options?.onSuccess?.(...args);
    },
  });
}

function estimateTargetCount(target: Push['target']): number {
  switch (target) {
    case 'ALL': return 14_320;
    case 'IOS': return 8_120;
    case 'ANDROID': return 6_200;
    case 'PREMIUM': return 1_420;
    case 'SEGMENT': return 2_180;
    default: return 0;
  }
}
