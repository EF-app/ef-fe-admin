/**
 * 백엔드 (EF-BE) BalApply / BalGame DTO 와 1:1 매핑되는 신규 타입.
 *
 * 기존 types/balGame.ts (BAL_CATEGORIES 8종 / BAL_GAME_STATUS / mockBalGamesPage) 는 그대로 보존.
 * 새 흐름은 이 모듈만 사용한다.
 */

/** BE BalCategoryCode — 7종 */
export const BAL_BE_CATEGORY = {
  LOVE: 'LOVE',
  DAILY: 'DAILY',
  TRAVEL: 'TRAVEL',
  TASTE: 'TASTE',
  WHATIF: 'WHATIF',
  DILEMMA: 'DILEMMA',
  ETC: 'ETC',
} as const;
export type BalBeCategory = (typeof BAL_BE_CATEGORY)[keyof typeof BAL_BE_CATEGORY];

/** UI 표시용 카테고리 메타 — 디자인 참조 EF-FE BALANCE_CATEGORIES */
export interface BalBeCategoryMeta {
  value: BalBeCategory;
  label: string;
  emoji: string;
}
export const BAL_BE_CATEGORIES: readonly BalBeCategoryMeta[] = [
  { value: 'LOVE', label: '연애', emoji: '💗' },
  { value: 'DAILY', label: '일상', emoji: '🗓️' },
  { value: 'TRAVEL', label: '여행', emoji: '✈️' },
  { value: 'TASTE', label: '취향', emoji: '🍰' },
  { value: 'WHATIF', label: '만약에', emoji: '💭' },
  { value: 'DILEMMA', label: '딜레마', emoji: '⚖️' },
  { value: 'ETC', label: '기타', emoji: '🎲' },
] as const;

/** BE BalGameStatus */
export type BalGameBeStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'ARCHIVED';

/** BE BalApplyStatus */
export type BalApplyBeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** /v1/admin/bal-apply BalApplyRspDto */
export interface BalApplyBe {
  id: number;
  userId: number | null;
  userNickname?: string;
  optionA: string;
  optionB: string;
  optionAEmoji: string | null;
  optionBEmoji: string | null;
  description: string | null;
  categoryCode: BalBeCategory;
  status: BalApplyBeStatus;
  adminMemo: string | null;
  createTime: string;
}

export interface BalApplyBeListParams {
  status?: BalApplyBeStatus;
  page?: number;
  size?: number;
}

export interface BalApplyDecisionRequest {
  status: BalApplyBeStatus;
  adminMemo?: string;
}

/** /v1/admin/bal-game AdminBalGameSummaryRspDto */
export interface BalGameBeSummary {
  id: number;
  optionA: string;
  optionADesc: string | null;
  optionB: string;
  optionBDesc: string | null;
  optionAEmoji: string | null;
  optionBEmoji: string | null;
  categoryCode: BalBeCategory;
  status: BalGameBeStatus;
  totalCount: number;
  aCount: number;
  bCount: number;
  commentCount: number;
  scheduledAt: string | null;
  /** BAL-APPLY 기반 등록 시 신청자 user id (자체 등록이면 null) */
  applicantUserId: number | null;
  /** 신청자 닉네임 (탈퇴 시 null) */
  applicantNickname: string | null;
  createTime: string;
}

/** AdminBalVoteBucketStat — 연령대/지역 분포 한 셀 */
export interface AdminBalVoteBucketStat {
  a: number;
  b: number;
}

/** AdminBalVoteStatsRspDto — 게임 상세에 nested 로 포함 */
export interface AdminBalVoteStats {
  /** 총 투표 0 이면 null */
  aPercent: number | null;
  bPercent: number | null;
  /**
   * 키: "20~24" | "25~29" | "30~34" | "35~39" | "40~44" | "45~49" | "50대 이상" | "미설정"
   * 빈 버킷은 응답에 없을 수 있음 — UI 가 채워 정렬.
   */
  ageDistribution: Record<string, AdminBalVoteBucketStat>;
  /** 키: code_area.country (예: "서울특별시") + "미설정" */
  areaDistribution: Record<string, AdminBalVoteBucketStat>;
}

/** AdminBalGameDetailRspDto */
export interface BalGameBe {
  id: number;
  optionA: string;
  optionADesc: string | null;
  optionAEmoji: string | null;
  optionB: string;
  optionBDesc: string | null;
  optionBEmoji: string | null;
  description: string | null;
  categoryCode: BalBeCategory;
  status: BalGameBeStatus;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  totalCount: number;
  aCount: number;
  bCount: number;
  commentCount: number;
  /** BAL-APPLY 기반 등록 시 신청자 user id (자체 등록이면 null) */
  applicantUserId: number | null;
  /** 신청자 닉네임 (탈퇴 시 null) */
  applicantNickname: string | null;
  /** 단건 상세에만 채워짐. createGame/updateGame 응답에서는 null */
  voteStats: AdminBalVoteStats | null;
  createTime: string;
  updateTime: string;
}

export interface BalGameBeListParams {
  categoryCode?: BalBeCategory;
  status?: BalGameBeStatus;
  page?: number;
  size?: number;
}

/** BalGameCreateReqDto (POST 본문) */
export interface BalGameCreateRequest {
  optionA: string;
  optionB: string;
  optionADesc?: string | null;
  optionBDesc?: string | null;
  optionAEmoji?: string | null;
  optionBEmoji?: string | null;
  description?: string | null;
  categoryCode: BalBeCategory;
  status?: BalGameBeStatus;
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  /**
   * BAL-APPLY 기반 등록 시 신청 id (apply 의 PK).
   * 있으면 BE 가 BalApply 를 PENDING → APPROVED 처리하고 신청자를 게임의 applicant 로 연결.
   * 어드민 자체 등록이면 생략.
   */
  applyId?: number | null;
}

/** BalGameUpdateReqDto (PATCH 본문) */
export type BalGameUpdateRequest = Partial<BalGameCreateRequest>;
