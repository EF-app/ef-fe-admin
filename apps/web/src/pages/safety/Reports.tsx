import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseInt0, useUrlFilters } from '../../hooks/useUrlFilters'
import { useScrollRestoration } from '../../hooks/useScrollRestoration'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import {
  useReportsGrouped,
  formatDateTime,
  formatFromNow,
  REPORT_STATUS,
  REPORT_TARGET_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import type { ReportStatus, ReportTargetType, ReportGroup } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { ReportStatusBadge, Badge } from '../../components/ui/Badge'

const STATUS_OPTIONS: { value: ReportStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: REPORT_STATUS.PENDING, label: '대기 중' },
  { value: REPORT_STATUS.PROCESSED, label: '처리됨' },
  { value: REPORT_STATUS.DISMISSED, label: '기각됨' },
]

const TARGET_OPTIONS: { value: ReportTargetType | undefined; label: string }[] = [
  { value: undefined, label: '전체 대상' },
  { value: 'POST_IT', label: '포스트잇' },
  { value: 'BAL_COMMENT', label: '게임 댓글' },
  { value: 'PROFILE', label: '프로필' },
  { value: 'CHAT', label: '채팅' },
  { value: 'CHAT_IMAGE', label: '채팅 이미지' },
]

const SORT_OPTIONS: { value: 'LATEST' | 'OLDEST' | 'MOST_REPORTED'; label: string }[] = [
  { value: 'LATEST', label: '최신순' },
  { value: 'OLDEST', label: '오래된순' },
  { value: 'MOST_REPORTED', label: '신고건수많은순' },
]

function groupKey(g: ReportGroup) {
  return `${g.target_type}-${g.target_id}`
}

/**
 * 그룹 헤더에서 "콘텐츠 보기" 버튼이 가리킬 라우트.
 * 어드민은 모두 BIGINT id 기반 — uuid 사용 안 함.
 *
 * - PROFILE: target_user_id (= target_id) 로 유저 상세
 * - POST_IT: 포스트잇 목록 (개별 강조는 추후 list 페이지에 highlightId 도입 시)
 * - BAL_COMMENT: 부모 게임의 댓글 페이지 — BE 가 내려준 bal_game_id 사용
 * - CHAT / CHAT_IMAGE: 어드민에 채팅 화면 없음 → 콘텐츠 버튼 없음
 */
function getContentLink(g: ReportGroup): { href: string; label: string } | null {
  if (g.target_type === 'PROFILE') {
    // BE enrich 의 target_user_id 사용 (admin /users/{id} 라우트 정합)
    const userId = g.target_user_id ?? g.reports.find((r) => r.target_user_id)?.target_user_id
    return userId ? { href: `/users/${userId}`, label: '프로필 보기' } : null
  }
  if (g.target_type === 'POST_IT')
    return { href: `/post-its?focus=${g.target_id}`, label: '포스트잇 보기' }
  if (g.target_type === 'BAL_COMMENT') {
    // BAL_COMMENT 신고의 부모 게임 id 사용 + 신고당한 댓글로 자동 스크롤되도록 focus 전달
    const firstWithGame = g.reports.find((r) => r.bal_game_id != null)
    const gameId = firstWithGame?.bal_game_id
    return gameId != null
      ? { href: `/balance/${gameId}/comments?focus=${g.target_id}`, label: '게임 댓글 보기' }
      : { href: '/balance', label: '게임 목록' }
  }
  return null
}

/** PROFILE 외 타입에서 따로 "작성자 프로필" 점프가 가능한 경우. */
function getTargetUserLink(g: ReportGroup): string | null {
  if (g.target_type === 'PROFILE') return null
  // BE enrich 의 target_user_id 사용
  const userId = g.target_user_id ?? g.reports.find((r) => r.target_user_id)?.target_user_id
  return userId ? `/users/${userId}` : null
}

/**
 * 그룹의 처리 결과 한 줄로 — 헤더 우측 표기용.
 * - pending 이 있으면 "대기 N"
 * - 모두 처리되었고 첫 신고에 suspension_id 있으면 "제재 #N"
 * - 모두 기각/처리됐지만 suspension 없으면 "처리 완료"
 */
function resolveGroupOutcome(g: ReportGroup):
  | { kind: 'pending'; count: number }
  | { kind: 'suspended'; suspensionId: number }
  | { kind: 'dismissed' }
  | { kind: 'processed' } {
  if (g.pending_count > 0) return { kind: 'pending', count: g.pending_count }
  // 평탄화 정책 — 같은 그룹의 모든 PROCESSED 신고에 동일 suspension_id 부여됨.
  const processed = g.reports.find(
    (r) => r.status === 'PROCESSED' && r.suspension_id != null,
  )
  if (processed) {
    return { kind: 'suspended', suspensionId: processed.suspension_id! }
  }
  const anyDismissed = g.reports.some((r) => r.status === 'DISMISSED')
  if (anyDismissed && !g.reports.some((r) => r.status === 'PROCESSED'))
    return { kind: 'dismissed' }
  return { kind: 'processed' }
}

