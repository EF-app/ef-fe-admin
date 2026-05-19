import type { ReportTargetType, ReportStatus, SuspensionType } from '../constants/enums';

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

  /** 이 신고로 이어진 제재 (대표 신고만 직접 보유) */
  suspension_id: number | null;
  /** cascade 신고에서도 화면 표시용으로 합성된 제재 id (자기 자신 = suspension_id) */
  effective_suspension_id?: number | null;
  /** 이 신고가 따라간 대표 신고 id (cascade 신고만 채워짐) */
  parent_report_id?: number | null;

  /** 표시용 denormalized — BE enrich 필드 */
  target_preview?: string;
  target_user_id?: number;
  target_user_nickname?: string;
  /** BAL_COMMENT 일 때 부모 밸런스게임 id — 댓글 페이지 점프용 */
  bal_game_id?: number;

  create_user?: number | null;
  create_time: string;
  update_user?: number | null;
  update_time: string;
}

export interface ReportListParams {
  status?: ReportStatus;
  target_type?: ReportTargetType;
  page?: number;
  size?: number;
}

export interface ProcessReportRequest {
  suspension_type: SuspensionType;
  reason: string;
  ends_at?: string | null;
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
  target_user_nickname?: string;
  target_preview?: string;
}

export interface ReportGroupListParams {
  status?: ReportStatus;
  target_type?: ReportTargetType;
  page?: number;
  size?: number;
}
