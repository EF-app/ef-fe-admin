import { useState } from 'react'
import {
  useBalApplies,
  useBalGames,
  useBalGameStats,
  useApproveBalApplyMutation,
  useRejectBalApplyMutation,
  useHideBalGameMutation,
  usePublishBalGameMutation,
  useScheduleBalGameMutation,
  useArchiveBalGameMutation,
  useCreateBalGameMutation,
  useUpdateBalGameMutation,
  formatDateTime,
  formatDate,
  formatNumber,
  BAL_APPLY_STATUS,
  BAL_GAME_STATUS,
  BAL_CATEGORIES,
  BAL_CATEGORY_MAP,
  validators,
} from '@ef-fe-admin/shared'
import type {
  BalApplyStatus,
  BalGameStatus,
  BalApply,
  BalGame,
  BalGameSort,
  BalGameUpsertRequest,
} from '@ef-fe-admin/shared'
import { Plus } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import FilterChips from '../components/ui/FilterChips'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import { BalGameStatusBadge, BalApplyStatusBadge, Badge } from '../components/ui/Badge'

type Tab = 'applies' | 'games' | 'stats'

export default function BalanceGamesPage() {
  const [tab, setTab] = useState<Tab>('applies')
  const [editTarget, setEditTarget] = useState<BalGame | null>(null)
  const [composeFromApply, setComposeFromApply] = useState<BalApply | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)

  const openCompose = () => {
    setEditTarget(null)
    setComposeFromApply(null)
    setComposeOpen(true)
  }
  const openEdit = (g: BalGame) => {
    setEditTarget(g)
    setComposeFromApply(null)
    setComposeOpen(true)
  }
  const openFromApply = (a: BalApply) => {
    setEditTarget(null)
    setComposeFromApply(a)
    setComposeOpen(true)
  }
  const closeCompose = () => {
    setComposeOpen(false)
    setEditTarget(null)
    setComposeFromApply(null)
  }

  return (
    <>
      <Topbar title="밸런스 게임 운영" subtitle="유저 신청 검토 · 게시 관리 · 통계 확인" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <TabBtn active={tab === 'applies'} onClick={() => setTab('applies')}>
            신청 큐
          </TabBtn>
          <TabBtn active={tab === 'games'} onClick={() => setTab('games')}>
            밸런스 게임 목록
          </TabBtn>
          <TabBtn active={tab === 'stats'} onClick={() => setTab('stats')}>
            통계
          </TabBtn>
        </div>
        {tab === 'games' && (
          <button className="btn btn-primary" onClick={openCompose}>
            <Plus size={14} />
            새 게임 작성
          </button>
        )}
      </div>

      {tab === 'applies' && <ApplyQueue onApproveEdit={openFromApply} />}
      {tab === 'games' && <GameList onEdit={openEdit} />}
      {tab === 'stats' && <StatsPanel />}

      {composeOpen && (
        <ComposeModal
          game={editTarget}
          fromApply={composeFromApply}
          onClose={closeCompose}
        />
      )}
    </>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-[13px] font-extrabold transition border ${
        active
          ? 'bg-point text-white border-point'
          : 'bg-surface text-text-sub border-border-strong hover:bg-point-softer hover:text-point-dark'
      }`}
    >
      {children}
    </button>
  )
}

/* ---------- Apply Queue ---------- */
function ApplyQueue({ onApproveEdit }: { onApproveEdit: (a: BalApply) => void }) {
  const [status, setStatus] = useState<BalApplyStatus | undefined>('PENDING')
  const [page, setPage] = useState(0)
  const [rejectTarget, setRejectTarget] = useState<BalApply | null>(null)

  const { data, isLoading } = useBalApplies({ status, page, size: 10 })
  const pendingCount = useBalApplies({ status: 'PENDING', page: 0, size: 1 }).data?.totalElements

  return (
    <>
      <FilterChips
        value={status}
        onChange={(v) => {
          setStatus(v)
          setPage(0)
        }}
        options={[
          { value: undefined, label: '전체' },
          { value: BAL_APPLY_STATUS.PENDING, label: '대기 중', count: pendingCount },
          { value: BAL_APPLY_STATUS.APPROVED, label: '승인됨' },
          { value: BAL_APPLY_STATUS.REJECTED, label: '반려됨' },
        ]}
      />
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState icon="📭" title="해당 상태의 신청이 없습니다." />
        ) : (
          data.content.map((a) => (
            <ApplyCard
              key={a.id}
              apply={a}
              onReject={() => setRejectTarget(a)}
              onApproveEdit={() => onApproveEdit(a)}
            />
          ))
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {rejectTarget && (
        <RejectApplyModal apply={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}
    </>
  )
}

function ApplyCard({
  apply,
  onReject,
  onApproveEdit,
}: {
  apply: BalApply
  onReject: () => void
  onApproveEdit: () => void
}) {
  const approve = useApproveBalApplyMutation()
  const category = apply.category_id ? BAL_CATEGORY_MAP[apply.category_id] : null

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <BalApplyStatusBadge status={apply.status} />
            {category && (
              <Badge tone="point">
                {category.emoji} {category.name}
              </Badge>
            )}
            <span className="text-[11px] text-text-soft">
              @{apply.user_nickname ?? '(탈퇴 유저)'} · {formatDateTime(apply.create_time)}
            </span>
          </div>
          {apply.description && (
            <div className="text-[13px] text-text-sub mb-3">{apply.description}</div>
          )}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
            <div className="bg-point-softer rounded-md p-3 border border-point-soft">
              <div className="text-[11px] font-extrabold text-point-dark mb-1">A</div>
              <div className="text-[14px] font-bold text-text">{apply.option_a}</div>
            </div>
            <div className="flex items-center justify-center text-text-soft font-black text-[12px]">
              VS
            </div>
            <div className="bg-point-softer rounded-md p-3 border border-point-soft">
              <div className="text-[11px] font-extrabold text-point-dark mb-1">B</div>
              <div className="text-[14px] font-bold text-text">{apply.option_b}</div>
            </div>
          </div>
          {apply.admin_memo && apply.status === 'REJECTED' && (
            <div className="mt-3 bg-danger-soft rounded-md px-3 py-2 text-[12px] text-danger">
              반려 사유: {apply.admin_memo}
            </div>
          )}
        </div>
        {apply.status === 'PENDING' && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => approve.mutate(apply.id, { onSuccess: onApproveEdit })}
              disabled={approve.isPending}
            >
              승인 → 초안
            </button>
            <button className="btn btn-danger btn-sm" onClick={onReject}>
              반려
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RejectApplyModal({ apply, onClose }: { apply: BalApply; onClose: () => void }) {
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useRejectBalApplyMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    const check = validators.rejectionReason(memo)
    if (!check.valid) return setError(check.message ?? '')
    mutation.mutate({ id: apply.id, payload: { admin_memo: memo } })
  }

  return (
    <Modal open onClose={onClose} title="신청 반려">
      <div className="space-y-3">
        <div className="text-[12.5px] text-text-sub">
          @{apply.user_nickname} / A. {apply.option_a} vs B. {apply.option_b}
        </div>
        <div>
          <label className="form-label">반려 사유</label>
          <textarea
            className="form-textarea"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="신청자가 확인할 수 있도록 구체적으로 작성해주세요."
          />
        </div>
        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            반려하기
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Game List ---------- */
function GameList({ onEdit }: { onEdit: (g: BalGame) => void }) {
  const [status, setStatus] = useState<BalGameStatus | undefined>(undefined)
  const [category, setCategory] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState<BalGameSort>('LATEST')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useBalGames({
    status,
    category_id: category,
    sort,
    page,
    size: 10,
  })

  const hide = useHideBalGameMutation()
  const publish = usePublishBalGameMutation()
  const archive = useArchiveBalGameMutation()

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <FilterChips
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(0)
          }}
          options={[
            { value: undefined, label: '전체' },
            { value: BAL_GAME_STATUS.DRAFT, label: '작성 중' },
            { value: BAL_GAME_STATUS.SCHEDULED, label: '예약' },
            { value: BAL_GAME_STATUS.PUBLISHED, label: '게시됨' },
            { value: BAL_GAME_STATUS.HIDDEN, label: '숨김' },
            { value: BAL_GAME_STATUS.ARCHIVED, label: '보관' },
          ]}
        />
        <div className="flex items-center gap-2">
          <select
            className="form-input !py-1.5 !text-[12px] w-[120px]"
            value={category ?? ''}
            onChange={(e) => {
              setCategory(e.target.value ? Number(e.target.value) : undefined)
              setPage(0)
            }}
          >
            <option value="">모든 카테고리</option>
            {BAL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <select
            className="form-input !py-1.5 !text-[12px] w-[110px]"
            value={sort}
            onChange={(e) => setSort(e.target.value as BalGameSort)}
          >
            <option value="LATEST">최신순</option>
            <option value="VOTES">투표수순</option>
            <option value="COMMENTS">댓글순</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-[60px]">ID</th>
              <th>질문</th>
              <th className="w-[120px]">카테고리</th>
              <th className="w-[90px]">상태</th>
              <th className="w-[150px]">투표 (A / B)</th>
              <th className="w-[80px]">댓글</th>
              <th className="w-[130px]">게시/예약</th>
              <th className="w-[160px]">액션</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center text-text-soft py-10">
                  불러오는 중...
                </td>
              </tr>
            ) : !data?.content?.length ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <EmptyState icon="🎲" title="게임이 없습니다." />
                </td>
              </tr>
            ) : (
              data.content.map((g) => (
                <GameRow
                  key={g.uuid}
                  game={g}
                  onEdit={() => onEdit(g)}
                  onHide={() => hide.mutate(g.uuid)}
                  onPublish={() => publish.mutate(g.uuid)}
                  onArchive={() => archive.mutate(g.uuid)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}

function GameRow({
  game,
  onEdit,
  onHide,
  onPublish,
  onArchive,
}: {
  game: BalGame
  onEdit: () => void
  onHide: () => void
  onPublish: () => void
  onArchive: () => void
}) {
  const total = game.a_count + game.b_count
  const aRatio = total > 0 ? Math.round((game.a_count / total) * 100) : 0
  const category = game.category_id ? BAL_CATEGORY_MAP[game.category_id] : null
  const subtitle = game.option_a && game.option_b ? `A. ${game.option_a} vs B. ${game.option_b}` : ''

  return (
    <tr>
      <td className="text-text-soft">#{game.id}</td>
      <td>
        <div className="font-extrabold text-text">{game.description ?? subtitle}</div>
        {game.description && (
          <div className="text-[11px] text-text-soft mt-0.5 truncate max-w-[340px]">
            {subtitle}
          </div>
        )}
      </td>
      <td>
        {category ? (
          <span className="text-[12px] text-text-sub">
            {category.emoji} {category.name}
          </span>
        ) : (
          <span className="text-text-soft">—</span>
        )}
      </td>
      <td>
        <BalGameStatusBadge status={game.status} />
      </td>
      <td>
        {total > 0 ? (
          <div>
            <div className="flex items-center gap-1 text-[11.5px] font-extrabold">
              <span className="text-point-dark">{aRatio}%</span>
              <span className="text-text-soft">/</span>
              <span className="text-text-sub">{100 - aRatio}%</span>
            </div>
            <div className="text-[10.5px] text-text-soft">
              {formatNumber(game.a_count)} · {formatNumber(game.b_count)}
            </div>
          </div>
        ) : (
          <span className="text-text-soft text-[11.5px]">—</span>
        )}
      </td>
      <td className="text-text-sub">{formatNumber(game.comment_count)}</td>
      <td className="text-[11.5px] text-text-sub">
        {game.status === 'SCHEDULED' && game.scheduled_at
          ? formatDate(game.scheduled_at)
          : game.published_at
          ? formatDate(game.published_at)
          : '—'}
      </td>
      <td>
        <div className="flex gap-1.5 flex-wrap">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>
            편집
          </button>
          {game.status === 'PUBLISHED' && (
            <button className="btn btn-danger btn-sm" onClick={onHide}>
              숨김
            </button>
          )}
          {(game.status === 'DRAFT' || game.status === 'HIDDEN') && (
            <button className="btn btn-success btn-sm" onClick={onPublish}>
              게시
            </button>
          )}
          {(game.status === 'HIDDEN' || game.status === 'ARCHIVED') && (
            <button className="btn btn-ghost btn-sm" onClick={onArchive}>
              종료
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ---------- Stats ---------- */
function StatsPanel() {
  const { data, isLoading } = useBalGameStats()

  if (isLoading || !data) {
    return <div className="p-10 text-center text-text-soft">불러오는 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="총 게임 수" value={formatNumber(data.total_count)} />
        <MetricCard
          label="공개 중"
          value={formatNumber(data.published_count)}
          sub={`예약 ${data.scheduled_count} · 숨김 ${data.hidden_count}`}
        />
        <MetricCard label="누적 투표" value={formatNumber(data.total_votes)} />
        <MetricCard label="누적 댓글" value={formatNumber(data.total_comments)} />
      </div>

      <div className="card">
        <div className="section-title !mt-0">카테고리별 현황</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>카테고리</th>
              <th className="w-[100px]">게임 수</th>
              <th className="w-[140px]">투표 수</th>
              <th>편향도 (0~1)</th>
            </tr>
          </thead>
          <tbody>
            {data.category_breakdown.map((row) => {
              const biasPercent = Math.round(row.bias * 100)
              const tone =
                row.bias >= 0.25 ? 'bg-danger' : row.bias >= 0.15 ? 'bg-warn' : 'bg-success'
              const category = BAL_CATEGORY_MAP[row.category_id]
              return (
                <tr key={row.category_id}>
                  <td className="font-extrabold">
                    {category?.emoji} {row.category_name}
                  </td>
                  <td>{formatNumber(row.game_count)}</td>
                  <td>{formatNumber(row.vote_count)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full ${tone}`}
                          style={{ width: `${Math.min(biasPercent * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11.5px] font-extrabold text-text-sub w-10 text-right">
                        {row.bias.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="card">
      <div className="text-[11.5px] text-text-sub font-extrabold">{label}</div>
      <div className="text-[26px] font-black text-text mt-2">{value}</div>
      {sub && <div className="text-[11px] text-text-soft mt-1">{sub}</div>}
    </div>
  )
}

/* ---------- Compose / Edit Modal ---------- */
interface ComposeState {
  option_a: string
  option_a_desc: string
  option_b: string
  option_b_desc: string
  description: string
  category_id: number
  status: BalGameStatus
  scheduled_at: string
  applicant_id: number | null
}

function ComposeModal({
  game,
  fromApply,
  onClose,
}: {
  game: BalGame | null
  fromApply: BalApply | null
  onClose: () => void
}) {
  const editing = !!game
  const [form, setForm] = useState<ComposeState>(() => {
    if (game) {
      return {
        option_a: game.option_a,
        option_a_desc: game.option_a_desc ?? '',
        option_b: game.option_b,
        option_b_desc: game.option_b_desc ?? '',
        description: game.description ?? '',
        category_id: game.category_id ?? 2,
        status: game.status,
        scheduled_at: game.scheduled_at ? toInputDateTime(game.scheduled_at) : '',
        applicant_id: game.applicant_id,
      }
    }
    if (fromApply) {
      return {
        option_a: fromApply.option_a,
        option_a_desc: '',
        option_b: fromApply.option_b,
        option_b_desc: '',
        description: fromApply.description ?? '',
        category_id: fromApply.category_id ?? 2,
        status: 'DRAFT',
        scheduled_at: '',
        applicant_id: fromApply.user_id,
      }
    }
    return {
      option_a: '',
      option_a_desc: '',
      option_b: '',
      option_b_desc: '',
      description: '',
      category_id: 2,
      status: 'DRAFT',
      scheduled_at: '',
      applicant_id: null,
    }
  })
  const [error, setError] = useState<string | null>(null)

  const create = useCreateBalGameMutation({ onSuccess: onClose, onError: (e) => setError(e.message) })
  const update = useUpdateBalGameMutation({ onSuccess: onClose, onError: (e) => setError(e.message) })

  const isPending = create.isPending || update.isPending
  const category = BAL_CATEGORY_MAP[form.category_id]

  const handleSubmit = () => {
    setError(null)
    if (!form.option_a.trim()) return setError('A 선택지를 입력해주세요.')
    if (!form.option_b.trim()) return setError('B 선택지를 입력해주세요.')
    if (form.status === 'SCHEDULED' && !form.scheduled_at)
      return setError('예약 게시 시각을 입력해주세요.')

    const payload: BalGameUpsertRequest = {
      option_a: form.option_a.trim(),
      option_a_desc: form.option_a_desc.trim() || null,
      option_b: form.option_b.trim(),
      option_b_desc: form.option_b_desc.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id,
      status: form.status,
      scheduled_at:
        form.status === 'SCHEDULED' && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      applicant_id: form.applicant_id,
    }

    if (editing && game) {
      update.mutate({ uuid: game.uuid, payload })
    } else {
      create.mutate(payload)
    }
  }

  const total = game ? game.a_count + game.b_count : 0
  const aRatio = total > 0 ? Math.round((game!.a_count / total) * 100) : 0

  return (
    <Modal open onClose={onClose} title={editing ? '밸런스 게임 편집' : '새 밸런스 게임 작성'} maxWidth={880}>
      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {fromApply && (
            <div className="bg-point-softer rounded-md px-3 py-2 text-[12px] text-point-dark">
              💌 신청자 <b>@{fromApply.user_nickname}</b> 의 신청 내용이 반영되었습니다.
            </div>
          )}

          <div>
            <label className="form-label">카테고리</label>
            <select
              className="form-input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
            >
              {BAL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[1fr_24px_1fr] gap-3 items-start">
            <div className="space-y-2">
              <label className="form-label">A 선택지 *</label>
              <input
                className="form-input"
                value={form.option_a}
                maxLength={255}
                onChange={(e) => setForm({ ...form, option_a: e.target.value })}
                placeholder="예: 여름 바다"
              />
              <textarea
                className="form-textarea !min-h-[80px]"
                value={form.option_a_desc}
                maxLength={255}
                onChange={(e) => setForm({ ...form, option_a_desc: e.target.value })}
                placeholder="A에 대한 설명 (선택)"
              />
            </div>
            <div className="flex items-center justify-center h-[44px] text-text-soft font-black text-[14px]">
              VS
            </div>
            <div className="space-y-2">
              <label className="form-label">B 선택지 *</label>
              <input
                className="form-input"
                value={form.option_b}
                maxLength={255}
                onChange={(e) => setForm({ ...form, option_b: e.target.value })}
                placeholder="예: 겨울 눈밭"
              />
              <textarea
                className="form-textarea !min-h-[80px]"
                value={form.option_b_desc}
                maxLength={255}
                onChange={(e) => setForm({ ...form, option_b_desc: e.target.value })}
                placeholder="B에 대한 설명 (선택)"
              />
            </div>
          </div>

          <div>
            <label className="form-label">배경 설명</label>
            <textarea
              className="form-textarea"
              value={form.description}
              maxLength={500}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="이 게임의 배경 설명을 작성해주세요. (선택)"
            />
            <div className="text-[10.5px] text-text-soft text-right mt-1">
              {form.description.length} / 500
            </div>
          </div>

          <div>
            <label className="form-label">게시 상태</label>
            <div className="flex flex-wrap gap-2">
              {(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'] as BalGameStatus[]).map(
                (s) => (
                  <label
                    key={s}
                    className={`chip cursor-pointer ${form.status === s ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="compose-status"
                      className="hidden"
                      checked={form.status === s}
                      onChange={() => setForm({ ...form, status: s })}
                    />
                    <BalGameStatusBadge status={s} />
                  </label>
                )
              )}
            </div>
          </div>

          {form.status === 'SCHEDULED' && (
            <div>
              <label className="form-label">예약 게시 시각</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
          )}

          {editing && game && total > 0 && (
            <div className="card !p-4 bg-surface-alt">
              <div className="text-[11.5px] font-extrabold text-text-sub mb-2">투표 현황</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-point" style={{ width: `${aRatio}%` }} />
                </div>
                <span className="text-[11.5px] font-extrabold">
                  {aRatio}% / {100 - aRatio}%
                </span>
              </div>
              <div className="text-[11px] text-text-soft">
                A {formatNumber(game.a_count)}표 · B {formatNumber(game.b_count)}표 · 댓글{' '}
                {formatNumber(game.comment_count)}
              </div>
              <div className="text-[10.5px] text-text-soft mt-1">버전 v{game.version}</div>
            </div>
          )}

          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
        </div>

        <PreviewCard
          category={category}
          option_a={form.option_a}
          option_a_desc={form.option_a_desc}
          option_b={form.option_b}
          option_b_desc={form.option_b_desc}
          description={form.description}
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button className="btn btn-secondary" onClick={onClose}>
          취소
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
          {editing ? '변경 저장' : '게임 생성'}
        </button>
      </div>
    </Modal>
  )
}

