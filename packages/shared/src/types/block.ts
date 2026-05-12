/**
 * 차단 (block 테이블) — 유저 간 차단 관계
 * BE 테이블 컬럼: id, blocker_id, blocked_id, reason_category, detail, create_time
 *
 * 표시용 denormalized 필드 (blockerNickname, blockerUuid 등) 는 BE 가 JOIN 해서
 * 내려줄 것으로 가정. is_mutual 은 컬럼이 아니므로 운영자 화면에서 페이지 내 데이터로
 * (blocker, blocked) 쌍 ↔ (blocked, blocker) 쌍이 둘 다 있는지로 판정한다.
 */

export const BLOCK_REASON_CATEGORY = {
  PROFANITY_HATE: 'PROFANITY_HATE',
  SEXUAL_CONTENT: 'SEXUAL_CONTENT',
  SPAM_PROMOTION: 'SPAM_PROMOTION',
  THREAT: 'THREAT',
  FAKE_IDENTITY: 'FAKE_IDENTITY',
  OTHER: 'OTHER',
} as const;
export type BlockReasonCategory =
  (typeof BLOCK_REASON_CATEGORY)[keyof typeof BLOCK_REASON_CATEGORY];

export interface BlockEntry {
  id: number;
  blockerId: number;
  blockerNickname: string;
  blockerUuid: string;
  blockedId: number;
  blockedNickname: string;
  blockedUuid: string;
  reasonCategory: BlockReasonCategory;
  detail: string | null;
  createTime: string;
}

export interface BlockListParams {
  keyword?: string;
  reasonCategory?: BlockReasonCategory;
  page?: number;
  size?: number;
}