export default function ReportsPage() {
  useScrollRestoration()
  const navigate = useNavigate()
  const [filters, setFilters] = useUrlFilters<{
    status: ReportStatus | undefined
    target: ReportTargetType | undefined
    sort: 'LATEST' | 'OLDEST' | 'MOST_REPORTED'
    page: number
  }>({
    status: { default: 'PENDING' as ReportStatus | undefined },
    target: { default: undefined },
    sort: { default: 'OLDEST' },
    page: { default: 0, parse: parseInt0 },
  })
  const { status, target, sort, page } = filters
  const setStatus = (v: ReportStatus | undefined) => setFilters({ status: v, page: 0 })
  const setTarget = (v: ReportTargetType | undefined) => setFilters({ target: v, page: 0 })
  const setSort = (v: 'LATEST' | 'OLDEST' | 'MOST_REPORTED') => setFilters({ sort: v, page: 0 })
  const setPage = (p: number) => setFilters({ page: p })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, isLoading } = useReportsGrouped({
    status,
    target_type: target,
    sort,
    page,
    size: 15,
  })

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <>
      <Topbar
        title="신고 내역"
        subtitle="같은 대상에 묶인 신고는 한 건수로 표시"
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
          <FilterChips
            value={target}
            onChange={setTarget}
            options={TARGET_OPTIONS}
          />
          <FilterChips
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="card p-10 text-center text-text-soft text-[12px]">
            불러오는 중...
          </div>
        ) : !data?.content?.length ? (
          <div className="card">
            <EmptyState title="신고 그룹이 없습니다." />
          </div>
        ) : (
          data.content.map((g) => {
            const key = groupKey(g)
            const isOpen = expanded.has(key)
            const reps = g.reports
            const targetLabel = REPORT_TARGET_TYPE_LABEL[g.target_type]
            const contentLink = getContentLink(g)
            const targetUserLink = getTargetUserLink(g)
            const outcome = resolveGroupOutcome(g)
            return (
              <div key={key} className="card p-0 overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggle(key)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg/50 transition cursor-pointer select-none"
                >
                  <span
                    className={`inline-block transition-transform text-text-soft text-[10px] ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                  <Badge tone="point">{targetLabel}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {g.target_user_id != null && (
                        <span className="text-text-soft text-[11px]">
                          #{g.target_user_id}
                        </span>
                      )}
                      {g.target_user_login_id && (
                        <span className="text-text-soft text-[11px]">
                          #{g.target_user_login_id}
                        </span>
                      )}
                      <span className="font-extrabold text-[13.5px]">
                        @{g.target_user_nickname ?? '-'}
                      </span>
                    </div>
                    {g.target_preview && (
                      <div className="text-text-sub text-[12px] line-clamp-1 mt-0.5">
                        {g.target_preview}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {contentLink && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(contentLink.href)
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-bold text-text-sub hover:bg-bg"
                      >
                        <ExternalLink size={11} />
                        {contentLink.label}
                      </button>
                    )}
                    {targetUserLink && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(targetUserLink)
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-bold text-text-sub hover:bg-bg"
                      >
                        <ExternalLink size={11} />
                        작성자 프로필
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {outcome.kind === 'pending' && (
                      <Badge tone="warn">대기 {outcome.count}</Badge>
                    )}
                    {outcome.kind === 'suspended' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/suspensions/${outcome.suspensionId}`)
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10.5px] font-extrabold text-success-dark hover:opacity-80"
                      >
                        <ShieldCheck size={11} />
                        제재 #{outcome.suspensionId}
                      </button>
                    )}
                    {outcome.kind === 'dismissed' && (
                      <Badge tone="neutral">기각됨</Badge>
                    )}
                    {outcome.kind === 'processed' && (
                      <Badge tone="normal">처리 완료</Badge>
                    )}
                    <Badge tone="normal">총 {g.total_count}건</Badge>
                  </div>

                  <div className="text-right shrink-0 ml-3 leading-tight">
                    <div className="text-[11px] text-text-soft">
                      첫 신고 · {formatFromNow(g.first_reported_at)}
                    </div>
                    {g.total_count > 1 && (
                      <div className="text-[11px] text-text-soft">
                        마지막 · {formatFromNow(g.last_reported_at)}
                      </div>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-bg/40">
                    {g.target_preview && (
                      <div className="px-4 py-3 border-b border-border bg-surface">
                        <div className="text-[10.5px] font-extrabold text-text-soft mb-1.5 tracking-wide">
                          신고된 {targetLabel} 내용
                        </div>
                        <div className="text-[13px] text-text whitespace-pre-wrap break-words leading-relaxed bg-bg rounded-md px-3 py-2 border border-border">
                          {g.target_preview}
                        </div>
                      </div>
                    )}
                    <table className="data-table min-w-[760px]">
                      <thead>
                        <tr>
                          <th className="w-[36px]">#</th>
                          <th>신고자</th>
                          <th>사유</th>
                          <th>상태</th>
                          <th>접수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reps.map((r, idx) => {
                          return (
                            <tr
                              key={r.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/reports/${r.id}`)}
                            >
                              <td className="text-text-soft">{idx + 1}</td>
                              <td>
                                <span className="font-bold">
                                  {r.reporter_nickname ?? '(탈퇴)'}
                                </span>
                              </td>
                              <td className="text-text-sub">
                                <div className="line-clamp-1 max-w-[260px]">
                                  {r.reason ?? '-'}
                                </div>
                              </td>
                              <td>
                                <ReportStatusBadge status={r.status} />
                              </td>
                              <td className="text-text-sub text-[11px]">
                                {formatDateTime(r.create_time)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}
