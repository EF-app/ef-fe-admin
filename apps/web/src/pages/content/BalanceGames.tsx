import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileEdit, Inbox, CheckCircle2, XCircle, Hash, MessageCircle } from 'lucide-react'
import {
  useBalAppliesBe,
  useDecideBalApplyMutation,
  useBalGamesBe,
  formatDateTime,
  formatNumber,
  BAL_BE_CATEGORIES,
  BAL_GAME_BE_STATUS_LABEL,
  BAL_APPLY_BE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  BalApplyBe,
  BalApplyBeStatus,
  BalBeCategory,
  BalGameBeStatus,
  BalGameBeSummary,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

type Tab = 'list' | 'queue'

const APPLY_STATUS_OPTIONS: { value: BalApplyBeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '반려됨' },
]

const GAME_STATUS_OPTIONS: { value: BalGameBeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'DRAFT', label: '초안' },
  { value: 'SCHEDULED', label: '예약' },
  { value: 'PUBLISHED', label: '게시 중' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'ARCHIVED', label: '종료' },
]

const CATEGORY_OPTIONS: { value: BalBeCategory | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...BAL_BE_CATEGORIES.map((c) => ({
    value: c.value,
    label: `${c.emoji} ${c.label}`,
  })),
]

export default function BalanceGamesPage() {
  const navigate = useNavigate()
  // 게임 목록을 첫 탭으로
  const [tab, setTab] = useState<Tab>('list')

  return (
    <>
      <Topbar
        title="밸런스 게임"
        subtitle="게임 목록 + 유저 신청 큐 — 신청 승인 시 초안 등록 흐름"
      />

      <div className="card mb-4 p-0 overflow-hidden">
        <div className="flex border-b border-border">
          <TabButton
            active={tab === 'list'}
            onClick={() => setTab('list')}
            icon={<FileEdit size={14} />}
            label="게임 목록"
          />
          <TabButton
            active={tab === 'queue'}
            onClick={() => setTab('queue')}
            icon={<Inbox size={14} />}
            label="신청 큐"
          />
          <div className="flex-1" />
          <div className="flex items-center pr-3">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/balance/new')}
            >
              <Plus size={13} /> 직접 등록
            </button>
          </div>
        </div>
      </div>

      {tab === 'list' ? <GameList /> : <ApplyQueue />}
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-[13px] font-extrabold transition border-b-2 -mb-px ${
        active
          ? 'border-point text-point-dark'
          : 'border-transparent text-text-soft hover:text-text-sub'
      }`}
    >
      {icon} {label}
    </button>
  )
}

/* ===== 게임 목록 ===== */
function GameList() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<BalBeCategory | undefined>(undefined)
  const [status, setStatus] = useState<BalGameBeStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useBalGamesBe({
    categoryCode: category,
    status: status === 'ALL' ? undefined : status,
    page,
    size: 12,
  })

  return (
    <>
      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
            options={GAME_STATUS_OPTIONS}
          />
          <div className="w-px h-5 bg-border" />
          <FilterChips
            value={category}
            onChange={(v) => {
              setCategory(v)
              setPage(0)
            }}
            options={CATEGORY_OPTIONS}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-10 text-center text-text-soft text-[12px]">
          불러오는 중...
        </div>
      ) : !data?.content?.length ? (
        <EmptyState title="해당 조건의 게임이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2">
          {data.content.map((g) => (
            <BalanceCardAdmin
              key={g.id}
              game={g}
              onClick={() => navigate(`/balance/${g.id}/edit`)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 0}
        onChange={setPage}
      />
    </>
  )
}

/**
 * EF-FE features/home/components/BalanceCard.tsx 를 어드민용으로 충실 재현.
 * - 카드 상단 리본 2개 (보라/연보라)
 * - LIVE 펄스 닷 + 참여수
 * - 라운드 24, 보라 보더, 보라 그림자
 * - A·VS·B 옵션 (둥근 박스, 이모지 + 시나리오 + 라벨)
 * - 결과 바 (% A : % B)
 * - 하단 점선 구분선 + HOT + 댓글 N개 모두 보기
 * 어드민 차이점:
 *   - status 가 PUBLISHED 가 아닐 때 LIVE 대신 상태 뱃지·예약 시각 노출
 *   - 카드 전체가 클릭 가능 (편집 페이지로 이동)
 *   - 투표 동작 없음 (read-only 미리보기)
 */
function BalanceCardAdmin({
  game,
  onClick,
}: {
  game: BalGameBeSummary
  onClick: () => void
}) {
  const navigate = useNavigate()
  const cat = BAL_BE_CATEGORIES.find((c) => c.value === game.categoryCode)
  const total = game.totalCount
  const aPct = total > 0 ? Math.round((game.aCount / total) * 100) : 50
  const bPct = 100 - aPct
  const isPublished = game.status === 'PUBLISHED'
  const isArchived = game.status === 'ARCHIVED'
  const isHidden = game.status === 'HIDDEN'

  const cardOpacity = isArchived || isHidden ? 'opacity-70' : ''
  const isHot = isPublished && total >= 1000

  return (
    <div className="relative" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* 카드 위 리본 장식 — EF-FE BalanceCard 와 동일한 위치 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 24,
          width: 36,
          height: 14,
          backgroundColor: '#9686BF',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          zIndex: 2,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 62,
          width: 36,
          height: 14,
          backgroundColor: '#B4A8D6',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          zIndex: 2,
        }}
      />

      <div
        className={`bg-surface rounded-[24px] px-[18px] pt-5 pb-4 border-[1.5px] transition ${cardOpacity}`}
        style={{
          borderColor: 'rgba(150,134,191,0.22)',
          boxShadow: '0 8px 18px rgba(150,134,191,0.14)',
        }}
      >
        {/* 상태 라벨: PUBLISHED 면 LIVE, 아니면 상태별 라벨 */}
        <div className="flex items-center justify-between mb-[10px] mt-[6px]">
          {isPublished ? (
            <div
              className="self-start flex items-center gap-[6px] px-3 py-[6px] rounded-full"
              style={{ backgroundColor: 'rgba(150,134,191,0.18)' }}
            >
              <LivePulseDot />
              <span
                className="text-[11px] font-extrabold"
                style={{ color: '#6A579A', letterSpacing: -0.1 }}
              >
                LIVE · {formatNumber(total)}명 참여중
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <StatusBadge status={game.status} />
              {game.status === 'SCHEDULED' && game.scheduledAt && (
                <span className="text-[10.5px] text-point-dark font-bold">
                  ⏰ {formatDateTime(game.scheduledAt)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge tone="neutral">
              {cat?.emoji} {cat?.label ?? game.categoryCode}
            </Badge>
            <span className="text-[10.5px] text-text-soft font-bold">
              <Hash size={9} className="inline" />
              {game.id}
            </span>
          </div>
        </div>

        {/* 옵션 행 */}
        <div className="flex items-stretch gap-[10px] mt-4">
          <OptionBlock
            side="A"
            emoji={game.optionAEmoji}
            label={game.optionA}
            desc={game.optionADesc}
            percent={aPct}
            showPercent={isPublished && total > 0}
          />

          <div className="self-center">
            <div
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: '#9686BF',
                boxShadow: '0 3px 6px rgba(150,134,191,0.4)',
              }}
            >
              <span className="text-[12px] font-extrabold text-white">VS</span>
            </div>
          </div>

          <OptionBlock
            side="B"
            emoji={game.optionBEmoji}
            label={game.optionB}
            desc={game.optionBDesc}
            percent={bPct}
            showPercent={isPublished && total > 0}
          />
        </div>

        {/* 결과 바 — 게시중 + 투표 있을 때만 */}
        {isPublished && total > 0 && (
          <div className="mt-[14px]">
            <div
              className="flex h-[8px] rounded-[6px] overflow-hidden"
              style={{ backgroundColor: '#EDEAE6' }}
            >
              <div
                className="h-full"
                style={{ width: `${aPct}%`, backgroundColor: '#9686BF' }}
              />
              <div
                className="h-full"
                style={{ width: `${bPct}%`, backgroundColor: '#B4A8D6' }}
              />
            </div>
            <div className="flex justify-between mt-[6px]">
              <span className="text-[10.5px] font-extrabold text-text-sub">
                {game.optionA.replace(/\n/g, ' ')} {aPct}%
              </span>
              <span className="text-[10.5px] font-extrabold text-text-sub">
                {bPct}% {game.optionB.replace(/\n/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* 하단 점선 구분선 + HOT/예약 + 댓글 */}
        <div
          className="flex items-center mt-[14px] pt-3"
          style={{
            borderTopWidth: 1.5,
            borderTopColor: 'rgba(150,134,191,0.18)',
            borderStyle: 'dashed',
          }}
        >
          {isHot ? (
            <div className="bg-point px-[10px] py-1 rounded-[10px]">
              <span className="text-[10.5px] font-extrabold text-white">🔥 HOT</span>
            </div>
          ) : !isPublished ? (
            <span className="text-[10.5px] text-text-soft font-bold">
              {formatDateTime(game.createTime)}
            </span>
          ) : null}
          <div className="flex-1" />
          {/* 댓글 — 댓글 1개 이상이면 클릭 시 댓글 페이지로 이동 */}
          {game.commentCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/balance/${game.id}/comments`)
              }}
              className="flex items-center gap-[5px] text-text-sub hover:text-point-dark transition rounded-md px-2 py-1 -mr-1 hover:bg-point-softer"
              title="댓글 보기"
            >
              <MessageCircle size={13} />
              <span className="text-[12px] font-bold">
                댓글 {formatNumber(game.commentCount)}개 →
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-[5px] text-text-soft">
              <MessageCircle size={13} />
              <span className="text-[12px] font-bold">댓글 0</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** EF-FE BalanceOption 재현 — 어드민에서는 항상 idle 상태 (투표 X) */
