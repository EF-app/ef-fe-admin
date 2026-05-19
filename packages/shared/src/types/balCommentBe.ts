/**
 * 밸런스게임 댓글 / 대댓글 — 어드민 시각.
 * FE Comment 타입에 어드민 전용 필드(실제 작성자 / 신고 카운트 / 숨김 / 투표 선택) 보강.
 */

import type { BalGameBeStatus, BalBeCategory } from './balGameBe';

/** 표시용 아바타 색 */
export type CommentAvatarColor = 'purple' | 'blue' | 'green' | 'amber' | 'pink';

export interface BalCommentReplyBe {
  id: number;
  /** BE 외부 노출 식별자 (uuid). API path 호출에 사용. */
  uuid: string;
  /** 표시용 닉네임 (BE 가 랜덤 부여, 익명에 가까운 동물 이름 등) */
  displayNick: string;
  letter: string;
  avColor: CommentAvatarColor;

  /** 실제 작성자 (어드민만 노출) */
  authorUserId: number;
  authorUserUuid: string;
  authorRealNickname: string;

  text: string;
  /** 작성 시각 (서버에서 ISO) */
  createTime: string;

  likes: number;
  reportCount: number;
  hidden: boolean;
  deleted: boolean;
}

export interface BalCommentBe {
  id: number;
  /** BE 외부 노출 식별자 (uuid). API path 호출에 사용. */
  uuid: string;
  /** 부모 게임의 uuid (API path 호출에 사용) */
  gameUuid: string;

  displayNick: string;
  letter: string;
  avColor: CommentAvatarColor;

  authorUserId: number;
  authorUserUuid: string;
  authorRealNickname: string;

  /** 어떤 선택지에 투표했는지 (없을 수도) */
  voteChoice: 'A' | 'B' | null;

  text: string;
  createTime: string;

  likes: number;
  reportCount: number;
  hidden: boolean;
  deleted: boolean;

  replies: BalCommentReplyBe[];
}

/** /v1/admin/bal-game/:id/comments 응답 모양(가정) */
export interface BalCommentListParams {
  gameId: number;
  page?: number;
  size?: number;
}

export interface BalGameLight {
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
  totalCount: number;
  aCount: number;
  bCount: number;
  commentCount: number;
  createTime: string;
}
