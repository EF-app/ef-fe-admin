/**
 * 백엔드 admin 일일 피드 API 클라이언트.
 * BE: AdminMatchController.getDailyFeed — GET /v1/admin/matches/daily-feed
 *
 *  BE 응답 = RspTemplate<AdminDailyFeedPageRspDto>.
 *  AdminDailyFeedPageRspDto = { content, page, size, hasNext } (COUNT 미제공).
 */
import { getApiClient } from './client';
import type {
  DailyFeedListParams,
  DailyFeedPage,
} from '../types/matchDailyFeed';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

const BASE = '/v1/admin/matches/daily-feed';

export const matchDailyFeedBeApi = {
  list: async (params?: DailyFeedListParams): Promise<DailyFeedPage> => {
    const { data } = await getApiClient().get<RspTemplate<DailyFeedPage>>(BASE, {
      params: {
        viewerIdFrom: params?.viewerIdFrom,
        viewerIdTo: params?.viewerIdTo,
        targetId: params?.targetId,
        feedDate: params?.feedDate,
        slotType: params?.slotType,
        rank: params?.rank,
        page: params?.page,
        size: params?.size,
      },
    });
    return data.data;
  },
};
