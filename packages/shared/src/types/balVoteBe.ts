/**
 * 어드민 — 한 밸런스 게임의 개별 투표자 목록.
 *
 * BE: GET /v1/admin/bal-game/{gameId}/votes?choice=A|B&page=N&size=N
 * 응답: Spring Page<AdminBalVoteRspDto>
 */

export type BalVoteChoice = 'A' | 'B';

export interface AdminBalVote {
  /** bal_vote.id */
  voteId: number;
  userId: number;
  userUuid: string;
  /** 탈퇴 시 null */
  userNickname: string | null;
  userAge: number | null;
  /** "country city" 합성 (예: "서울특별시 강남구"). null = 미설정 */
  userArea: string | null;
  choice: BalVoteChoice;
  /** 첫 투표 시각 */
  createTime: string;
  /** 재투표 시 갱신 (createTime 과 다르면 재투표 흔적) */
  updateTime: string;
}

export interface AdminBalVoteListParams {
  /** 'A' | 'B' — 생략 시 전체 */
  choice?: BalVoteChoice;
  page?: number;
  size?: number;
}
