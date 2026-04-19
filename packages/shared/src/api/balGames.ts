import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  BalGame,
  BalApply,
  BalGameListParams,
  BalApplyListParams,
  RejectBalApplyRequest,
  BalGameUpsertRequest,
  BalGameStats,
} from '../types/balGame';

export const balGamesApi = {
  listApplies: async (
    params?: BalApplyListParams
  ): Promise<PageResponse<BalApply>> => {
    const { data } = await getApiClient().get<PageResponse<BalApply>>(
      ADMIN_ENDPOINTS.BAL_APPLIES,
      { params }
    );
    return data;
  },

  approveApply: async (id: number): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_APPLY_APPROVE(id)
    );
    return data;
  },

  rejectApply: async (id: number, payload: RejectBalApplyRequest): Promise<BalApply> => {
    const { data } = await getApiClient().post<BalApply>(
      ADMIN_ENDPOINTS.BAL_APPLY_REJECT(id),
      payload
    );
    return data;
  },

  listGames: async (params?: BalGameListParams): Promise<PageResponse<BalGame>> => {
    const { data } = await getApiClient().get<PageResponse<BalGame>>(
      ADMIN_ENDPOINTS.BAL_GAMES,
      { params }
    );
    return data;
  },

  getGame: async (uuid: string): Promise<BalGame> => {
    const { data } = await getApiClient().get<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_DETAIL(uuid)
    );
    return data;
  },

  createGame: async (payload: BalGameUpsertRequest): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAMES,
      payload
    );
    return data;
  },

  updateGame: async (uuid: string, payload: BalGameUpsertRequest): Promise<BalGame> => {
    const { data } = await getApiClient().put<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_DETAIL(uuid),
      payload
    );
    return data;
  },

  hideGame: async (uuid: string): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_HIDE(uuid)
    );
    return data;
  },

  publishGame: async (uuid: string): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_PUBLISH(uuid)
    );
    return data;
  },

  scheduleGame: async (uuid: string, scheduled_at: string): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_SCHEDULE(uuid),
      { scheduled_at }
    );
    return data;
  },

  archiveGame: async (uuid: string): Promise<BalGame> => {
    const { data } = await getApiClient().post<BalGame>(
      ADMIN_ENDPOINTS.BAL_GAME_ARCHIVE(uuid)
    );
    return data;
  },

  getStats: async (): Promise<BalGameStats> => {
    const { data } = await getApiClient().get<BalGameStats>(
      ADMIN_ENDPOINTS.BAL_GAME_STATS
    );
    return data;
  },
};
