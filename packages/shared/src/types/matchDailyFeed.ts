/**
 * match_daily_feed 관리자 조회 — BE AdminDailyFeedItemRspDto 와 1:1.
 *  PK 는 (feedDate, viewerId, matchRank). admin 검색은 이 셋 + targetId + slotType 동적 필터.
 */

export type DailyFeedSlotType =
  | 'SCORE'
  | 'NEWBIE'
  | 'RANDOM'
  | 'CUSTOM_KW'
  | 'FRESH_NEWBIE';

export interface DailyFeedItem {
  feedDate: string;          // ISO date
  viewerId: number;
  viewerNickname: string;
  matchRank: number;
  targetId: number;
  targetNickname: string;
  slotType: DailyFeedSlotType;
  sortKey: number;           // BE BigDecimal — JSON serialize 시 number
  tagsJson: string;
  createdAt: string;
}

/**
 * GET /v1/admin/matches/daily-feed query params.
 *  viewerId 는 단일 ('42') / range ('42~100') 둘 다 지원 — BE 는 viewerIdFrom + viewerIdTo.
 *  단일 입력 시 from=to 로 보낸다.
 */
export interface DailyFeedListParams {
  viewerIdFrom?: number;
  viewerIdTo?: number;
  targetId?: number;
  feedDate?: string;         // 'yyyy-MM-dd'
  slotType?: DailyFeedSlotType;
  matchRank?: number;
  page?: number;
  size?: number;
}

/**
 * BE AdminDailyFeedPageRspDto — COUNT(*) 미제공, hasNext 만.
 *  UI 는 [이전]/[다음] 만 노출. "X 페이지 · N개" 정도 표시.
 */
export interface DailyFeedPage {
  content: DailyFeedItem[];
  page: number;
  size: number;
  hasNext: boolean;
}
