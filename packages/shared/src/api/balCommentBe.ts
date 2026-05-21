/**
 * 백엔드 어드민 밸런스 댓글 API 클라이언트 (단수 — /v1/admin/bal-comment).
 * 유저 상세 "작성한 글 > 밸런스 댓글" 탭에서 특정 유저의 댓글을 조회한다.
 *
 * BE 컨트롤러: AdminBalCommentController
 *   - GET /v1/admin/bal-comment?userId={id}  : 유저가 작성한 밸런스 댓글
 *
 * BE 는 camelCase, 화면(UserBalGameComment)은 레거시 snake_case → 이 모듈이 매핑.
 */
import { getApiClient } from './client';
import type { UserBalGameComment } from '../types/user';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface BeUserBalComment {
  id: number;
  gameId: number;
  gameOptionA: string;
  gameOptionB: string;
  content: string;
  voteChoice: 'A' | 'B' | null;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  hidden: boolean;
  deleted: boolean;
  createTime: string;
}

const BASE = '/v1/admin/bal-comment';

function toUserBalComment(be: BeUserBalComment): UserBalGameComment {
  return {
    id: be.id,
    game_id: be.gameId,
    game_option_a: be.gameOptionA,
    game_option_b: be.gameOptionB,
    content: be.content,
    vote_choice: be.voteChoice,
    like_count: be.likeCount,
    reply_count: be.replyCount,
    create_time: be.createTime,
  };
}

export const balCommentBeApi = {
  // 한 유저의 밸런스 댓글 전체 (화면이 클라이언트사이드 페이징 → size 충분히 크게)
  getUserBalComments: async (userId: number, size = 200): Promise<UserBalGameComment[]> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BeUserBalComment>>>(
      BASE,
      { params: { userId, page: 0, size } }
    );
    return data.data.content.map(toUserBalComment);
  },
};
