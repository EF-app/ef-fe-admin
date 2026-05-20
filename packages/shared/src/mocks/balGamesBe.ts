/**
 * BE 스키마(types/balGameBe.ts)에 맞춘 mock fallback.
 * 기존 mocks/balGames.ts 는 그대로 보존.
 */
import type {
  BalApplyBe,
  BalGameBe,
  BalGameBeSummary,
  BalApplyBeStatus,
  BalBeCategory,
  BalGameBeStatus,
} from '../types/balGameBe';

export const mockBalAppliesBe: BalApplyBe[] = [
  {
    id: 5001,
    userId: 101,
    userNickname: '달빛여우',
    optionA: '교통카드',
    optionB: '이어폰',
    optionAEmoji: '💳',
    optionBEmoji: '🎧',
    description: '출근길 지하철 개찰구 앞에서 놓고 온 거 인지함. 어떤 게 더 충격일지?',
    categoryCode: 'DAILY',
    status: 'PENDING',
    adminMemo: null,
    createTime: '2026-05-11T08:24:00',
  },
  {
    id: 5002,
    userId: 102,
    userNickname: '별빛조각',
    optionA: '평생 한 사람만 사랑',
    optionB: '평생 짧고 강렬한 연애',
    optionAEmoji: '💞',
    optionBEmoji: '💔',
    description: null,
    categoryCode: 'LOVE',
    status: 'PENDING',
    adminMemo: null,
    createTime: '2026-05-10T17:02:00',
  },
  {
    id: 5003,
    userId: 105,
    userNickname: '봄바람솔솔',
    optionA: '제주 한 달 살기',
    optionB: '유럽 2주 여행',
    optionAEmoji: '🌴',
    optionBEmoji: '🗼',
    description: '예산 동일. 어디로?',
    categoryCode: 'TRAVEL',
    status: 'PENDING',
    adminMemo: null,
    createTime: '2026-05-10T11:30:00',
  },
  {
    id: 5004,
    userId: 103,
    userNickname: '라임소다',
    optionA: '돈 많은데 친구 없음',
    optionB: '돈 없는데 친구 많음',
    optionAEmoji: '💰',
    optionBEmoji: '🤝',
    description: null,
    categoryCode: 'DILEMMA',
    status: 'APPROVED',
    adminMemo: '재미있는 주제, 게시 예정',
    createTime: '2026-05-08T20:14:00',
  },
  {
    id: 5005,
    userId: 110,
    userNickname: '단풍캠퍼',
    optionA: '욕설 포함 글',
    optionB: '욕설 포함 글',
    optionAEmoji: null,
    optionBEmoji: null,
    description: null,
    categoryCode: 'ETC',
    status: 'REJECTED',
    adminMemo: '욕설/혐오 표현 포함으로 반려',
    createTime: '2026-05-07T09:00:00',
  },
];