function PreviewCard({
  category,
  option_a,
  option_a_desc,
  option_b,
  option_b_desc,
  description,
}: {
  category?: { emoji: string; name: string }
  option_a: string
  option_a_desc: string
  option_b: string
  option_b_desc: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11.5px] font-extrabold text-text-sub">앱 미리보기</div>
      <div className="rounded-2xl border border-border bg-surface-alt p-4 shadow-sm">
        {category && (
          <div className="inline-flex items-center gap-1 rounded-full bg-point-soft text-point-dark px-2.5 py-0.5 text-[11px] font-bold mb-3">
            {category.emoji} {category.name}
          </div>
        )}
        {description && (
          <div className="text-[12.5px] text-text-sub mb-3">{description}</div>
        )}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div className="bg-surface rounded-xl p-3 border border-border min-h-[100px]">
            <div className="text-[10.5px] font-extrabold text-point-dark mb-1">A</div>
            <div className="text-[13px] font-extrabold text-text">{option_a || '—'}</div>
            {option_a_desc && (
              <div className="text-[10.5px] text-text-soft mt-1">{option_a_desc}</div>
            )}
          </div>
          <div className="w-7 h-7 rounded-full bg-point text-white flex items-center justify-center font-black text-[11px] shadow-sm">
            VS
          </div>
          <div className="bg-surface rounded-xl p-3 border border-border min-h-[100px]">
            <div className="text-[10.5px] font-extrabold text-point-dark mb-1">B</div>
            <div className="text-[13px] font-extrabold text-text">{option_b || '—'}</div>
            {option_b_desc && (
              <div className="text-[10.5px] text-text-soft mt-1">{option_b_desc}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function toInputDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}
