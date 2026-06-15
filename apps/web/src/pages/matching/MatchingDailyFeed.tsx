/**
 * @file apps/web/src/pages/matching/MatchingDailyFeed.tsx
 * @description match_daily_feed 관리자 조회 화면.
 *
 *  필터: 날짜 (default = 오늘 KST) / viewerId / targetId / matchRank / slotType.
 *  PK = (feedDate, viewerId, matchRank) — 세 필드 모두 입력하면 단일 row 핀포인트.
 *  viewer/target id 클릭 → /users/:id 로 이동.
 *  tags_json 은 컬럼이 길어 "보기" → 모달.
 *
 *  ── 성능 디자인 ────────────────────────────────────────────
 *   - 첫 진입에 자동 fetch 안 함 (applied=false). [적용] 클릭 시에만 호출.
 *     COUNT(*) 풀 스캔 + JOIN 부하 피하기 위함.
 *   - [이전]/[다음] 만 (총 페이지/총 row 표시 X) — BE 가 COUNT 안 줌.
 *   - staleTime 5분 — 같은 필터 재진입 즉시.
 *   - default feedDate = KST 오늘 (UTC iso 가 아닌 'Asia/Seoul' 기준).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, RotateCcw, Search, X } from 'lucide-react'
import {
  useDailyFeed,
  formatDateTime,
} from '@ef-fe-admin/shared'
import type {
  DailyFeedItem,
  DailyFeedListParams,
  DailyFeedSlotType,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'

// KST 기준 'yyyy-MM-dd' — UTC iso 의 9시간 오차 회피.
const todayKst = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

const TODAY = todayKst()
const PAGE_SIZE = 25
const SLOT_TYPES: DailyFeedSlotType[] = ['SCORE', 'NEWBIE', 'RANDOM', 'CUSTOM_KW', 'FRESH_NEWBIE']

const SLOT_TONE: Record<DailyFeedSlotType, string> = {
  SCORE:        'bg-point/10 text-point-dark',
  NEWBIE:       'bg-success/15 text-success',
  RANDOM:       'bg-bg text-text-soft',
  CUSTOM_KW:    'bg-warn/15 text-warn',
  FRESH_NEWBIE: 'bg-danger/10 text-danger',
}

export default function MatchingDailyFeedPage() {
  // 필터 폼 입력 (적용 전 임시 상태)
  const [draftFeedDate, setDraftFeedDate] = useState(TODAY)
  const [draftViewerId, setDraftViewerId] = useState('')
  const [draftTargetId, setDraftTargetId] = useState('')
  const [draftMatchRank, setDraftRank] = useState('')
  const [draftSlot, setDraftSlot] = useState<DailyFeedSlotType | ''>('')

  // 실 fetch params — [적용] 클릭 시에만 갱신
  const [params, setParams] = useState<DailyFeedListParams>({
    feedDate: TODAY,
    page: 0,
    size: PAGE_SIZE,
  })

  // 첫 진입엔 false — 자동 fetch 차단. 사용자가 [적용] 누른 뒤부터 true 유지.
  const [applied, setApplied] = useState(false)

  const { data, isLoading, isFetching } = useDailyFeed(params, { enabled: applied })
  const [tagsModalRow, setTagsModalRow] = useState<DailyFeedItem | null>(null)

  const applyFilter = (overrides?: Partial<DailyFeedListParams>) => {
    // viewer ID 파싱 — "42" → from=42, to=42 / "42~100" 또는 "42-100" → from=42, to=100.
    // 공백 / 빈 값 / 부분 입력은 invalid 처리해 무필터로.
    const parsed = parseIdRange(draftViewerId)
    const next: DailyFeedListParams = {
      feedDate: draftFeedDate || undefined,
      viewerIdFrom: parsed?.from,
      viewerIdTo: parsed?.to,
      targetId: draftTargetId ? Number(draftTargetId) : undefined,
      matchRank: draftMatchRank ? Number(draftMatchRank) : undefined,
      slotType: draftSlot || undefined,
      page: 0,
      size: PAGE_SIZE,
      ...overrides,
    }
    setParams(next)
    setApplied(true)
  }

  const resetFilter = () => {
    setDraftFeedDate(TODAY)
    setDraftViewerId('')
    setDraftTargetId('')
    setDraftRank('')
    setDraftSlot('')
    setApplied(false)
    setParams({ feedDate: TODAY, page: 0, size: PAGE_SIZE })
  }

  const goPage = (next: number) => setParams((p) => ({ ...p, page: next }))

  return (
    <>
      <Topbar
        title="일일 피드 조회"
        subtitle="match_daily_feed — 뷰어당/날짜당 50 row. PK 는 (feedDate, viewerId, matchRank). 필터 적용 시 BE 호출."
      />

      {/* ───── 필터 카드 ───── */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterField label="날짜 (KST)">
            <input
              type="date"
              value={draftFeedDate}
              onChange={(e) => setDraftFeedDate(e.target.value)}
              className="filter-input"
            />
          </FilterField>
          <FilterField label="뷰어 ID (단일 또는 범위)">
            <input
              type="text"
              value={draftViewerId}
              onChange={(e) => setDraftViewerId(e.target.value)}
              placeholder="예: 42  또는  42~100"
              className="filter-input"
            />
          </FilterField>
          <FilterField label="타겟 ID">
            <input
              type="number"
              value={draftTargetId}
              onChange={(e) => setDraftTargetId(e.target.value)}
              placeholder="예: 88"
              className="filter-input"
              min={1}
            />
          </FilterField>
          <FilterField label="matchRank (1~50)">
            <input
              type="number"
              value={draftMatchRank}
              onChange={(e) => setDraftRank(e.target.value)}
              placeholder="예: 1"
              className="filter-input"
              min={1}
              max={50}
            />
          </FilterField>
          <FilterField label="slot 종류">
            <select
              value={draftSlot}
              onChange={(e) => setDraftSlot(e.target.value as DailyFeedSlotType | '')}
              className="filter-input"
            >
              <option value="">전체</option>
              {SLOT_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FilterField>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button className="btn btn-ghost btn-sm" onClick={resetFilter}>
            <RotateCcw size={13} /> 초기화 (오늘)
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => applyFilter()}>
            <Search size={13} /> 적용
          </button>
        </div>
      </div>

      {/* ───── 결과 카드 ───── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] text-text-soft font-bold">
            <Calendar size={12} className="inline mr-1" />
            {!applied
              ? '필터를 입력하고 [적용] 을 눌러주세요'
              : isLoading
                ? '불러오는 중...'
                : `${params.page! + 1} 페이지 · ${data?.content.length ?? 0}건`}
            {isFetching && !isLoading && <span className="ml-2 text-point">갱신 중...</span>}
          </div>
          {applied && (
            <PageNav
              page={params.page ?? 0}
              hasNext={data?.hasNext ?? false}
              onPrev={() => goPage(Math.max(0, (params.page ?? 0) - 1))}
              onNext={() => goPage((params.page ?? 0) + 1)}
              disabled={isFetching}
            />
          )}
        </div>

        {!applied ? (
          <EmptyHint />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-text-soft border-b border-divider">
                <tr className="text-left">
                  <th className="py-2 pr-3 font-extrabold">날짜</th>
                  <th className="py-2 pr-3 font-extrabold">뷰어</th>
                  <th className="py-2 pr-3 font-extrabold text-right">matchRank</th>
                  <th className="py-2 pr-3 font-extrabold">타겟</th>
                  <th className="py-2 pr-3 font-extrabold">slot</th>
                  <th className="py-2 pr-3 font-extrabold text-right">sortKey</th>
                  <th className="py-2 pr-3 font-extrabold">tags</th>
                  <th className="py-2 pr-3 font-extrabold">생성</th>
                </tr>
              </thead>
              <tbody>
                {(data?.content ?? []).map((row) => (
                  <TableRow
                    key={`${row.feedDate}-${row.viewerId}-${row.matchRank}`}
                    row={row}
                    onOpenTags={() => setTagsModalRow(row)}
                  />
                ))}
                {data && data.content.length === 0 && !isFetching && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-soft text-[12px]">
                      조건에 맞는 row 가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tagsModalRow && (
        <TagsJsonModal row={tagsModalRow} onClose={() => setTagsModalRow(null)} />
      )}

      <style>{`
        .filter-input {
          width: 100%;
          font-size: 12.5px;
          border-radius: 8px;
          border: 1px solid var(--color-divider);
          background: var(--color-bg);
          padding: 6px 10px;
          outline: none;
        }
        .filter-input:focus { border-color: var(--color-point); }
      `}</style>
    </>
  )
}

/* ───────── 빈 화면 안내 ───────── */

function EmptyHint() {
  return (
    <div className="py-16 text-center">
      <div className="text-[36px] mb-2">🔎</div>
      <div className="text-[13px] font-extrabold mb-1">필터를 입력하고 [적용] 을 눌러주세요</div>
      <div className="text-[11.5px] text-text-soft leading-relaxed">
        match_daily_feed 는 row 수가 큰 테이블이라 자동 조회는 끄고 있어요.<br />
        viewer ID 만 입력해도 50 row 가 즉시 조회됩니다. 범위는 <code>42~100</code> 으로.
      </div>
    </div>
  )
}

/**
 * "42" → { from: 42, to: 42 } (단일)
 * "42~100" / "42-100" → { from: 42, to: 100 } (범위)
 * 그 외 / 빈 값 / 부분 입력 → null (무필터)
 */
function parseIdRange(raw: string): { from: number; to: number } | null {
  const v = raw.trim()
  if (!v) return null

  // 범위 — '~' 또는 '-' 구분
  const sep = v.includes('~') ? '~' : v.includes('-') ? '-' : null
  if (sep) {
    const [a, b] = v.split(sep).map((s) => s.trim())
    if (!a || !b) return null
    const from = Number(a)
    const to = Number(b)
    if (!Number.isFinite(from) || !Number.isFinite(to)) return null
    return from <= to ? { from, to } : { from: to, to: from }
  }

  // 단일
  const single = Number(v)
  if (!Number.isFinite(single)) return null
  return { from: single, to: single }
}

/* ───────── 1행 ───────── */

function TableRow({
  row,
  onOpenTags,
}: {
  row: DailyFeedItem
  onOpenTags: () => void
}) {
  const navigate = useNavigate()
  return (
    <tr className="border-b border-divider/60 hover:bg-bg/50">
      <td className="py-2 pr-3 font-mono">{row.feedDate}</td>
      <td className="py-2 pr-3">
        <UserLink id={row.viewerId} nickname={row.viewerNickname} onClick={() => navigate(`/users/${row.viewerId}`)} />
      </td>
      <td className="py-2 pr-3 text-right font-extrabold">{row.matchRank}</td>
      <td className="py-2 pr-3">
        <UserLink id={row.targetId} nickname={row.targetNickname} onClick={() => navigate(`/users/${row.targetId}`)} />
      </td>
      <td className="py-2 pr-3">
        <span className={`badge ${SLOT_TONE[row.slotType] ?? ''}`}>{row.slotType}</span>
      </td>
      <td className="py-2 pr-3 text-right font-mono">{Number(row.sortKey).toFixed(4)}</td>
      <td className="py-2 pr-3">
        <button
          className="text-point-dark font-bold hover:underline text-[11.5px]"
          onClick={onOpenTags}
        >
          보기
        </button>
      </td>
      <td className="py-2 pr-3 text-text-soft">{formatDateTime(row.createdAt)}</td>
    </tr>
  )
}

function UserLink({
  id,
  nickname,
  onClick,
}: {
  id: number
  nickname: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left hover:underline"
      title="사용자 상세로 이동"
    >
      <span className="text-text-soft text-[11px]">#{id}</span>{' '}
      <span className="font-extrabold">{nickname}</span>
    </button>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="text-[10.5px] font-extrabold mb-1 text-text-soft">{label}</div>
      {children}
    </label>
  )
}

function PageNav({
  page,
  hasNext,
  onPrev,
  onNext,
  disabled,
}: {
  page: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <button
        className="btn btn-ghost btn-xs"
        onClick={onPrev}
        disabled={disabled || page <= 0}
      >
        이전
      </button>
      <span className="text-text-soft font-bold">{page + 1}</span>
      <button
        className="btn btn-ghost btn-xs"
        onClick={onNext}
        disabled={disabled || !hasNext}
      >
        다음
      </button>
    </div>
  )
}

/* ───────── tags_json 모달 ───────── */

function TagsJsonModal({
  row,
  onClose,
}: {
  row: DailyFeedItem
  onClose: () => void
}) {
  let pretty = row.tagsJson
  try {
    pretty = JSON.stringify(JSON.parse(row.tagsJson), null, 2)
  } catch {
    /* parse 실패 시 원문 그대로 */
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,39,48,0.5)] backdrop-blur-sm animate-[fadeIn_0.18s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-lg p-5 w-full max-w-[560px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[15px] font-extrabold">tags_json</div>
            <div className="text-[11.5px] text-text-soft font-bold mt-0.5">
              {row.feedDate} · viewer #{row.viewerId} · matchRank {row.matchRank} · target #{row.targetId}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-soft hover:text-text-strong p-1"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>
        <pre className="text-[11.5px] font-mono bg-bg rounded-lg p-3 max-h-[400px] overflow-auto whitespace-pre-wrap leading-relaxed">
          {pretty}
        </pre>
        <div className="flex justify-end mt-3">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
