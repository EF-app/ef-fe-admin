/**
 * 백엔드 어드민 밸런스 게임 API 클라이언트.
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - Spring Page<T> = { content, number, size, totalElements, totalPages, last } 모양 그대로 반환.
 *
 * 경로:
 *   /v1/admin/bal-game        : 어드민 게임 목록/상세/댓글/등록/수정
 *   /v1/admin/bal-apply       : 어드민 신청 목록 조회 + 거절
 *
 * 신청 승인은 별도 엔드포인트 없이 POST /v1/admin/bal-game 의 applyId 필드로 통합 처리.
 *
 * 인증 토큰은 client.ts 인터셉터가 Authorization 헤더에 자동 부착.
 * 어드민은 uuid 사용 안 함 — 모든 도메인을 BIGINT id 로 다룬다.
 */
import { getApiClient } from './client';
import type {
  BalApplyBe,
  BalApplyBeListParams,
  BalGameBe,
  BalGameBeListParams,
  BalGameBeSummary,
  BalGameCreateRequest,
  BalGameUpdateRequest,
} from '../types/balGameBe';
import type {
  AdminBalVote,
  AdminBalVoteListParams,
} from '../types/balVoteBe';
import type { BalCommentBe, BalCommentReplyBe, CommentAvatarColor } from '../types/balCommentBe';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface PageData<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * BE AdminBalCommentRspDto — flat (parentId 로 트리 그룹핑은 FE 가).
 * 주의: BE 의 parentId 는 부모 댓글의 **uuid (String)** 이고 id 는 PK(Long).
 * 그룹핑 시 자식의 parentId 와 부모의 uuid 로 매칭해야 함.
 */
interface AdminBalCommentBeDto {
  id: number;
  uuid: string;
  parentId: string | null;
  content: string;
  authorUserId: number | null;
  authorUserNickname: string | null;
  displayNickname: string;
  voteChoice: 'A' | 'B' | null;
  likesCount: number;
  reportCount: number;
  /** Jackson 이 primitive boolean isXxx 게터를 `is` 떼고 직렬화하므로 BE 출력 키는 hidden/deleted. */
  hidden: boolean;
  deleted: boolean;
  createTime: string;
}

const ADMIN_APPLY_BASE = '/v1/admin/bal-apply';
const GAME_BASE = '/v1/admin/bal-game';

// ─────────── 댓글 변환 헬퍼 ───────────

const AVATAR_COLORS: CommentAvatarColor[] = ['purple', 'blue', 'green', 'amber', 'pink'];

/** 작성자 id 해시로 안정적인 아바타 색 — mock 과 일관성 위해 단순 modulo */
function pickAvatarColor(userId: number | null): CommentAvatarColor {
  if (userId == null) return 'purple';
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}

/** 닉네임에서 첫 글자 추출 — 한글/영문 모두 지원 */
function firstLetter(nickname: string | null | undefined): string {
  if (!nickname || nickname.length === 0) return '?';
  return nickname.charAt(0);
}

function toBalCommentReply(be: AdminBalCommentBeDto): BalCommentReplyBe {
  const nickname = be.displayNickname || be.authorUserNickname || '익명';
  return {
    id: be.id,
    uuid: be.uuid,
    displayNick: nickname,
    letter: firstLetter(nickname),
    avColor: pickAvatarColor(be.authorUserId),
    authorUserId: be.authorUserId ?? 0,
    // 어드민은 uuid 안 씀 — 빈 문자열 (suspend 모달 등 uuid 의존부는 후속 작업에서 id 기반 전환)
    authorUserUuid: '',
    authorRealNickname: be.authorUserNickname ?? '(탈퇴)',
    text: be.content,
    createTime: be.createTime,
    likes: be.likesCount,
    reportCount: be.reportCount,
    hidden: be.hidden,
    deleted: be.deleted,
  };
}

function toBalCommentTop(be: AdminBalCommentBeDto, gameUuid: string, replies: BalCommentReplyBe[]): BalCommentBe {
  const nickname = be.displayNickname || be.authorUserNickname || '익명';
  return {
    id: be.id,
    uuid: be.uuid,
    gameUuid,
    displayNick: nickname,
    letter: firstLetter(nickname),
    avColor: pickAvatarColor(be.authorUserId),
    authorUserId: be.authorUserId ?? 0,
    authorUserUuid: '',
    authorRealNickname: be.authorUserNickname ?? '(탈퇴)',
    voteChoice: be.voteChoice,
    text: be.content,
    createTime: be.createTime,
    likes: be.likesCount,
    reportCount: be.reportCount,
    hidden: be.hidden,
    deleted: be.deleted,
    replies,
  };
}

