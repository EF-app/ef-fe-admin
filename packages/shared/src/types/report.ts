import type { ReportTargetType, ReportStatus, SuspensionType } from '../constants/enums';

/**
 * 다형성 신고 (DDL `report` 정합).
 *
 * BE 컬럼:
 *   id, target_type, target_id, reporter_id, reason,
 *   status, admin_processed_by, admin_processed_at, resulted_suspension_id,
 *   create_user, create_time, update_user, update_time
 *
 * 어드민 응답 DTO 에서 표시용 denormalized 로 같이 내려준다고 가정 (선택 필드):
 *   reporter_nickname, target_preview, target_user_id, target_user_uuid,
 *   target_user_nickname, admin_processed_by_name
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
  resulted_suspension_id: number | null;

  /** 표시용 denormalized */
  target_preview?: string;
  target_user_id?: number;
  target_user_uuid?: string;
  target_user_nickname?: string;

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
