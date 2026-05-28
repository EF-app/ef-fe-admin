/**
 * 백엔드 어드민 제재 API 클라이언트 (/v1/admin/suspensions).
 * - BE 응답은 RspTemplate<T> 로 감싸져 있어 .data 까지 언랩.
 * - BE 는 camelCase, 화면은 snake_case → 이 모듈이 매핑 담당.
 *
 * BE 컨트롤러: AdminSuspensionController
 *   - GET    /v1/admin/suspensions          목록 (userId/userKeyword/type/isLifted/from/to + Page)
 *   - GET    /v1/admin/suspensions/{id}     단건 상세
 *   - POST   /v1/admin/suspensions          제재 부과 (body.targetUserId)
 *   - PATCH  /v1/admin/suspensions/{id}/lift 수동 해제
 */
import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  SuspensionLog,
  SuspensionLogListParams,
  SuspensionSourceTargetType,
  CreateSuspensionRequest,
  LiftSuspensionRequest,
} from '../types/suspensionLog';
import type { SuspensionType } from '../constants/enums';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/* ─────────── BE 원본(camelCase) 형태 ─────────── */

interface BeSuspensionLog {
  id: number;
  userId: number;
  userUuid: string | null;
  userLoginId: string | null;
  userNickname: string | null;
  suspensionType: SuspensionType;
  reason: string;
  startsAt: string;
  endsAt: string | null;
  sourceTargetType: SuspensionSourceTargetType | null;
  sourceTargetId: number | null;
  isLifted: boolean;
  liftedAt: string | null;
  liftedByAdminId: number | null;
  liftedByAdminName: string | null;
  liftedReason: string | null;
  active: boolean;
  createUser: number;
  createdByAdminName: string | null;
  createTime: string;
}

/* ─────────── camelCase → snake_case 매퍼 ─────────── */

function toSuspensionLog(be: BeSuspensionLog): SuspensionLog {
  return {
    id: be.id,
    user_id: be.userId,
    user_uuid: be.userUuid ?? undefined,
    user_login_id: be.userLoginId ?? undefined,
    user_nickname: be.userNickname ?? undefined,
    suspension_type: be.suspensionType,
    reason: be.reason,
    starts_at: be.startsAt,
    ends_at: be.endsAt,
    source_target_type: be.sourceTargetType,
    source_target_id: be.sourceTargetId,
    is_lifted: be.isLifted,
    lifted_at: be.liftedAt,
    lifted_by_admin_id: be.liftedByAdminId,
    lifted_by_admin_name: be.liftedByAdminName ?? undefined,
    lifted_reason: be.liftedReason,
    active: be.active,
    created_by_admin_id: be.createUser,
    created_by_admin_name: be.createdByAdminName ?? undefined,
    create_time: be.createTime,
  };
}

/* ─────────── FE → BE 파라미터/바디 매퍼 ─────────── */

function toListQuery(params?: SuspensionLogListParams): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  if (params.user_id != null) out.userId = params.user_id;
  if (params.user_keyword) out.userKeyword = params.user_keyword;
  if (params.suspension_type) out.type = params.suspension_type;
  if (params.is_lifted != null) out.isLifted = params.is_lifted;
  if (params.from) out.from = params.from;
  if (params.to) out.to = params.to;
  if (params.page != null) out.page = params.page;
  if (params.size != null) out.size = params.size;
  return out;
}

function toCreateBody(req: CreateSuspensionRequest) {
  return {
    targetUserId: req.target_user_id,
    type: req.type,
    reason: req.reason,
    durationDays: req.duration_days,
    sourceTargetType: req.source_target_type,
    sourceTargetId: req.source_target_id,
  };
}

function toLiftBody(req: LiftSuspensionRequest) {
  return { liftedReason: req.lifted_reason };
}

export const suspensionLogsApi = {
  list: async (
    params?: SuspensionLogListParams
  ): Promise<PageResponse<SuspensionLog>> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BeSuspensionLog>>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOGS,
      { params: toListQuery(params) }
    );
    const page = data.data;
    return {
      content: page.content.map(toSuspensionLog),
      page: page.number,
      size: page.size,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      hasNext: !page.last,
    };
  },

  detail: async (id: number): Promise<SuspensionLog> => {
    const { data } = await getApiClient().get<RspTemplate<BeSuspensionLog>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_DETAIL(id)
    );
    return toSuspensionLog(data.data);
  },

  create: async (req: CreateSuspensionRequest): Promise<SuspensionLog> => {
    const { data } = await getApiClient().post<RspTemplate<BeSuspensionLog>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_CREATE,
      toCreateBody(req)
    );
    return toSuspensionLog(data.data);
  },

  lift: async (id: number, payload: LiftSuspensionRequest): Promise<SuspensionLog> => {
    const { data } = await getApiClient().patch<RspTemplate<BeSuspensionLog>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_LIFT(id),
      toLiftBody(payload)
    );
    return toSuspensionLog(data.data);
  },

  liftAllForUser: async (
    userId: number,
    payload: LiftSuspensionRequest
  ): Promise<SuspensionLog[]> => {
    const { data } = await getApiClient().patch<RspTemplate<BeSuspensionLog[]>>(
      ADMIN_ENDPOINTS.SUSPENSION_LOG_LIFT_ALL_FOR_USER(userId),
      toLiftBody(payload)
    );
    return data.data.map(toSuspensionLog);
  },
};
