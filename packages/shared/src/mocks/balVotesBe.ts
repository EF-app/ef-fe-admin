/**
 * 어드민 — 한 게임의 개별 투표자 목록 mock + 통계 생성.
 *
 * 결정론적 생성: gameId 와 인덱스로 같은 시드를 만들어 어떤 환경에서든 동일한 결과.
 * mockBalGamesBe 의 aCount/bCount 와 굳이 일치시키진 않음 — 게임당 30명 풀,
 * A:B 비율만 mock 게임 통계와 비슷하게 (시각적으로 자연스럽게).
 */
import type {
  AdminBalVote,
  AdminBalVoteListParams,
  BalVoteChoice,
} from '../types/balVoteBe';
import type {
  AdminBalVoteBucketStat,
  AdminBalVoteStats,
} from '../types/balGameBe';
import { mockBalGamesBe } from './balGamesBe';

const NICK_POOL = [
  '귀여운 다람쥐', '용감한 토끼', '말없는 고양이', '시끄러운 까치', '느긋한 거북이',
  '재빠른 여우', '엉뚱한 너구리', '점잖은 사슴', '쾌활한 강아지', '신중한 두루미',
  '발랄한 햄스터', '진지한 부엉이', '명랑한 카멜레온', '단호한 늑대', '소심한 토토',
  '편안한 펭귄', '활기찬 미어캣', '차분한 코알라', '호기심 곰', '몽실한 양',
];

// 지역: BE 가 country 단위로 묶어 내려보내므로 mock 도 광역 단위. 일부 city 포함된 케이스도.
const AREA_POOL: (string | null)[] = [
  '서울특별시 강남구',
  '서울특별시 마포구',
  '서울특별시',
  '경기도 성남시',
  '경기도 수원시',
  '경기도',
  '부산광역시',
  '인천광역시',
  '대구광역시',
  '제주특별자치도',
  null, // 미설정
];

const MIN_AGE = 19;
const MAX_AGE = 55;

/** 결정론적 해시 (gameId + idx → 32bit) */
function seedHash(gameId: number, idx: number, salt = 0): number {
  let h = (gameId * 73856093) ^ (idx * 19349663) ^ (salt * 83492791);
  h = (h ^ (h >>> 16)) * 0x85ebca6b;
  h = (h ^ (h >>> 13)) * 0xc2b2ae35;
  h = h ^ (h >>> 16);
  return Math.abs(h | 0);
}

function pad(n: number, w = 4) {
  return n.toString().padStart(w, '0');
}

/** gameId 별 풀 캐시 — 페이지 이동·필터 변경에도 같은 데이터 유지 */
const poolCache = new Map<number, AdminBalVote[]>();

function buildPoolForGame(gameId: number): AdminBalVote[] {
  if (poolCache.has(gameId)) return poolCache.get(gameId)!;

  // mock 게임에서 A:B 비율 가져와 비율 맞춰 생성. mock 에 없는 게임이면 6:4 기본.
  const game = mockBalGamesBe.find((g) => g.id === gameId);
  const a = game?.aCount ?? 0;
  const b = game?.bCount ?? 0;
  const total = a + b;
  const aRatio = total > 0 ? a / total : 0.5;

  const POOL_SIZE = 30;
  const now = Date.now();
  const pool: AdminBalVote[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const seed = seedHash(gameId, i);
    const choice: BalVoteChoice = i / POOL_SIZE < aRatio ? 'A' : 'B';
    const nick = NICK_POOL[seed % NICK_POOL.length];
    const userId = 200000 + gameId * 1000 + i;
    const userUuid = `u-${pad(userId)}`;
    const ageRange = MAX_AGE - MIN_AGE + 1;
    const age = MIN_AGE + (seed % ageRange);
    const areaIdx = (seed >>> 3) % AREA_POOL.length;
    const area = AREA_POOL[areaIdx];
    // 최근 14일 분포. 최신이 먼저.
    const minutesAgo = i * 23 + (seed % 47);
    const createMs = now - minutesAgo * 60 * 1000;
    // 일부(약 15%) 는 재투표 흔적 — updateTime 이 createTime 보다 늦음.
    const reVoted = seed % 7 === 0;
    const updateMs = reVoted ? createMs + (seed % 600 + 30) * 60 * 1000 : createMs;
    pool.push({
      voteId: gameId * 10000 + i,
      userId,
      userUuid,
      userNickname: `${nick}${(seed % 90) + 10}`,
      userAge: age,
      userArea: area,
      choice,
      createTime: new Date(createMs).toISOString().slice(0, 19),
      updateTime: new Date(updateMs).toISOString().slice(0, 19),
    });
  }
  // 시간 DESC 정렬 (최신이 위)
  pool.sort((x, y) => y.createTime.localeCompare(x.createTime));
  poolCache.set(gameId, pool);
  return pool;
}