/**
 * BE 의 flat 댓글 리스트를 (parentId 기준) FE 의 트리 구조로 재조립.
 * BE 의 parentId 는 부모 uuid(String) 이므로 부모의 uuid 로 매칭.
 */
function buildCommentTree(flat: AdminBalCommentBeDto[], gameUuid: string): BalCommentBe[] {
  const repliesByParent = new Map<string, BalCommentReplyBe[]>();
  const topLevel: AdminBalCommentBeDto[] = [];

  for (const c of flat) {
    if (c.parentId == null) {
      topLevel.push(c);
    } else {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(toBalCommentReply(c));
      repliesByParent.set(c.parentId, list);
    }
  }

  return topLevel.map((c) => toBalCommentTop(c, gameUuid, repliesByParent.get(c.uuid) ?? []));
}

export const balGamesBeApi = {
  // ----- 신청 (어드민) -----
  /**
   * 신청 목록 — GET /v1/admin/bal-apply
   * status 옵션 (생략 시 전체), 기본 size=10, createTime DESC.
   */
  listApplies: async (
    params?: BalApplyBeListParams
  ): Promise<PageData<BalApplyBe>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<BalApplyBe>>>(
      ADMIN_APPLY_BASE,
      { params }
    );
    return data.data;
  },

  /**
   * 신청 거절 — PATCH /v1/admin/bal-apply/{id}/reject
   * BE 가 PENDING 만 거절 허용. adminMemo 는 255자 제한.
   * 승인 흐름은 별도 엔드포인트 없음 — POST /v1/admin/bal-game 의 applyId 필드로 처리.
   */
  rejectApply: async (
    applyId: number,
    adminMemo?: string | null
  ): Promise<BalApplyBe> => {
    const { data } = await getApiClient().patch<RspTemplate<BalApplyBe>>(
      `${ADMIN_APPLY_BASE}/${applyId}/reject`,
      { adminMemo: adminMemo ?? null }
    );
    return data.data;
  },

  // ----- 게임 (어드민) -----
  listGames: async (params?: BalGameBeListParams): Promise<PageData<BalGameBeSummary>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<BalGameBeSummary>>>(
      GAME_BASE,
      { params }
    );
    return data.data;
  },

  gameDetail: async (gameUuid: string): Promise<BalGameBe> => {
    const { data } = await getApiClient().get<RspTemplate<BalGameBe>>(
      `${GAME_BASE}/${gameUuid}`
    );
    return data.data;
  },

  /**
   * 어드민 댓글 목록 — Page<AdminBalCommentRspDto> 를 받아
   * 트리 구조의 BalCommentBe[] 로 변환 반환.
   * FE 댓글 페이지는 페이징 안 함 → size 충분히 크게 (기본 200).
   */
  gameComments: async (gameUuid: string, size = 200): Promise<BalCommentBe[]> => {
    const { data } = await getApiClient().get<
      RspTemplate<PageData<AdminBalCommentBeDto>>
    >(`${GAME_BASE}/${gameUuid}/comments`, {
      params: { page: 0, size },
    });
    return buildCommentTree(data.data.content, gameUuid);
  },

  /**
   * 한 게임의 개별 투표자 목록 — GET /v1/admin/bal-game/{gameUuid}/votes
   * choice 옵션, default size=50. Spring Page<AdminBalVoteRspDto> 반환.
   */
  gameVotes: async (
    gameUuid: string,
    params?: AdminBalVoteListParams
  ): Promise<PageData<AdminBalVote>> => {
    const { data } = await getApiClient().get<RspTemplate<PageData<AdminBalVote>>>(
      `${GAME_BASE}/${gameUuid}/votes`,
      { params: { page: 0, size: 50, ...params } }
    );
    return data.data;
  },

  createGame: async (payload: BalGameCreateRequest): Promise<BalGameBe> => {
    const { data } = await getApiClient().post<RspTemplate<BalGameBe>>(
      GAME_BASE,
      payload
    );
    return data.data;
  },

  updateGame: async (
    gameUuid: string,
    payload: BalGameUpdateRequest
  ): Promise<BalGameBe> => {
    const { data } = await getApiClient().patch<RspTemplate<BalGameBe>>(
      `${GAME_BASE}/${gameUuid}`,
      payload
    );
    return data.data;
  },
};
