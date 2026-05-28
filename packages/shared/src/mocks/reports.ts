import type { Report, ReportGroup } from '../types/report';
import { mockPage } from './pageUtil';

/**
 * 그룹화 시연용 mock (BE AdminReportSummaryRspDto enrich 정합).
 *
 * - 라임소다 PROFILE 에 3건 (그룹 A)
 * - 차가운바람 CHAT 에 2건 (그룹 B)
 * - 차가운바람 BAL_COMMENT 에 2건 + 부모 게임 #2001 (그룹 D)
 * - 차가운바람 PROFILE 에 2건 모두 PROCESSED + 제재 9001 (그룹 F)
 * - 단건들: POST_IT, CHAT_IMAGE
 *
 * 어드민은 외부 노출이 없는 "뒷단" 도구라 uuid 를 쓰지 않고 모든 도메인을 BIGINT id 로 다룬다.
 * BE `findAllByTargetTypeAndTargetIdOrderByCreateTimeAsc` 와 동일하게 그룹 내부는 시간 ASC.
 */
export const mockReports: Report[] = [
  // ── 그룹 A: PROFILE / target_id=103 (라임소다) — 3건 ──
  {
    id: 5003,
    target_type: 'PROFILE',
    target_id: 103,
    reporter_id: 105,
    reporter_nickname: '봄바람솔솔',
    reason: '허위 프로필 의심',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: undefined,
    target_user_id: 103,
    target_user_nickname: '라임소다',
    create_time: '2026-04-18T09:00:00.000Z',
    update_time: '2026-04-18T09:00:00.000Z',
  },
  {
    id: 5006,
    target_type: 'PROFILE',
    target_id: 103,
    reporter_id: 102,
    reporter_nickname: '별빛조각',
    reason: '도용된 사진으로 보임',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: undefined,
    target_user_id: 103,
    target_user_nickname: '라임소다',
    create_time: '2026-04-19T14:30:00.000Z',
    update_time: '2026-04-19T14:30:00.000Z',
  },
  {
    id: 5007,
    target_type: 'PROFILE',
    target_id: 103,
    reporter_id: 101,
    reporter_nickname: '달빛여우',
    reason: '나이 허위 기재',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: undefined,
    target_user_id: 103,
    target_user_nickname: '라임소다',
    create_time: '2026-04-20T05:12:00.000Z',
    update_time: '2026-04-20T05:12:00.000Z',
  },

  // ── 그룹 B: CHAT / target_id=41123 — 2건 ──
  {
    id: 5002,
    target_type: 'CHAT',
    target_id: 41123,
    reporter_id: 101,
    reporter_nickname: '달빛여우',
    reason: '욕설 및 성희롱',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '(채팅 내용 미리보기)',
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    create_time: '2026-04-20T04:02:00.000Z',
    update_time: '2026-04-20T04:02:00.000Z',
  },
  {
    id: 5008,
    target_type: 'CHAT',
    target_id: 41123,
    reporter_id: 105,
    reporter_nickname: '봄바람솔솔',
    reason: '협박성 메시지',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '(채팅 내용 미리보기)',
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    create_time: '2026-04-20T11:40:00.000Z',
    update_time: '2026-04-20T11:40:00.000Z',
  },

  // ── 그룹 C: POST_IT / target_id=8003 — 단건 ──
  {
    id: 5001,
    target_type: 'POST_IT',
    target_id: 8003,
    reporter_id: 102,
    reporter_nickname: '별빛조각',
    reason: '부적절한 언어 사용',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '이 글은 너무 거칠어요…',
    target_user_id: 103,
    target_user_nickname: '라임소다',
    create_time: '2026-04-20T05:12:00.000Z',
    update_time: '2026-04-20T05:12:00.000Z',
  },

  // ── 그룹 D: BAL_COMMENT / target_id=70103 (게임 #2001 의 댓글) — 2건 ──
  {
    id: 5004,
    target_type: 'BAL_COMMENT',
    target_id: 70103,
    reporter_id: 102,
    reporter_nickname: '별빛조각',
    reason: '광고성 댓글',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '지금 ○○몰 세일 중…',
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    bal_game_id: 2001,
    create_time: '2026-04-19T12:00:00.000Z',
    update_time: '2026-04-19T12:00:00.000Z',
  },
  {
    id: 5009,
    target_type: 'BAL_COMMENT',
    target_id: 70103,
    reporter_id: 105,
    reporter_nickname: '봄바람솔솔',
    reason: '도배·스팸',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '지금 ○○몰 세일 중…',
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    bal_game_id: 2001,
    create_time: '2026-04-20T08:15:00.000Z',
    update_time: '2026-04-20T08:15:00.000Z',
  },

  // ── 그룹 F: PROFILE / target_id=104 (차가운바람) — 2건 모두 PROCESSED + 제재 9001 ──
  {
    id: 5010,
    target_type: 'PROFILE',
    target_id: 104,
    reporter_id: 101,
    reporter_nickname: '달빛여우',
    reason: '도용된 사진',
    status: 'PROCESSED',
    admin_processed_by: 1,
    admin_processed_by_name: '관리자',
    admin_processed_at: '2026-04-17T15:30:00.000Z',
    suspension_id: 9001,
    target_preview: undefined,
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    create_time: '2026-04-15T11:00:00.000Z',
    update_time: '2026-04-17T15:30:00.000Z',
  },
  {
    id: 5011,
    target_type: 'PROFILE',
    target_id: 104,
    reporter_id: 102,
    reporter_nickname: '별빛조각',
    reason: '도용된 사진',
    status: 'PROCESSED',
    admin_processed_by: 1,
    admin_processed_by_name: '관리자',
    admin_processed_at: '2026-04-17T15:30:00.000Z',
    suspension_id: 9001,
    target_preview: undefined,
    target_user_id: 104,
    target_user_nickname: '차가운바람',
    create_time: '2026-04-16T08:20:00.000Z',
    update_time: '2026-04-17T15:30:00.000Z',
  },

  // ── 그룹 E: CHAT_IMAGE / target_id=88231 — 단건 ──
  {
    id: 5005,
    target_type: 'CHAT_IMAGE',
    target_id: 88231,
    reporter_id: 105,
    reporter_nickname: '봄바람솔솔',
    reason: '음란성 이미지',
    status: 'PENDING',
    admin_processed_by: null,
    admin_processed_at: null,
    suspension_id: null,
    target_preview: '(이미지 첨부)',
    target_user_id: 999,
    target_user_nickname: '문제계정',
    create_time: '2026-05-12T03:15:00.000Z',
    update_time: '2026-05-12T03:15:00.000Z',
  },
];