function OptionBlock({
  side,
  emoji,
  label,
  desc,
  percent,
  showPercent,
}: {
  side: 'A' | 'B'
  emoji: string | null
  label: string
  desc: string | null
  percent: number
  showPercent: boolean
}) {
  const background =
    side === 'A' ? 'rgba(150,134,191,0.14)' : 'rgba(150,134,191,0.22)'
  const borderColor =
    side === 'A' ? 'rgba(150,134,191,0.20)' : 'rgba(150,134,191,0.25)'
  const hasDesc = !!desc && desc.trim().length > 0

  return (
    <div
      className="flex-1 rounded-[18px] flex flex-col items-center px-[10px] py-[14px]"
      style={{
        backgroundColor: background,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor,
      }}
    >
      <div className="text-[24px] mb-[6px] leading-none">{emoji ?? ''}</div>
      {hasDesc && (
        <div
          className="text-[9.5px] text-center font-bold mb-[5px] break-words"
          style={{
            color: '#7E6BAD',
            lineHeight: '14px',
            letterSpacing: -0.1,
            wordBreak: 'keep-all',
          }}
        >
          {desc}
        </div>
      )}
      <div
        className="text-[12px] font-extrabold text-center break-words"
        style={{
          color: '#6A579A',
          lineHeight: '18px',
          letterSpacing: -0.2,
          wordBreak: 'keep-all',
        }}
      >
        {label}
      </div>
      {showPercent && (
        <div
          className="text-[11px] font-extrabold mt-[6px]"
          style={{ color: '#6A579A' }}
        >
          {percent}%
        </div>
      )}
    </div>
  )
}

