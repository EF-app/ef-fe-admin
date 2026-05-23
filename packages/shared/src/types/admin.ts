import type {
  AdminRole,
  AdminLoginSource,
  LoginFailureReason,
  AuditAction,
} from '../constants/enums';

export interface AdminAccount {
  id: number;
  uuid: string;
  login_id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  is_active: boolean;
  /** 비밀번호 실패 누적으로 잠긴 시각 — null 또는 미래 시각 아님 = 잠금 아님 */
  locked_until?: string | null;
  deactivated_at: string | null;
  deactivated_reason: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  create_time: string;
  update_time: string;
}

export interface AdminLoginLog {
  id: number;
  admin_id: number | null;
  login_id_attempt: string;
  login_at: string;
  ip_address: string;
  user_agent: string | null;
  source: AdminLoginSource;
  is_success: boolean;
  failure_reason: LoginFailureReason | null;
  failure_detail: string | null;
  totp_verified: boolean | null;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name?: string;
  action: AuditAction | string;
  target_type: string;
  target_id: number;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string | null;
  create_time: string;
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminAccount;
  expires_in: number;
}
