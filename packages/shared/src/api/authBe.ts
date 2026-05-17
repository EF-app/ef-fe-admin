/**
 * 백엔드 /v1/admin/auth API 클라이언트.
 * - 응답은 RspTemplate<T> = { code, message, data } 로 감싸져 있어 .data 만 꺼낸다.
 * - 인증 토큰은 client.ts 의 인터셉터가 Authorization 헤더에 자동 부착.
 *
 * 기존 api/auth.ts (ADMIN_ENDPOINTS.LOGIN = /api/admin/auth/login) 는 그대로 두고,
 * 새 BE 흐름은 이 모듈을 통해 호출한다.
 */
import { getApiClient } from './client';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

export interface AdminLoginBeReqDto {
  loginId: string;
  password: string;
  /**
   * BE 의 LoginReqDto 가 일반 유저 로그인 DTO 를 재사용해 primitive boolean 으로 정의돼있어
   * null/undefined 면 Jackson 이 역직렬화 실패. 관리자는 단계 없으므로 항상 false 명시 전송.
   */
  scodeStep: boolean;
  /** 옵션 — 미전송 시 null 허용 (BE 측 reference 타입) */
  platform?: 'IOS' | 'ANDROID' | 'WEB' | 'UNKNOWN';
  deviceId?: string;
}

export interface AdminLoginBeRspDto {
  accessToken: string;
  refreshToken: string;
  loginId: string;
  name: string;
}

export interface AdminSummaryBeDto {
  loginId: string;
  name: string;
}

export interface AdminTokenBeRspDto {
  accessToken: string;
  refreshToken: string;
}

const BASE = '/v1/admin/auth';

export const authBeApi = {
  login: async (payload: AdminLoginBeReqDto): Promise<AdminLoginBeRspDto> => {
    const { data } = await getApiClient().post<RspTemplate<AdminLoginBeRspDto>>(
      `${BASE}/login`,
      payload
    );
    return data.data;
  },

  logout: async (): Promise<void> => {
    await getApiClient().post(`${BASE}/logout`);
  },

  me: async (): Promise<AdminSummaryBeDto> => {
    const { data } = await getApiClient().get<RspTemplate<AdminSummaryBeDto>>(
      `${BASE}/me`
    );
    return data.data;
  },

  refresh: async (refreshToken: string): Promise<AdminTokenBeRspDto> => {
    const { data } = await getApiClient().post<RspTemplate<AdminTokenBeRspDto>>(
      `${BASE}/token/refresh`,
      { refreshToken }
    );
    return data.data;
  },
};
