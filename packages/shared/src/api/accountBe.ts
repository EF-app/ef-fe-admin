/**
 * 백엔드 어드민 계정 관리 API 클라이언트 (/v1/admin/account).
 * - 시스템 > 관리자계정 화면 전용. /v1/admin/auth (인증) 와는 별도.
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - BE 는 camelCase, 화면(AdminAccount 타입)은 레거시 snake_case → 이 모듈이 매핑.
 * - BE 응답에는 uuid / role / phone / deactivated_* 가 없음 → mock 호환을 위해 안전한 기본값으로 채운다.
 *
 * BE 컨트롤러: AdminAccountController
 *   - GET    /v1/admin/account              목록 (keyword/isActive)
 *   - GET    /v1/admin/account/{id}         단건 상세
 *   - POST   /v1/admin/account              생성 (loginId/password/name/email)
 *   - PATCH  /v1/admin/account/{id}         수정 (email/isActive)
 *   - PATCH  /v1/admin/account/{id}/password 비밀번호 강제 변경
 *   - PATCH  /v1/admin/account/{id}/unlock  잠금 해제
 */
import { getApiClient } from './client';
import type { PageResponse } from '../types/common';
import type { AdminAccount } from '../types/admin';
import type {
  AdminListParams,
  CreateAdminRequest,
  UpdateAdminRequest,
} from '../types/adminMgmt';
import { ADMIN_ROLE } from '../constants/enums';

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

// BE AdminAccountRspDto (camelCase) — BE 응답에 uuid/role/phone/deactivated_* 없음.
// 주의: BE 의 `private boolean isActive` 가 Jackson 기본 룰로 `active` 키로 직렬화되는 경우가 있어
// active/isActive 둘 다 옵션으로 두고 toAdminAccount 에서 수용.
interface BeAdminAccount {
  id: number;
  loginId: string;
  name: string;
  email: string | null;
  isActive?: boolean;
  active?: boolean;
  lockedUntil?: string | null;
  recentPasswordFailureCount?: number;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createTime: string;
  updateTime: string;
}

// 다른 관리자 비번 강제 변경 (현재 비번 확인 없음)
export interface AdminPasswordResetRequest {
  new_password: string;
}

const BASE = '/v1/admin/account';

function toAdminAccount(be: BeAdminAccount): AdminAccount {
  return {
    id: be.id,
    // BE 미보유 필드 — mock 호환을 위해 기본값 채움 (uuid/phone/role/deactivated_*)
    uuid: `admin-${be.id}`,
    login_id: be.loginId,
    name: be.name,
    email: be.email ?? '',
    phone: '',
    role: ADMIN_ROLE.ADMIN,
    is_active: be.isActive ?? be.active ?? false,
    locked_until: be.lockedUntil ?? null,
    recent_password_failure_count: be.recentPasswordFailureCount ?? 0,
    deactivated_at: null,
    deactivated_reason: null,
    last_login_at: be.lastLoginAt,
    last_login_ip: be.lastLoginIp,
    create_time: be.createTime,
    update_time: be.updateTime,
  };
}

export const accountBeApi = {
  list: async (params?: AdminListParams): Promise<PageResponse<AdminAccount>> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BeAdminAccount>>>(
      BASE,
      {
        params: {
          keyword: params?.keyword,
          isActive: params?.is_active,
          page: params?.page,
          size: params?.size,
        },
      }
    );
    const page = data.data;
    return {
      content: page.content.map(toAdminAccount),
      page: page.number,
      size: page.size,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      hasNext: !page.last,
    };
  },

  detail: async (id: number): Promise<AdminAccount> => {
    const { data } = await getApiClient().get<RspTemplate<BeAdminAccount>>(
      `${BASE}/${id}`
    );
    return toAdminAccount(data.data);
  },

  create: async (payload: CreateAdminRequest): Promise<AdminAccount> => {
    // BE create DTO: loginId / password / name / email 만 받음. phone/role 은 mock 호환용으로 타입엔 있지만 송신 안 함.
    const { data } = await getApiClient().post<RspTemplate<BeAdminAccount>>(BASE, {
      loginId: payload.login_id,
      password: payload.password,
      name: payload.name,
      email: payload.email,
    });
    return toAdminAccount(data.data);
  },

  update: async (id: number, payload: UpdateAdminRequest): Promise<AdminAccount> => {
    // BE update DTO: email / isActive 만 받음. loginId/name/phone/role 변경 불가.
    const { data } = await getApiClient().patch<RspTemplate<BeAdminAccount>>(
      `${BASE}/${id}`,
      {
        email: payload.email,
        isActive: payload.is_active,
      }
    );
    return toAdminAccount(data.data);
  },

  // 다른 관리자 비번 강제 변경 — 현재 비번 확인 없이 즉시 교체
  forceChangePassword: async (
    id: number,
    payload: AdminPasswordResetRequest
  ): Promise<void> => {
    await getApiClient().patch<RspTemplate<void>>(`${BASE}/${id}/password`, {
      newPassword: payload.new_password,
    });
  },

  // 잠금 해제 — lockedUntil 을 null 로 초기화
  unlock: async (id: number): Promise<AdminAccount> => {
    const { data } = await getApiClient().patch<RspTemplate<BeAdminAccount>>(
      `${BASE}/${id}/unlock`
    );
    return toAdminAccount(data.data);
  },
};
