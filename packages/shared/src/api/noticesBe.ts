/**
 * 백엔드 공지 API 클라이언트.
 * - 응답은 RspTemplate<T> = { code, message, data } 로 감싸져 있어 data 만 꺼내 반환한다.
 * - 인증 토큰은 client.ts 의 인터셉터가 자동으로 Authorization 헤더에 부착.
 *
 * BE 컨트롤러가 둘로 분리되어 있음:
 *   - NoticeController       (/v1/notices)     : 목록 GET, 상세 GET  (유저+관리자 공용 조회)
 *   - AdminNoticeController  (/v1/admin/notices): POST 생성 / PATCH 수정 / DELETE 삭제
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

const BASE_PUBLIC = '/v1/notices';
const BASE_ADMIN = '/v1/admin/notices';

export const noticesBeApi = {
  list: async (params?: NoticeBeListParams): Promise<NoticeBePage> => {
    const { data } = await getApiClient().get<RspTemplate<NoticeBePage>>(
      BASE_PUBLIC,
      { params }
    );
    return data.data;
  },

  detail: async (id: number): Promise<NoticeBe> => {
    const { data } = await getApiClient().get<RspTemplate<NoticeBe>>(
      `${BASE_PUBLIC}/${id}`
    );
    return data.data;
  },

  create: async (payload: NoticeBeUpsertRequest): Promise<NoticeBe> => {
    const { data } = await getApiClient().post<RspTemplate<NoticeBe>>(
      BASE_ADMIN,
      payload
    );
    return data.data;
  },

  update: async (
    id: number,
    payload: NoticeBeUpsertRequest
  ): Promise<NoticeBe> => {
    const { data } = await getApiClient().patch<RspTemplate<NoticeBe>>(
      `${BASE_ADMIN}/${id}`,
      payload
    );
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await getApiClient().delete(`${BASE_ADMIN}/${id}`);
  },
};
