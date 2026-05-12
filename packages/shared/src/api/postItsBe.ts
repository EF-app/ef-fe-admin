/**
 * /v1/admin/post-its 관리자 API (BE 구현 시 사용).
 * 현재 BE 컨트롤러는 일반 유저용만 존재 — 관리자용 엔드포인트는 추후 추가.
 * RspTemplate<T> 언랩.
 */
import { getApiClient } from './client';
import type { PostItBe, PostItBeListParams } from '../types/postItBe';

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

const BASE = '/v1/admin/post-its';

export const postItsBeApi = {
  list: async (params?: PostItBeListParams): Promise<PageData<PostItBe>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<PostItBe>>>(BASE, {
      params,
    });
    return data.data;
  },
  detail: async (uuid: string): Promise<PostItBe> => {
    const { data } = await getApiClient().get<RspTemplate<PostItBe>>(`${BASE}/${uuid}`);
    return data.data;
  },
  hide: async (uuid: string, reason?: string): Promise<PostItBe> => {
    const { data } = await getApiClient().post<RspTemplate<PostItBe>>(
      `${BASE}/${uuid}/hide`,
      { reason }
    );
    return data.data;
  },
  restore: async (uuid: string): Promise<PostItBe> => {
    const { data } = await getApiClient().post<RspTemplate<PostItBe>>(
      `${BASE}/${uuid}/restore`
    );
    return data.data;
  },
};
