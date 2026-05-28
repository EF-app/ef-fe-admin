/**
 * 백엔드 어드민 차단 내역 API 클라이언트 (복수 — /v1/admin/blocks).
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - Spring Page<T> 를 PageResponse<BlockEntry> 로 매핑.
 *
 * BE 컨트롤러: AdminBlockController (GET /v1/admin/blocks)
 *   - keyword(차단자/피차단자 닉네임·UUID LIKE), page, size
 *
 * BE AdminBlockRspDto 의 필드명이 FE BlockEntry 와 1:1 이라 별도 필드 매핑 불필요.
 */
import { getApiClient } from './client';
import type { PageResponse } from '../types/common';
import type { BlockEntry, BlockListParams } from '../types/block';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const BASE = '/v1/admin/blocks';

export const blockBeApi = {
  getBlocks: async (params?: BlockListParams): Promise<PageResponse<BlockEntry>> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BlockEntry>>>(
      BASE,
      { params }
    );
    const page = data.data;
    return {
      content: page.content,
      page: page.number,
      size: page.size,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      hasNext: !page.last,
    };
  },
};
