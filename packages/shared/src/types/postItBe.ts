/**
 * 백엔드 post_it 테이블 DDL 정합 타입.
 *
 * DDL 컬럼: id, uuid, user_id, category_code, content, color, is_anonymous,
 *          expires_at, pinned_until, report_count, reply_count, is_hidden, is_deleted,
 *          create_time, update_time, create_user, update_user
 *
 * 표시용 denormalized (BE 가 JOIN 해서 내려줄 것으로 가정):
 *   userNickname, userAge, userArea, userUuid
 *
 * 기존 types/postIt.ts (POST_IT_CATEGORY label 등) 는 그대로 보존.
 */

import type { PostItCategory } from '../constants/enums';

/** 포스트잇 색상 슬롯 (P1~P5) — DDL CHECK constraint */
export const POST_IT_COLOR = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
  P5: 'P5',
} as const;
export type PostItColor = (typeof POST_IT_COLOR)[keyof typeof POST_IT_COLOR];

/** color → 실제 hex (포스트잇 배경) */
export const POST_IT_COLOR_HEX: Record<PostItColor, string> = {
  P1: '#EEE9F6',
  P2: '#E4DEF2',
  P3: '#F6F3FB',
  P4: '#E8E0EF',
  P5: '#F2EDF6',
};

export interface PostItBe {
  id: number;
  uuid: string;
  userId: number;
  userUuid: string;
  userNickname: string;
  userAge: number | null;
  userArea: string | null;
  categoryCode: PostItCategory;
  content: string;
  color: PostItColor;
  anonymous: boolean;
  expiresAt: string;
  pinnedUntil: string | null;
  reportCount: number;
  replyCount: number;
  /** 좋아요 누적 — BE 추가 예정 필드 (현 DDL 미포함). 미존재 시 0 */
  likeCount: number;
  hidden: boolean;
  deleted: boolean;
  createTime: string;
  updateTime: string;
}

export interface PostItBeListParams {
  keyword?: string;
  categoryCode?: PostItCategory;
  isHidden?: boolean;
  isDeleted?: boolean;
  userId?: number;
  page?: number;
  size?: number;
}
