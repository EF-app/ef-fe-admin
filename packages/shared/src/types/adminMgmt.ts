/**
 * 관리자 계정 관리 (CRUD)
 * - admin.ts 의 AdminAccount 와 동일 모델 사용
 * - 여기에는 list/create/update 파라미터만 정의
 */
import type { AdminAccount } from './admin';
import type { AdminRole } from '../constants/enums';

export interface AdminListParams {
  keyword?: string;
  role?: AdminRole;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface CreateAdminRequest {
  login_id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  password: string;
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: AdminRole;
  is_active?: boolean;
  deactivated_reason?: string;
}

export type { AdminAccount };
