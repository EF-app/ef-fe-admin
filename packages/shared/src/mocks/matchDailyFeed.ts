import type {
  DailyFeedItem,
  DailyFeedPage,
  DailyFeedSlotType,
} from '../types/matchDailyFeed';

const NICKNAMES = ['지수', '하준', '소연', '민준', '하늘', '준서', '아린', '태양', '나연', '서준', '유나', '우진', '채원', '채린', '도현', '지우'];

/** 단일 viewer (id=42) 의 50 row mock — 운영자가 한 사람 피드 디버깅 흐름 모사. */
export const mockDailyFeedRows: DailyFeedItem[] = Array.from({ length: 50 }, (_, i) => {
  const matchRank = i + 1;
  const slot: DailyFeedSlotType =
    [5, 10, 15, 20, 25].includes(matchRank) ? 'FRESH_NEWBIE'
    : matchRank <= 5 ? 'RANDOM'
    : matchRank <= 30 ? 'SCORE'
    : matchRank <= 45 ? 'NEWBIE'
    : 'CUSTOM_KW';
  const targetId = 1000 + matchRank;
  return {
    feedDate: new Date().toISOString().slice(0, 10),
    viewerId: 42,
    viewerNickname: NICKNAMES[42 % NICKNAMES.length],
    matchRank,
    targetId,
    targetNickname: NICKNAMES[targetId % NICKNAMES.length],
    slotType: slot,
    sortKey: Math.max(0, Math.min(1, 0.95 - matchRank * 0.012)),
    tagsJson: JSON.stringify([
      { type: 'KEYWORD', percent: 86 - matchRank, chips: ['독서', '카페투어'] },
      { type: 'IDEAL', percent: 75 - matchRank },
      { type: 'NEARBY' },
    ]),
    createdAt: new Date().toISOString(),
  };
});

/** BE AdminDailyFeedPageRspDto 와 동일 모양. page/size 만큼 슬라이스 + hasNext 판정. */
export function pickMockDailyFeedPage(page = 0, size = 25): DailyFeedPage {
  const start = page * size;
  const slice = mockDailyFeedRows.slice(start, start + size);
  return {
    content: slice,
    page,
    size,
    hasNext: start + size < mockDailyFeedRows.length,
  };
}
