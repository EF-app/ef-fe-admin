/**
 * 백엔드 /v1/notices API 클라이언트.
 * - 응답은 RspTemplate<T> = { code, message, data } 로 감싸져 있어 data 만 꺼내 반환한다.
 * - 인증 토큰은 client.ts 의 인터셉터가 자동으로 Authorization 헤더에 부착.
 */
import { getApiClient } from './client';
import type {
  NoticeBe,
  NoticeBePage,
  NoticeBeListParams,
  NoticeBeUpsertRequest,
} from '../types/noticeBe';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

const BASE = '/v1/notices';

export const noticesBeApi = {
  list: async (params?: NoticeBeListParams): Promise<NoticeBePage> => {
    const { data } = await getApiClient().get<RspTemplate<NoticeBePage>>(BASE, {
      params,
    });
    return data.data;
  },

  detail: async (id: number): Promise<NoticeBe> => {
    const { data } = await getApiClient().get<RspTemplate<NoticeBe>>(
      `${BASE}/${id}`
    );
    return data.data;
  },

  create: async (payload: NoticeBeUpsertRequest): Promise<NoticeBe> => {
    const { data } = await getApiClient().post<RspTemplate<NoticeBe>>(
      BASE,
      payload
    );
    return data.data;
  },

  update: async (
    id: number,
    payload: NoticeBeUpsertRequest
  ): Promise<NoticeBe> => {
    const { data } = await getApiClient().patch<RspTemplate<NoticeBe>>(
      `${BASE}/${id}`,
      payload
    );
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await getApiClient().delete(`${BASE}/${id}`);
  },
};
