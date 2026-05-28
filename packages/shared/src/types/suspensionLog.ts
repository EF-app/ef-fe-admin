import type { SuspensionType } from '../constants/enums';

/** BE ReportTargetType enum 미러 — 제재 근거 신고 대상 타입. */
export type SuspensionSourceTargetType =
  | 'POST_IT'
  | 'BAL_COMMENT'
  | 'PROFILE'
  | 'CHAT'
  | 'CHAT_IMAGE';

/**
 * 제재 이력. BE AdminSuspensionRspDto 와 1:1 매핑(snake_case 변환).
 */
export interface SuspensionLog {
  id: number;
  user_id: number;
  /** BE 응답에 없으면 undefined. 화면에서 미사용 시 무시. */
  user_uuid?: string;
  user_login_id?: string;
  user_nickname?: string;
  suspension_type: SuspensionType;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  /** 제재 근거: 신고 그룹 (POST_IT/BAL_COMMENT/PROFILE/CHAT/CHAT_IMAGE) */
  source_target_type: SuspensionSourceTargetType | null;
  source_target_id: number | null;
  is_lifted: boolean;
  lifted_at: string | null;
  lifted_by_admin_id: number | null;
  /** BE 응답엔 없음 — 화면에서 조회 시 별도로 채움 */
  lifted_by_admin_name?: string;
  lifted_reason: string | null;
  /** 현재 활성 여부 (is_lifted=false AND (ends_at IS NULL OR ends_at > now)) */
  active: boolean;
  /** 부과 관리자 admin_account.id. 자동 에스컬레이션이면 0(시스템) */
  created_by_admin_id: number;
  /** BE 응답엔 없음 — 화면에서 조회 시 별도로 채움 */
  created_by_admin_name?: string;
  create_time: string;
}

/**
 * GET /v1/admin/suspensions 쿼리 파라미터.
 * BE 서명: userId / userKeyword / type / isLifted / from / to / page / size
 *
 * 화면(FE) 표기 (snake_case) → BE 변환은 suspensionLogs.ts list() 에서 처리.
 */
export interface SuspensionLogListParams {
  /** 닉네임/UUID LIKE (BE: userKeyword) */
  user_keyword?: string;
  /** 특정 유저 PK (BE: userId) */
  user_id?: number;
  /** BE: type */
  suspension_type?: SuspensionType;
  /** BE: isLifted */
  is_lifted?: boolean;
  /** ISO LocalDateTime (BE: from) */
  from?: string;
  /** ISO LocalDateTime (BE: to) */
  to?: string;
  page?: number;
  size?: number;
}

/**
 * POST /v1/admin/suspensions 요청 바디.
 *  - type=TEMPORARY 면 duration_days 필수
 *  - source_target_type / source_target_id 는 신고 그룹 기반일 때만
 */
export interface CreateSuspensionRequest {
  target_user_id: number;
  type: SuspensionType;
  reason: string;
  duration_days?: number;
  source_target_type?: SuspensionSourceTargetType;
  source_target_id?: number;
}

/** PATCH /v1/admin/suspensions/{id}/lift 요청 바디. */
export interface LiftSuspensionRequest {
  lifted_reason: string;
}