export const mockBalGamesBe: BalGameBe[] = [
  {
    id: 6001,
    optionA: '치킨',
    optionADesc: '바삭한 후라이드 치킨 한 마리',
    optionAEmoji: '🍗',
    optionB: '피자',
    optionBDesc: '치즈가 가득한 마르게리타 피자',
    optionBEmoji: '🍕',
    description: '오늘 저녁 야식, 어떤 거 시킬래?',
    categoryCode: 'TASTE',
    status: 'PUBLISHED',
    scheduledAt: null,
    scheduledEndAt: '2026-05-20T00:00:00',
    totalCount: 1240,
    aCount: 720,
    bCount: 520,
    commentCount: 86,
    applicantUserId: null,
    applicantNickname: null,
    voteStats: null,
    createTime: '2026-05-10T10:00:00',
    updateTime: '2026-05-12T07:00:00',
  },
  {
    id: 6002,
    optionA: '여름 휴가 산',
    optionADesc: '시원한 계곡, 그늘진 등산로',
    optionAEmoji: '⛰️',
    optionB: '여름 휴가 바다',
    optionBDesc: '에메랄드빛 해변, 시원한 파도',
    optionBEmoji: '🏖️',
    description: null,
    categoryCode: 'TRAVEL',
    status: 'SCHEDULED',
    scheduledAt: '2026-05-15T09:00:00',
    scheduledEndAt: '2026-06-15T00:00:00',
    totalCount: 0,
    aCount: 0,
    bCount: 0,
    commentCount: 0,
    applicantUserId: null,
    applicantNickname: null,
    voteStats: null,
    createTime: '2026-05-11T18:00:00',
    updateTime: '2026-05-11T18:00:00',
  },
  {
    id: 6003,
    optionA: '돈 많은데 친구 없음',
    optionADesc: '재산 100억, 친구 0명',
    optionAEmoji: '💰',
    optionB: '돈 없는데 친구 많음',
    optionBDesc: '재산 0원, 친구 100명',
    optionBEmoji: '🤝',
    description: null,
    categoryCode: 'DILEMMA',
    status: 'DRAFT',
    scheduledAt: null,
    scheduledEndAt: null,
    totalCount: 0,
    aCount: 0,
    bCount: 0,
    commentCount: 0,
    applicantUserId: null,
    applicantNickname: null,
    voteStats: null,
    createTime: '2026-05-09T11:00:00',
    updateTime: '2026-05-09T11:00:00',
  },
  {
    id: 6004,
    optionA: '시간 멈추기',
    optionADesc: '하루 24시간 동안 시간 정지 가능',
    optionAEmoji: '⏳',
    optionB: '순간이동',
    optionBDesc: '어디든 즉시 이동 가능',
    optionBEmoji: '🪄',
    description: '만약 초능력 하나만 가질 수 있다면?',
    categoryCode: 'WHATIF',
    status: 'PUBLISHED',
    scheduledAt: null,
    scheduledEndAt: null,
    totalCount: 882,
    aCount: 401,
    bCount: 481,
    commentCount: 54,
    applicantUserId: null,
    applicantNickname: null,
    voteStats: null,
    createTime: '2026-05-08T13:00:00',
    updateTime: '2026-05-12T06:00:00',
  },
  {
    id: 6005,
    optionA: '연인의 SNS 비밀번호',
    optionADesc: '알려달라고 요구',
    optionAEmoji: '🔐',
    optionB: '연인의 SNS 비밀번호',
    optionBDesc: '몰라도 상관없음',
    optionBEmoji: '🤷',
    description: null,
    categoryCode: 'LOVE',
    status: 'ARCHIVED',
    scheduledAt: null,
    scheduledEndAt: null,
    totalCount: 2104,
    aCount: 520,
    bCount: 1584,
    commentCount: 211,
    applicantUserId: null,
    applicantNickname: null,
    voteStats: null,
    createTime: '2026-03-01T10:00:00',
    updateTime: '2026-05-01T00:00:00',
  },
];

function toSummary(g: BalGameBe): BalGameBeSummary {
  return {
    id: g.id,
    optionA: g.optionA,
    optionADesc: g.optionADesc,
    optionB: g.optionB,
    optionBDesc: g.optionBDesc,
    optionAEmoji: g.optionAEmoji,
    optionBEmoji: g.optionBEmoji,
    categoryCode: g.categoryCode,
    status: g.status,
    totalCount: g.totalCount,
    aCount: g.aCount,
    bCount: g.bCount,
    commentCount: g.commentCount,
    scheduledAt: g.scheduledAt,
    applicantUserId: g.applicantUserId,
    applicantNickname: g.applicantNickname,
    createTime: g.createTime,
  };
}

export interface MockPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export function buildMockBalApplyBePage(
  page = 0,
  status?: BalApplyBeStatus
): MockPage<BalApplyBe> {
  const size = 10;
  const filtered = status
    ? mockBalAppliesBe.filter((a) => a.status === status)
    : mockBalAppliesBe;
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
    last: page + 1 >= totalPages,
  };
}

export function buildMockBalGameBePage(
  page = 0,
  category?: BalBeCategory,
  status?: BalGameBeStatus
): MockPage<BalGameBeSummary> {
  const size = 12;
  const filtered = mockBalGamesBe.filter(
    (g) =>
      (category ? g.categoryCode === category : true) &&
      (status ? g.status === status : true)
  );
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  return {
    content: filtered.slice(start, start + size).map(toSummary),
    page,
    size,
    totalElements,
    totalPages,
    last: page + 1 >= totalPages,
  };
}

export const mockBalApplyBePage = buildMockBalApplyBePage(0);
export const mockBalGameBePage = buildMockBalGameBePage(0);
