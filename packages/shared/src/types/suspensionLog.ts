import type { SuspensionType } from '../constants/enums';

export interface SuspensionLog {
  id: number;
  user_id: number;
  user_uuid?: string;
  user_nickname?: string;
  suspension_type: SuspensionType;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  is_lifted: boolean;
  lifted_at: string | null;
  lifted_by_admin_id: number | null;
  lifted_by_admin_name?: string;
  lifted_reason: string | null;
  created_by_admin_id: number;
  created_by_admin_name?: string;
  create_time: string;
  update_time: string;
}

export interface SuspensionLogListParams {
  user_keyword?: string;
  suspension_type?: SuspensionType;
  is_lifted?: boolean;
  page?: number;
  size?: number;
}

export interface LiftSuspensionRequest {
  lifted_reason: string;
}
