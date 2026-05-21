/**
 * 차단 (block 테이블) — 유저 간 차단 관계
 * BE 테이블 컬럼: id, blocker_id, blocked_id, create_time
 *
 * 표시용 denormalized 필드 (blockerNickname, blockerUuid 등) 는 BE 가 JOIN 해서
 * 내려줄 것으로 가정. is_mutual 은 컬럼이 아니므로 운영자 화면에서 페이지 내 데이터로
 * (blocker, blocked) 쌍 ↔ (blocked, blocker) 쌍이 둘 다 있는지로 판정한다.
 */

export interface BlockEntry {
  id: number;
  blockerId: number;
  blockerNickname: string;
  blockerUuid: string;
  blockedId: number;
  blockedNickname: string;
  blockedUuid: string;
  /** 역방향 차단(blocked→blocker)도 존재하면 true — BE 가 판정 */
  mutual: boolean;
  createTime: string;
}

export interface BlockListParams {
  keyword?: string;
  page?: number;
  size?: number;
}