export interface MockBalVotePage {
  content: AdminBalVote[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export function buildMockBalVotePage(
  gameUuid: string,
  params: AdminBalVoteListParams = {}
): MockBalVotePage {
  // gameUuid 에서 numeric 시드 추출 (mock 풀 생성용 — BE 모드에서는 사용 안 됨)
  const seed = (gameUuid.match(/(\d+)/)?.[1] ?? '0');
  const pool = buildPoolForGame(Number(seed));
  const filtered = params.choice
    ? pool.filter((v) => v.choice === params.choice)
    : pool;
  const size = params.size ?? 10;
  const page = params.page ?? 0;
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * size;
  const content = filtered.slice(start, start + size);
  return {
    content,
    page: safePage,
    size,
    totalElements,
    totalPages,
    last: safePage + 1 >= totalPages,
  };
}

/* ===== 통계 (voteStats) — 풀 기반 집계 ===== */

const AGE_BUCKET_ORDER = [
  '20~24', '25~29', '30~34', '35~39', '40~44', '45~49', '50대 이상', '미설정',
] as const;

function ageBucket(age: number | null): string {
  if (age == null) return '미설정';
  if (age < 20) return '미설정'; // mock 단순화 — BE 정책상 미성년은 없어야 정상
  if (age >= 50) return '50대 이상';
  if (age < 25) return '20~24';
  if (age < 30) return '25~29';
  if (age < 35) return '30~34';
  if (age < 40) return '35~39';
  if (age < 45) return '40~44';
  return '45~49';
}

/** "서울특별시 강남구" → "서울특별시", null → "미설정" */
function areaCountry(area: string | null): string {
  if (!area) return '미설정';
  const first = area.split(' ')[0];
  return first || '미설정';
}

/**
 * 게임의 mock 풀로부터 통계 생성. BE 의 AdminBalVoteStatsRspDto 와 동일한 모양.
 * BalanceGameDetail 에서 사용. mockBalGamesBe 의 detail mock 객체에 미리 채우는 것보다
 * lazy 하게 계산하는 게 풀(빈 버킷 정리 등) 과 일관성 유지에 편리.
 */
export function buildMockVoteStats(gameId: number): AdminBalVoteStats {
  const pool = buildPoolForGame(gameId);
  const total = pool.length;
  const aCount = pool.filter((v) => v.choice === 'A').length;
  const bCount = total - aCount;
  const aPercent = total === 0 ? null : Math.round((aCount / total) * 1000) / 10;
  const bPercent = total === 0 ? null : Math.round((bCount / total) * 1000) / 10;

  // 연령대 집계 — BE 처럼 비어있는 키는 응답에 없음 (UI 가 채울 책임).
  const ageDistribution: Record<string, AdminBalVoteBucketStat> = {};
  for (const v of pool) {
    const k = ageBucket(v.userAge);
    const cell = ageDistribution[k] ?? { a: 0, b: 0 };
    if (v.choice === 'A') cell.a += 1;
    else cell.b += 1;
    ageDistribution[k] = cell;
  }

  // 지역 집계 — country 단위
  const areaDistribution: Record<string, AdminBalVoteBucketStat> = {};
  for (const v of pool) {
    const k = areaCountry(v.userArea);
    const cell = areaDistribution[k] ?? { a: 0, b: 0 };
    if (v.choice === 'A') cell.a += 1;
    else cell.b += 1;
    areaDistribution[k] = cell;
  }

  return { aPercent, bPercent, ageDistribution, areaDistribution };
}

export { AGE_BUCKET_ORDER };
