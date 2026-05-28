import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import { suspensionLogsApi } from './suspensionLogs';
import type { PageResponse } from '../types/common';
import type {
  User,
  UserDetail,
  UserListParams,
  UserSuspension,
  SuspendUserRequest,
} from '../types/user';

/** 기존 SuspendUserRequest(ends_at 기반) → 새 BE CreateSuspensionRequest(duration_days 기반) 변환.
 *  ends_at - now 일수 round. WARNING/PERMANENT 면 undefined. */
function suspendRequestToCreateRequest(
  uuidOrId: string | number,
  payload: SuspendUserRequest,
) {
  let durationDays: number | undefined;
  if (payload.suspension_type === 'TEMPORARY' && payload.ends_at) {
    const diffMs = new Date(payload.ends_at).getTime() - Date.now();
    durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }
  return {
    target_user_id: typeof uuidOrId === 'number' ? uuidOrId : Number(uuidOrId),
    type: payload.suspension_type,
    reason: payload.reason,
    duration_days: durationDays,
  };
}

/** 기존 UserSuspension(snake_case) 출력을 BE SuspensionLog 응답에서 다시 빌드. */
export function suspensionLogToUserSuspension(
  log: Awaited<ReturnType<typeof suspensionLogsApi.create>>,
): UserSuspension {
  return {
    id: log.id,
    user_id: log.user_id,
    suspension_type: log.suspension_type,
    reason: log.reason,
    starts_at: log.starts_at,
    ends_at: log.ends_at,
    is_lifted: log.is_lifted,
    lifted_at: log.lifted_at,
    lifted_by_admin_id: log.lifted_by_admin_id,
    lifted_reason: log.lifted_reason,
    created_by_admin_id: log.created_by_admin_id,
    create_time: log.create_time,
    update_time: log.create_time,
  };
}

export const usersApi = {
  list: async (params?: UserListParams): Promise<PageResponse<User>> => {
    const { data } = await getApiClient().get<PageResponse<User>>(
      ADMIN_ENDPOINTS.USERS,
      { params }
    );
    return data;
  },

  detail: async (uuid: string | number): Promise<UserDetail> => {
    const { data } = await getApiClient().get<UserDetail>(
      ADMIN_ENDPOINTS.USER_DETAIL(uuid)
    );
    return data;
  },

  /**
   * 제재 부과 — BE AdminSuspensionController.POST /v1/admin/suspensions 위임.
   * 기존 호출처(ends_at 기반)는 그대로 두고 내부에서 duration_days 로 변환.
   * uuidOrId 는 user.id(Long). 화면이 UUID 문자열을 넘기는 경우 Number 변환.
   */
  suspend: async (
    uuidOrId: string | number,
    payload: SuspendUserRequest
  ): Promise<UserSuspension> => {
    const createReq = suspendRequestToCreateRequest(uuidOrId, payload);
    const log = await suspensionLogsApi.create(createReq);
    return suspensionLogToUserSuspension(log);
  },

  /**
   * 수동 해제 — BE AdminSuspensionController.PATCH /v1/admin/suspensions/{id}/lift 위임.
   * uuid 인자는 무시(BE 는 suspensionId 만 필요).
   */
  liftSuspension: async (
    _uuid: string | number,
    suspensionId: number,
    lifted_reason: string
  ): Promise<UserSuspension> => {
    const log = await suspensionLogsApi.lift(suspensionId, { lifted_reason });
    return suspensionLogToUserSuspension(log);
  },

  /**
   * 특정 유저 제재 이력 — BE GET /v1/admin/suspensions?userId={id} 위임 (전체 페이지 1회 호출).
   * uuid 가 string 이면 number 변환.
   */
  suspensions: async (uuidOrId: string | number): Promise<UserSuspension[]> => {
    const userId = typeof uuidOrId === 'number' ? uuidOrId : Number(uuidOrId);
    if (!Number.isFinite(userId)) return [];
    const page = await suspensionLogsApi.list({ user_id: userId, size: 100 });
    return page.content.map(suspensionLogToUserSuspension);
  },
};
