import type { ReportTargetType, ReportStatus } from '../constants/enums';

/**
 * 다형성 신고 (DDL `report` 정합).
 *
 * BE 컬럼 (DDL):
 *   id, target_type, target_id, reporter_id, reason,
 *   status, admin_processed_by, admin_processed_at,
 *   suspension_id, parent_report_id,
 *   create_user, create_time, update_user, update_time
 *
 * BE 어드민 DTO (AdminReportDetailRspDto) 가 추가로 합성해 내려주는 값:
 *   - effective_suspension_id : cascade 신고에서 parent 의 suspension_id 합성값
 *   - parent_report_id        : 대표 신고 id (cascade 신고만 채워짐)
 *
 * 어드민 응답 DTO 가 추가로 내려주는 enrich 필드 (모두 옵션, 그룹화 응답에서만 채워짐):
 *   reporter_nickname, target_preview,
 *   target_user_id, target_user_nickname,
 *   admin_processed_by_name,
 *   bal_game_id (BAL_COMMENT 일 때 부모 밸런스게임 id)
 *
 * ※ 어드민은 외부에 노출되지 않는 "뒷단" 도구라 uuid 를 쓰지 않고
 *   모든 도메인을 BIGINT id 로 직접 다룬다 (post_it.id, bal_game_comment.id, users.id 등).
 */
export interface Report {
  id: number;
  target_type: ReportTargetType;
  /** 신고 대상 PK (target_type 별 다른 테이블 참조) */
  target_id: number;

  reporter_id: number | null;
  reporter_nickname?: string;
  reason: string | null;
  status: ReportStatus;

  admin_processed_by: number | null;
  admin_processed_by_name?: string;
  admin_processed_at: string | null;

  /** 이 신고로 이어진 제재 user_suspension.id. 같은 그룹의 모든 PROCESSED 신고에 동일 id (평탄화) */
  suspension_id: number | null;

  /** 표시용 denormalized — BE enrich 필드 */
  target_preview?: string;
  target_user_id?: number;
  /** target user 의 외부 식별자 — admin FE 가 /users/{uuid} navigate 용 */
  target_user_uuid?: string | null;
  target_user_login_id?: string;
  target_user_nickname?: string;
  /** BAL_COMMENT 일 때 부모 밸런스게임 id — admin FE 가 /balance/{id}/comments navigate 용 */
  bal_game_id?: number;

  create_user?: number | null;
  create_time: string;
  update_user?: number | null;
  update_time: string;
}

/**
 * 신고 처리 요청.
 * 제재 부과는 별도 API (POST /v1/admin/suspensions) 로 먼저 처리 후, 받은 id 를 여기 전달.
 * suspension_id 가 null/생략이면 "신고 내용 인정하지만 제재 미부과" 로 처리.
 */
export interface ProcessReportRequest {
  suspension_id?: number | null;
}

/**
 * 같은 (target_type, target_id) 로 묶인 신고 그룹.
 * BE `AdminReportGroupRspDto` 정합.
 * - reports: 시간 ASC. 첫 항목이 BE 의 "자동 첫 신고 대표" 후보.
 * - target_user_* / target_preview: BE 가 denormalized 로 추가 내려주면 표시용. 옵션.
 */
export interface ReportGroup {
  target_type: ReportTargetType;
  target_id: number;
  total_count: number;
  pending_count: number;
  first_reported_at: string;
  last_reported_at: string;
  reports: Report[];

  target_user_id?: number;
  target_user_uuid?: string | null;
  target_user_login_id?: string;
  target_user_nickname?: string;
  target_preview?: string;
}

export type ReportGroupSort = 'OLDEST' | 'MOST_REPORTED';

export interface ReportGroupListParams {
  status?: ReportStatus;
  target_type?: ReportTargetType;
  /** OLDEST (기본, 첫 신고 오래된 순) / MOST_REPORTED (신고 건수 많은 순, 동률이면 오래된 순) */
  sort?: ReportGroupSort;
  page?: number;
  size?: number;
}
