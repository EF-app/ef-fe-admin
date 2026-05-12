/**
 * BE 스키마(types/noticeBe.ts) 에 맞춘 mock fallback.
 * 기존 mocks/notices.ts 는 그대로 보존하고, 신규 NoticeEditor / Notices 페이지는 이 mock 을 사용한다.
 */
import type { NoticeBe, NoticeBeSummary, NoticeBePage } from '../types/noticeBe';

export const mockNoticesBe: NoticeBe[] = [
  {
    id: 1001,
    title: '5월 시스템 점검 안내',
    author: '관리자',
    content:
      '5월 15일 02:00 ~ 04:00 서버 점검이 진행됩니다.\n점검 시간 동안 일부 서비스 이용이 제한될 수 있습니다.',
    category: 'NOTICE',
    originalNoticeId: null,
    createTime: '2026-05-10T10:00:00',
    viewCount: 124,
    status: 'SCHEDULED',
    scheduledAt: '2026-05-14T18:00:00',
    publishedAt: null,
  },
  {
    id: 1002,
    title: '프리미엄 가입 혜택 안내',
    author: '관리자',
    content: '5월 한정 프리미엄 1개월 20% 할인!',
    category: 'EVENT',
    originalNoticeId: null,
    createTime: '2026-05-08T09:30:00',
    viewCount: 2201,
    status: 'PUBLISHED',
    scheduledAt: null,
    publishedAt: '2026-05-08T10:00:00',
  },
  {
    id: 1003,
    title: '앱 v1.5.0 업데이트 권장',
    author: '운영 김',
    content: '최신 버전(1.5.0)으로 업데이트해주세요. 매칭 성능이 개선되었습니다.',
    category: 'UPDATE',
    originalNoticeId: null,
    createTime: '2026-05-05T02:00:00',
    viewCount: 4012,
    status: 'PUBLISHED',
    scheduledAt: null,
    publishedAt: '2026-05-05T02:30:00',
  },
  {
    id: 1004,
    title: '[정정] 프리미엄 가입 혜택 — 할인율 변경',
    author: '관리자',
    content: '4월 한정 프리미엄 1개월 할인율이 20% 가 아닌 25% 로 정정되었습니다. 혼란을 드려 죄송합니다.',
    category: 'AMEND',
    originalNoticeId: 1002,
    createTime: '2026-05-09T14:00:00',
    viewCount: 821,
    status: 'PUBLISHED',
    scheduledAt: null,
    publishedAt: '2026-05-09T14:10:00',
  },
  {
    id: 1007,
    title: '[정정] v1.5.0 업데이트 — 점검 시간 변경',
    author: '운영 김',
    content: '점검 시간이 02:00 ~ 04:00 가 아니라 02:00 ~ 03:00 으로 단축되었습니다.',
    category: 'AMEND',
    originalNoticeId: 1003,
    createTime: '2026-05-06T08:00:00',
    viewCount: 412,
    status: 'PUBLISHED',
    scheduledAt: null,
    publishedAt: '2026-05-06T08:05:00',
  },
  {
    id: 1008,
    title: '[재정정] v1.5.0 업데이트 — 점검 일자도 변경 (정정의 정정)',
    author: '운영 김',
    content:
      '재공지: 앞선 정정 공지(#1007)에 일자 표기가 잘못되어 재정정합니다. 실제 점검은 5/16 02:00~03:00 입니다.',
    category: 'AMEND',
    originalNoticeId: 1007,
    createTime: '2026-05-06T22:30:00',
    viewCount: 198,
    status: 'PUBLISHED',
    scheduledAt: null,
    publishedAt: '2026-05-06T22:35:00',
  },
  {
    id: 1005,
    title: '(작성 중) 6월 신기능 안내',
    author: '관리자',
    content: '...',
    category: 'NOTICE',
    originalNoticeId: null,
    createTime: '2026-05-12T07:00:00',
    viewCount: 0,
    status: 'DRAFT',
    scheduledAt: null,
    publishedAt: null,
  },
  {
    id: 1006,
    title: '2월 이벤트 종료',
    author: '운영 김',
    content: '2월 이벤트가 종료되었습니다. 감사합니다.',
    category: 'EVENT',
    originalNoticeId: null,
    createTime: '2026-02-01T00:00:00',
    viewCount: 5240,
    status: 'ARCHIVED',
    scheduledAt: null,
    publishedAt: '2026-02-01T10:00:00',
  },
];

const toSummary = (n: NoticeBe): NoticeBeSummary => ({
  id: n.id,
  title: n.title,
  author: n.author,
  category: n.category,
  originalNoticeId: n.originalNoticeId,
  createTime: n.createTime,
  viewCount: n.viewCount,
  status: n.status,
  scheduledAt: n.scheduledAt,
  publishedAt: n.publishedAt,
});

export function buildMockNoticesBePage(
  page = 0,
  category?: string
): NoticeBePage {
  const size = 10;
  const filtered = category
    ? mockNoticesBe.filter((n) => n.category === category)
    : mockNoticesBe;
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const slice = filtered.slice(start, start + size).map(toSummary);
  return {
    notices: slice,
    page,
    size,
    totalPages,
    totalElements,
    last: page + 1 >= totalPages,
  };
}

export const mockNoticesBePage = buildMockNoticesBePage(0);