/**
 * 위 신고들을 (target_type, target_id) 로 묶어 그룹 배열 생성.
 * BE 동작 모방: reports 는 시간 ASC, totalCount/pendingCount/first/last 계산.
 */
function buildMockGroups(): ReportGroup[] {
  const map = new Map<string, ReportGroup>();
  for (const r of mockReports) {
    const key = `${r.target_type}|${r.target_id}`;
    const existing = map.get(key);
    if (existing) {
      existing.reports.push(r);
      existing.total_count += 1;
      if (r.status === 'PENDING') existing.pending_count += 1;
      if (r.create_time < existing.first_reported_at)
        existing.first_reported_at = r.create_time;
      if (r.create_time > existing.last_reported_at)
        existing.last_reported_at = r.create_time;
    } else {
      map.set(key, {
        target_type: r.target_type,
        target_id: r.target_id,
        total_count: 1,
        pending_count: r.status === 'PENDING' ? 1 : 0,
        first_reported_at: r.create_time,
        last_reported_at: r.create_time,
        reports: [r],
        target_user_id: r.target_user_id,
        target_user_nickname: r.target_user_nickname,
        target_preview: r.target_preview,
      });
    }
  }
  // 각 그룹 내부 시간 ASC
  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    reports: [...g.reports].sort((a, b) =>
      a.create_time.localeCompare(b.create_time)
    ),
  }));
  // 그룹 자체는 first_reported_at DESC (최신 그룹이 위)
  groups.sort((a, b) => b.first_reported_at.localeCompare(a.first_reported_at));
  return groups;
}

export const mockReportGroups: ReportGroup[] = buildMockGroups();
export const mockReportGroupsPage = mockPage(mockReportGroups);
