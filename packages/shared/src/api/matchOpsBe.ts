/**
 * 백엔드 admin 매칭 운영 도구 API 클라이언트.
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - BE 와 FE 의 필드명 동일 (camelCase) — 매핑 없음.
 *
 * BE 컨트롤러: AdminMatchController
 *   - POST /v1/admin/matches/batch/user/{userId}    특정 유저 강제 재계산 (어뷰즈 가드 우회)
 *   - POST /v1/admin/matches/batch/recover          보정 배치 강제 실행 (ShedLock 우회)
 *   - POST /v1/admin/matches/batch/full             전체 정상 배치 강제 실행 (ShedLock 우회)
 */
import { getApiClient } from './client';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

/** AdminMatchUserBatchRspDto 와 1:1 */
export interface MatchUserBatchResult {
  userId: number;
  cardCount: number;
  durationMs: number;
}

/** AdminMatchRecoverBatchRspDto 와 1:1 */
export interface MatchRecoverBatchResult {
  targetCount: number;
  recoverCount: number;
  coldStartCount: number;
  failCount: number;
  durationMs: number;
}

/** AdminMatchFullBatchRspDto 와 1:1 — 04:00 정상 배치와 동일 흐름 결과 */
export interface MatchFullBatchResult {
  totalViewers: number;
  successCount: number;
  failCount: number;
  durationMs: number;
}

export const matchOpsBeApi = {
  runUserBatch: async (userId: number): Promise<MatchUserBatchResult> => {
    const { data } = await getApiClient().post<RspTemplate<MatchUserBatchResult>>(
      `/v1/admin/matches/batch/user/${userId}`,
    );
    return data.data;
  },

  runRecoverBatch: async (): Promise<MatchRecoverBatchResult> => {
    // 보정 배치 — 누락 viewer 만 처리이지만 활성 viewer 수에 따라 수분 걸릴 수 있어 10분 timeout.
    const { data } = await getApiClient().post<RspTemplate<MatchRecoverBatchResult>>(
      '/v1/admin/matches/batch/recover',
      null,
      { timeout: 10 * 60 * 1000 },
    );
    return data.data;
  },

  runFullBatch: async (): Promise<MatchFullBatchResult> => {
    // 전체 정상 배치 — 활성 viewer 전체 (예: 7875명 × 평균 100ms ≈ 13분) 처리 가능. 30분 timeout.
    const { data } = await getApiClient().post<RspTemplate<MatchFullBatchResult>>(
      '/v1/admin/matches/batch/full',
      null,
      { timeout: 30 * 60 * 1000 },
    );
    return data.data;
  },
};
