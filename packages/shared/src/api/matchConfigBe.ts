/**
 * 백엔드 admin 매칭 설정값 API 클라이언트.
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - BE 와 FE 의 필드명이 동일 (camelCase) — 매핑 없음.
 *
 * BE 컨트롤러: AdminMatchController
 *   - GET   /v1/admin/matches/config
 *   - PATCH /v1/admin/matches/config   body: { entries: [{configKey, configValue}, ...] }
 */
import { getApiClient } from './client';
import type {
  MatchConfigItem,
  MatchConfigUpdateRequest,
} from '../types/matchingMetrics';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

const BASE = '/v1/admin/matches/config';

export const matchConfigBeApi = {
  getAll: async (): Promise<MatchConfigItem[]> => {
    const { data } = await getApiClient().get<RspTemplate<MatchConfigItem[]>>(BASE);
    return data.data;
  },

  update: async (payload: MatchConfigUpdateRequest): Promise<MatchConfigItem[]> => {
    const { data } = await getApiClient().patch<RspTemplate<MatchConfigItem[]>>(
      BASE,
      payload,
    );
    return data.data;
  },
};
