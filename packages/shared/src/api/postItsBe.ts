/**
 * 백엔드 어드민 포스트잇 API 클라이언트.
 * - 응답은 RspTemplate<T> = { code, message, data } 로 감싸져 있어 .data 만 꺼낸다.
 * - Spring Page<T> = { content, number, size, totalElements, totalPages, last } 모양 그대로 반환.
 *
 * BE 컨트롤러: AdminPostItController (/v1/admin/post-its)
 *   - GET                       : 목록 (keyword, categoryCode, isHidden, isDeleted, userId, page, size)
 *   - GET    /{uuid}            : 단건 상세 (관리자도 uuid 정책 통일)
 *   - POST   /{uuid}/hide       : 숨김 (body: { reason?: string })
 *   - POST   /{uuid}/restore    : 숨김 해제 + report_count = 0 리셋
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

/**
 * BE AdminPostItRspDto 는 `anonymous`/`hidden`/`deleted` 키로 내려옴 (BE 가 일관성 맞춤).
 * 안전망 — BE 가 향후 `isAnonymous` 류로 다시 바꾸거나 다른 패턴을 섞어도 양쪽 키 모두 수용.
 */
function toPostItBe(raw: Record<string, unknown>): PostItBe {
  const pick = <T>(...keys: string[]): T | undefined => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined) return v as T;
    }
    return undefined;
  };
  return {
    id: raw.id as number,
    userId: raw.userId as number,
    userUuid: raw.userUuid as string,
    userNickname: raw.userNickname as string,
    userAge: (raw.userAge as number | null | undefined) ?? null,
    userArea: (raw.userArea as string | null | undefined) ?? null,
    categoryCode: raw.categoryCode as PostItBe['categoryCode'],
    content: raw.content as string,
    color: raw.color as PostItBe['color'],
    anonymous: pick<boolean>('anonymous', 'isAnonymous') ?? false,
    expiresAt: raw.expiresAt as string,
    pinnedUntil: (raw.pinnedUntil as string | null | undefined) ?? null,
    reportCount: (raw.reportCount as number | undefined) ?? 0,
    replyCount: (raw.replyCount as number | undefined) ?? 0,
    likeCount: (raw.likeCount as number | undefined) ?? 0,
    hidden: pick<boolean>('hidden', 'isHidden') ?? false,
    deleted: pick<boolean>('deleted', 'isDeleted') ?? false,
    createTime: raw.createTime as string,
    updateTime: raw.updateTime as string,
  };
}

export const postItsBeApi = {
  list: async (params?: PostItBeListParams): Promise<PageData<PostItBe>> => {
    const { data } = await getApiClient().get<
      RspTemplate<PageData<Record<string, unknown>>>
    >(BASE, { params });
    return { ...data.data, content: data.data.content.map(toPostItBe) };
  },
  detail: async (id: number): Promise<PostItBe> => {
    const { data } = await getApiClient().get<RspTemplate<Record<string, unknown>>>(
      `${BASE}/${id}`
    );
    return toPostItBe(data.data);
  },
  hide: async (id: number, reason?: string): Promise<PostItBe> => {
    const { data } = await getApiClient().post<RspTemplate<Record<string, unknown>>>(
      `${BASE}/${id}/hide`,
      { reason }
    );
    return toPostItBe(data.data);
  },
  restore: async (id: number): Promise<PostItBe> => {
    const { data } = await getApiClient().post<RspTemplate<Record<string, unknown>>>(
      `${BASE}/${id}/restore`
    );
    return toPostItBe(data.data);
  },
};
