/**
 * 밸런스게임 댓글 mock. 게임 id별로 묶어두고 useBalGameCommentsBe 가 조회.
 */
import type {
  BalCommentBe,
  BalCommentReplyBe,
  CommentAvatarColor,
} from '../types/balCommentBe';

const colors: CommentAvatarColor[] = ['purple', 'blue', 'green', 'amber', 'pink'];
function nickPool(idx: number) {
  const pool = [
    { displayNick: '졸린고양이🐱', letter: '고', avColor: 'purple' as const, realNickname: '달빛여우', uuid: 'u-101', userId: 101 },
    { displayNick: '수달친구🦦', letter: '수', avColor: 'blue' as const, realNickname: '별빛조각', uuid: 'u-102', userId: 102 },
    { displayNick: '하품판다🐼', letter: '판', avColor: 'green' as const, realNickname: '라임소다', uuid: 'u-103', userId: 103 },
    { displayNick: '뽀글이🐑', letter: '뽀', avColor: 'pink' as const, realNickname: '봄바람솔솔', uuid: 'u-105', userId: 105 },
    { displayNick: '민들레🌻', letter: '민', avColor: 'amber' as const, realNickname: '단풍캠퍼', uuid: 'u-110', userId: 110 },
    { displayNick: '여우비☔', letter: '여', avColor: 'purple' as const, realNickname: '겨울나라', uuid: 'u-109', userId: 109 },
  ];
  return pool[idx % pool.length];
}

function buildReply(
  id: number,
  authorIdx: number,
  text: string,
  hoursAgo: number,
  opts: { likes?: number; reports?: number; hidden?: boolean; deleted?: boolean } = {}
): BalCommentReplyBe {
  const p = nickPool(authorIdx)
  return {
    id,
    displayNick: p.displayNick,
    letter: p.letter,
    avColor: p.avColor,
    authorUserId: p.userId,
    authorUserUuid: p.uuid,
    authorRealNickname: p.realNickname,
    text,
    createTime: new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19),
    likes: opts.likes ?? 0,
    reportCount: opts.reports ?? 0,
    hidden: opts.hidden ?? false,
    deleted: opts.deleted ?? false,
  }
}

function buildComment(
  id: number,
  gameId: number,
  authorIdx: number,
  text: string,
  hoursAgo: number,
  opts: {
    likes?: number
    reports?: number
    hidden?: boolean
    deleted?: boolean
    voteChoice?: 'A' | 'B' | null
    replies?: BalCommentReplyBe[]
  } = {}
): BalCommentBe {
  const p = nickPool(authorIdx)
  return {
    id,
    gameId,
    displayNick: p.displayNick,
    letter: p.letter,
    avColor: p.avColor,
    authorUserId: p.userId,
    authorUserUuid: p.uuid,
    authorRealNickname: p.realNickname,
    voteChoice: opts.voteChoice ?? null,
    text,
    createTime: new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19),
    likes: opts.likes ?? 0,
    reportCount: opts.reports ?? 0,
    hidden: opts.hidden ?? false,
    deleted: opts.deleted ?? false,
    replies: opts.replies ?? [],
  }
}

/** gameId → comment[] — mock key 는 게임 id(PK) 기준. */
export const mockBalCommentsByGame: Record<number, BalCommentBe[]> = {
  // 게임 6001 (치킨 vs 피자, PUBLISHED, comments: 86)
  6001: [
    buildComment(70101, 6001, 0, '피자 100%! 마르게리타 한 판이면 그날 하루가 완성됨 🍕', 2, {
      likes: 18,
      voteChoice: 'B',
      replies: [
        buildReply(70801, 1, '저도 마르게리타파... 토마토 진심', 1, { likes: 4 }),
        buildReply(70802, 2, '치킨도 만만찮은데요 ㅋㅋ', 1.5, { likes: 2 }),
      ],
    }),
    buildComment(70102, 6001, 1, '치킨 와 양념 반반이면 무한 우승. 피자는 한 조각이면 질림', 3, {
      likes: 12,
      voteChoice: 'A',
    }),
    buildComment(70103, 6001, 4, '광고성 메시지 — 카톡 ID 보내드릴게요!', 5, {
      reports: 7,
      hidden: true,
    }),
    buildComment(70104, 6001, 2, '(삭제된 댓글)', 6, { deleted: true }),
    buildComment(70105, 6001, 3, '피자에 파인애플 올리면 죄책감이 들지만 맛있어', 8, {
      likes: 9,
      voteChoice: 'B',
      replies: [
        buildReply(70803, 0, '파인애플 피자... 호불호 갈리죠', 7, { likes: 2 }),
      ],
    }),
    buildComment(70106, 6001, 5, '둘 다 좋아... 결국 음식 앞에서 선택은 잔인하다', 12, {
      likes: 4,
    }),
  ],
  // 게임 6004 (시간멈추기 vs 순간이동, PUBLISHED, comments: 54)
  6004: [
    buildComment(70201, 6004, 3, '순간이동은 진짜 출퇴근 안 해도 되니까 이긴다', 4, {
      likes: 22,
      voteChoice: 'B',
    }),
    buildComment(70202, 6004, 0, '시간 멈추기로 잠 9시간 추가하고 싶다', 6, {
      likes: 14,
      voteChoice: 'A',
      replies: [
        buildReply(70901, 2, '와 그거 너무 갖고 싶다', 5, { likes: 3 }),
      ],
    }),
    buildComment(70203, 6004, 1, '둘 다 결국 시간 부족할 듯', 18, { likes: 7 }),
    buildComment(70204, 6004, 4, '욕설 포함 댓글', 24, {
      reports: 4,
      hidden: true,
    }),
  ],
  // 게임 6005 (연인의 SNS, ARCHIVED, comments: 211 — 일부만)
  6005: [
    buildComment(70301, 6005, 2, '몰라도 상관없음. 신뢰 문제임', 24 * 30, {
      likes: 88,
      voteChoice: 'B',
    }),
    buildComment(70302, 6005, 5, '나는 알려달라 했다가 차임 ㅠㅠ', 24 * 28, {
      likes: 41,
      voteChoice: 'A',
    }),
  ],
}

/** 단일 게임의 댓글 페이지 (admin 화면용) — gameId 기준 */
export function getMockBalComments(gameId: number): BalCommentBe[] {
  return mockBalCommentsByGame[gameId] ?? []
}
