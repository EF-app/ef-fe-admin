/**
 * 백엔드 (EF-BE) 의 NoticeReqDto / NoticeDetailRspDto / NoticeSummaryRspDto / NoticePageRspDto 와
 * 1:1 매핑되는 신규 타입.
 *
 * 기존 types/notice.ts (NOTICE_TARGET_TYPE, NoticeStatus 'SENT'/'CANCELED', sent_count 등)은 별개로 유지.
 * 신규 BE 스키마는 여기 모듈만 사용한다.
 */

export type NoticeBeCategory = 'NOTICE' | 'AMEND' | 'EVENT' | 'UPDATE';

/** 백엔드 NoticeStatus — 기존 NoticeStatus 와 충돌 방지를 위해 BE prefix */
export type NoticeBeStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

/** NoticeDetailRspDto */
export interface NoticeBe {
  id: number;
  title: string;
  author: string;
  content: string;
  category: NoticeBeCategory;
  originalNoticeId: number | null;
  createTime: string;
  viewCount: number;
  status: NoticeBeStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
}

/** NoticeSummaryRspDto */
export interface NoticeBeSummary {
  id: number;
  title: string;
  author: string;
  category: NoticeBeCategory;
  originalNoticeId: number | null;
  createTime: string;
  viewCount: number;
  status: NoticeBeStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
}

/** NoticePageRspDto */
export interface NoticeBePage {
  notices: NoticeBeSummary[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
}

/** GET /v1/notices 쿼리 파라미터 */
export interface NoticeBeListParams {
  page?: number;
  category?: NoticeBeCategory;
}

/** NoticeReqDto — POST/PATCH 본문 */
export interface NoticeBeUpsertRequest {
  title: string;
  content: string;
  category: NoticeBeCategory;
  originalNoticeId?: number | null;
  status: NoticeBeStatus;
  /** "yyyy-MM-ddTHH:mm:ss" — status=SCHEDULED 일 때만 채움. 10분 단위. */
  scheduledAt?: string | null;
}