/** EF-FE LivePulseDot 의 CSS 키프레임 재현 */
function LivePulseDot() {
  return (
    <>
      <span
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: '#9686BF',
          animation: 'ef-live-pulse 1.6s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes ef-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
    </>
  )
}

function StatusBadge({ status }: { status: BalGameBeStatus }) {
  const tone =
    status === 'SCHEDULED'
      ? 'point'
      : status === 'HIDDEN'
        ? 'danger'
        : status === 'ARCHIVED'
          ? 'neutral'
          : 'warn'
  return <Badge tone={tone}>{BAL_GAME_BE_STATUS_LABEL[status]}</Badge>
}

/* ===== 신청 큐 ===== */
function ApplyQueue() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<BalApplyBeStatus | 'ALL'>('PENDING')
  const [page, setPage] = useState(0)
  const [rejectTarget, setRejectTarget] = useState<BalApplyBe | null>(null)

  const { data, isLoading } = useBalAppliesBe({
    status: status === 'ALL' ? undefined : status,
    page,
    size: 10,
  })

  const handleApproveToDraft = (apply: BalApplyBe) => {
    navigate(`/balance/new?fromApply=${apply.id}`)
  }

  return (
    <>
      <div className="card mb-4">
        <FilterChips
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(0)
          }}
          options={APPLY_STATUS_OPTIONS}
        />
      </div>

      {isLoading ? (
        <div className="card p-10 text-center text-text-soft text-[12px]">
          불러오는 중...
        </div>
      ) : !data?.content?.length ? (
        <EmptyState title="해당 조건의 신청이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.content.map((a) => (
            <ApplyCard
              key={a.id}
              apply={a}
              onApprove={() => handleApproveToDraft(a)}
              onReject={() => setRejectTarget(a)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 0}
        onChange={setPage}
      />

      {rejectTarget && (
        <RejectApplyModal
          apply={rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  )
}

function ApplyCard({
  apply,
  onApprove,
  onReject,
}: {
  apply: BalApplyBe
  onApprove: () => void
  onReject: () => void
}) {
  const cat = BAL_BE_CATEGORIES.find((c) => c.value === apply.categoryCode)
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge tone="point">
            {cat?.emoji} {cat?.label ?? apply.categoryCode}
          </Badge>
          <ApplyStatusBadge status={apply.status} />
        </div>
        <span className="text-[11px] text-text-soft">
          @{apply.userNickname ?? '탈퇴'}
        </span>
      </div>

      <div className="bg-point-softer rounded-[14px] px-3.5 py-3 mb-3 border border-point-soft">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-left">
            <div className="text-[18px] leading-none mb-1">
              {apply.optionAEmoji ?? '·'}
            </div>
            <div className="text-[12.5px] font-bold text-text line-clamp-3 break-words">
              {apply.optionA}
            </div>
          </div>
          <div className="bg-point text-white text-[11px] font-extrabold rounded-md px-2 py-1 shadow-point">
            VS
          </div>
          <div className="flex-1 text-right">
            <div className="text-[18px] leading-none mb-1">
              {apply.optionBEmoji ?? '·'}
            </div>
            <div className="text-[12.5px] font-bold text-text line-clamp-3 break-words">
              {apply.optionB}
            </div>
          </div>
        </div>
      </div>

      {apply.description && (
        <div className="text-[12px] text-text-sub mb-3 line-clamp-2 bg-surface-alt rounded-md px-2.5 py-2">
          💬 {apply.description}
        </div>
      )}

      {apply.adminMemo && (
        <div className="text-[11.5px] text-warn mb-3 flex items-start gap-1">
          <span>📝</span>
          <span className="font-bold">관리자 메모: {apply.adminMemo}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-text-soft mb-3">
        <span>
          <Hash size={10} className="inline mr-0.5" />
          {apply.id}
        </span>
        <span>{formatDateTime(apply.createTime)}</span>
      </div>

      {apply.status === 'PENDING' && (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <button className="btn btn-danger btn-sm flex-1" onClick={onReject}>
            <XCircle size={12} /> 반려
          </button>
          <button className="btn btn-primary btn-sm flex-1" onClick={onApprove}>
            <CheckCircle2 size={12} /> 승인 → 초안
          </button>
        </div>
      )}
    </div>
  )
}

function ApplyStatusBadge({ status }: { status: BalApplyBeStatus }) {
  const tone = status === 'APPROVED' ? 'normal' : status === 'PENDING' ? 'warn' : 'danger'
  return <Badge tone={tone}>{BAL_APPLY_BE_STATUS_LABEL[status]}</Badge>
}

function RejectApplyModal({
  apply,
  onClose,
}: {
  apply: BalApplyBe
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useDecideBalApplyMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    if (!reason.trim()) return setError('반려 사유를 입력해주세요.')
    mutation.mutate({
      applyId: apply.id,
      payload: { status: 'REJECTED', adminMemo: reason.trim() },
    })
  }

  return (
    <Modal open onClose={onClose} title="신청 반려" maxWidth={460}>
      <div className="space-y-3">
        <div className="bg-surface-alt rounded-md p-3 text-[12.5px]">
          <div>
            <strong>{apply.optionA}</strong> <span className="text-text-soft mx-1">VS</span>{' '}
            <strong>{apply.optionB}</strong>
          </div>
          <div className="text-text-soft mt-1">@{apply.userNickname ?? '탈퇴'}</div>
        </div>
        <div>
          <label className="form-label">반려 사유 (관리자 메모로 저장)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예) 욕설/혐오 표현 포함"
          />
        </div>
        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? '처리 중...' : '반려'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
