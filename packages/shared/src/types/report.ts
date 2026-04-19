import type { ReportTargetType, ReportStatus, SuspensionType } from '../constants/enums';

export interface Report {
  id: number;
  target_type: ReportTargetType;
  target_uuid: string;
  reporter_id: number | null;
  reporter_nickname?: string;
  reason: string | null;
  status: ReportStatus;
  admin_processed_by: number | null;
  admin_processed_at: string | null;
  resulted_suspension_id: number | null;
  target_preview?: string;
  target_user_id?: number;
  target_user_nickname?: string;
  create_time: string;
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
