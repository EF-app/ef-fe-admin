/**
 * 백엔드 /v1/bal-apply, /v1/bal-game API 클라이언트.
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - 관리자용 BalGame CRUD endpoint 는 BE에 아직 별도 prefix가 없으므로 /v1/bal-game 으로 호출.
 *   BE에 admin 분리되면 그 경로로 교체하면 됨.
 */
import { getApiClient } from './client';
import type {
  BalApplyBe,
  BalApplyBeListParams,
  BalApplyDecisionRequest,
  BalGameBe,
  BalGameBeListParams,
  BalGameBeSummary,
  BalGameCreateRequest,
  BalGameUpdateRequest,
} from '../types/balGameBe';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface PageData<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const APPLY_BASE = '/v1/bal-apply';
const GAME_BASE = '/v1/bal-game';

export const balGamesBeApi = {
  // ----- 신청 -----
  listApplies: async (
    params?: BalApplyBeListParams
  ): Promise<PageData<BalApplyBe>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<BalApplyBe>>>(
      APPLY_BASE,
      { params }
    );
    return data.data;
  },

  decideApply: async (
    applyId: number,
    payload: BalApplyDecisionRequest
  ): Promise<BalGameBeSummary> => {
    const { data } = await getApiClient().patch<RspTemplate<BalGameBeSummary>>(
      `${APPLY_BASE}/${applyId}/decision`,
      payload
    );
    return data.data;
  },

  // ----- 게임 -----
  listGames: async (params?: BalGameBeListParams): Promise<PageData<BalGameBeSummary>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<BalGameBeSummary>>>(
      GAME_BASE,
      { params }
    );
    return data.data;
  },

  gameDetail: async (gameId: number): Promise<BalGameBe> => {
    const { data } = await getApiClient().get<RspTemplate<BalGameBe>>(
      `${GAME_BASE}/${gameId}`
    );
    return data.data;
  },

  createGame: async (payload: BalGameCreateRequest): Promise<BalGameBe> => {
    const { data } = await getApiClient().post<RspTemplate<BalGameBe>>(
      GAME_BASE,
      payload
    );
    return data.data;
  },

  updateGame: async (
    gameId: number,
    payload: BalGameUpdateRequest
  ): Promise<BalGameBe> => {
    const { data } = await getApiClient().patch<RspTemplate<BalGameBe>>(
      `${GAME_BASE}/${gameId}`,
      payload
    );
    return data.data;
  },
};
