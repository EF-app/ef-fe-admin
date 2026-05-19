import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, FileEdit, MessageSquare, BarChart3, Vote, UserCheck, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  useBalGameBeDetail,
  formatDateTime,
  formatNumber,
  BAL_BE_CATEGORIES,
  BAL_GAME_BE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  AdminBalVoteBucketStat,
  AdminBalVoteStats,
  BalGameBe,
  BalGameBeStatus,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

/**
 * 어드민 — 밸런스 게임 단건 조회.
 * - 게임 요약 + 투표 통계(비율/연령/지역) + 투표자 목록·댓글로 가는 액션 버튼
 * - 수정 폼은 별도 라우트(/balance/:id/edit), 투표자 목록은 /balance/:id/votes.
 */
export default function BalanceGameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // 라우트 path 가 :id 로 정의되어 있지만 값은 BE 의 uuid (관리자도 uuid 정책 통일).
  const gameUuid = id ?? undefined

  const { data: game, isLoading } = useBalGameBeDetail(gameUuid)

  if (isLoading || !game) {
    return (
      <>
        <Topbar title="밸런스 게임" subtitle="불러오는 중..." />
      </>
    )
  }

  const total = game.totalCount

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <button onClick={() => navigate('/balance')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 밸런스 게임 목록
        </button>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/balance/${game.uuid}/edit`)}
          >
            <FileEdit size={13} /> 수정
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/balance/${game.uuid}/votes`)}
            disabled={total === 0}
            title={total === 0 ? '투표가 아직 없습니다.' : undefined}
          >
            <Vote size={13} /> 투표자 목록 ({formatNumber(total)})
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/balance/${game.uuid}/comments`)}
          >
            <MessageSquare size={13} /> 댓글 보기 ({formatNumber(game.commentCount)})
          </button>
        </div>
      </div>

      <Topbar
        title={`밸런스 게임 #${game.id}`}
        subtitle={`${BAL_GAME_BE_STATUS_LABEL[game.status]} · 등록 ${formatDateTime(game.createTime)}`}
      />

      <GameSummaryCard game={game} />

      {total > 0 && game.voteStats ? (
        <>
          <VoteRatioCard game={game} stats={game.voteStats} />
          <AgeDistributionCard stats={game.voteStats} />
          <AreaDistributionCard stats={game.voteStats} />
        </>
      ) : (
        <div className="card">
          <EmptyState title="아직 투표가 없습니다." />
        </div>
      )}
    </>
  )
}

/* ===== 게임 요약 ===== */
export function GameSummaryCard({ game }: { game: BalGameBe }) {
  const navigate = useNavigate()
  const cat = BAL_BE_CATEGORIES.find((c) => c.value === game.categoryCode)
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge tone="point">
          {cat?.emoji} {cat?.label ?? game.categoryCode}
        </Badge>
        <StatusBadge status={game.status} />
        {game.scheduledAt && (
          <Badge tone="warn">⏰ {formatDateTime(game.scheduledAt)}</Badge>
        )}
        {game.scheduledEndAt && (
          <Badge tone="neutral">종료 {formatDateTime(game.scheduledEndAt)}</Badge>
        )}
        {game.applicantUserId != null && (
          <Badge tone="neutral">
            <UserCheck size={10} className="inline mr-0.5" /> 신청자{' '}
            <button
              type="button"
              className="font-extrabold hover:underline"
              onClick={() =>
                game.applicantUserId != null && navigate(`/users/${game.applicantUserId}`)
              }
            >
              @{game.applicantNickname ?? '(탈퇴)'}
            </button>
          </Badge>
        )}
      </div>
      {game.description && (
        <div className="text-[13.5px] font-bold mb-3 leading-relaxed">
          {game.description}
        </div>
      )}
      <div className="flex items-stretch gap-2.5">
        <MiniOption
          side="A"
          emoji={game.optionAEmoji}
          label={game.optionA}
          desc={game.optionADesc}
          count={game.aCount}
          total={game.totalCount}
        />
        <div className="self-center w-8 h-8 rounded-full bg-point text-white flex items-center justify-center text-[12px] font-extrabold shadow-point">
          VS
        </div>
        <MiniOption
          side="B"
          emoji={game.optionBEmoji}
          label={game.optionB}
          desc={game.optionBDesc}
          count={game.bCount}
          total={game.totalCount}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: BalGameBeStatus }) {
  const tone =
    status === 'PUBLISHED' ? 'normal'
    : status === 'SCHEDULED' ? 'point'
    : status === 'HIDDEN' ? 'danger'
    : status === 'ARCHIVED' ? 'neutral'
    : 'warn'
  return <Badge tone={tone}>{BAL_GAME_BE_STATUS_LABEL[status]}</Badge>
}

function MiniOption({
  side, emoji, label, desc, count, total,
}: {
  side: 'A' | 'B'
  emoji: string | null
  label: string
  desc: string | null
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const background =
    side === 'A' ? 'rgba(150,134,191,0.14)' : 'rgba(150,134,191,0.22)'
  const borderColor =
    side === 'A' ? 'rgba(150,134,191,0.20)' : 'rgba(150,134,191,0.25)'
  return (
    <div
      className="flex-1 rounded-[14px] flex flex-col items-center justify-center px-3 py-3"
      style={{
        backgroundColor: background,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor,
      }}
    >
      <div className="text-[20px] leading-none mb-1">{emoji ?? ''}</div>
      {desc && (
        <div
          className="text-[9.5px] text-center font-bold mb-1"
          style={{ color: '#7E6BAD', lineHeight: '14px' }}
        >
          {desc}
        </div>
      )}
      <div
        className="text-[12.5px] font-extrabold text-center"
        style={{ color: '#6A579A' }}
      >
        {label}
      </div>
      {total > 0 && (
        <div
          className="text-[11px] font-extrabold mt-1"
          style={{ color: '#6A579A' }}
        >
          {pct}% · {formatNumber(count)}표
        </div>
      )}
    </div>
  )
}

/* ===== 투표 비율 카드 (가로 한 줄 비교 막대) ===== */
export const COLOR_A = '#9686BF'
export const COLOR_B = '#B4A8D6'

export function VoteRatioCard({ game, stats }: { game: BalGameBe; stats: AdminBalVoteStats }) {
  const aPct = stats.aPercent ?? 0
  const bPct = stats.bPercent ?? 0

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-point-dark" />
        <div className="font-extrabold text-[14px]">투표 비율</div>
        <span className="text-[11.5px] text-text-soft ml-auto">
          총 {formatNumber(game.totalCount)}표
        </span>
      </div>

      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[11px] font-extrabold rounded-md px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: COLOR_A, color: '#fff' }}
          >
            A
          </span>
          <span className="text-[15px] flex-shrink-0">{game.optionAEmoji ?? ''}</span>
          <span
            className="text-[13px] font-extrabold truncate"
            style={{ color: '#6A579A' }}
          >
            {game.optionA}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span
            className="text-[13px] font-extrabold truncate"
            style={{ color: '#6A579A' }}
          >
            {game.optionB}
          </span>
          <span className="text-[15px] flex-shrink-0">{game.optionBEmoji ?? ''}</span>
          <span
            className="text-[11px] font-extrabold rounded-md px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: COLOR_B, color: '#fff' }}
          >
            B
          </span>
        </div>
      </div>

      <div
        className="flex h-4 rounded-full overflow-hidden"
        style={{ backgroundColor: '#EDEAE6' }}
      >
        <div className="h-full transition-all" style={{ width: `${aPct}%`, backgroundColor: COLOR_A }} />
        <div className="h-full transition-all" style={{ width: `${bPct}%`, backgroundColor: COLOR_B }} />
      </div>

      <div className="flex items-baseline justify-between mt-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-extrabold" style={{ color: COLOR_A }}>{aPct}%</span>
          <span className="text-[11.5px] text-text-soft font-bold">{formatNumber(game.aCount)}표</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11.5px] text-text-soft font-bold">{formatNumber(game.bCount)}표</span>
          <span className="text-[15px] font-extrabold" style={{ color: COLOR_B }}>{bPct}%</span>
        </div>
      </div>
    </div>
  )
}

/* ===== 연령대 분포 — 8개 고정 키 + 빈 버킷 0 보충 ===== */
const AGE_BUCKETS = [
  '20~24', '25~29', '30~34', '35~39', '40~44', '45~49', '50대 이상', '미설정',
] as const

function AgeDistributionCard({ stats }: { stats: AdminBalVoteStats }) {
  const rows = AGE_BUCKETS.map((k) => ({
    label: k,
    cell: stats.ageDistribution[k] ?? { a: 0, b: 0 },
  }))
  const max = Math.max(1, ...rows.map((r) => r.cell.a + r.cell.b))

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-point-dark" />
        <div className="font-extrabold text-[14px]">연령대 분포</div>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <DistributionRow key={r.label} label={r.label} cell={r.cell} max={max} />
        ))}
      </div>
    </div>
  )
}

/* ===== 지역 분포 — A+B 합 내림차순 + "더 보기" 토글 ===== */
const AREA_DEFAULT_SHOW = 5

function AreaDistributionCard({ stats }: { stats: AdminBalVoteStats }) {
  const [expanded, setExpanded] = useState(false)

  const rows = Object.entries(stats.areaDistribution)
    .map(([label, cell]) => ({ label, cell }))
    .sort((x, y) => y.cell.a + y.cell.b - (x.cell.a + x.cell.b))

  const visible = expanded ? rows : rows.slice(0, AREA_DEFAULT_SHOW)
  const hasMore = rows.length > AREA_DEFAULT_SHOW
  const max = Math.max(1, ...rows.map((r) => r.cell.a + r.cell.b))

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-point-dark" />
        <div className="font-extrabold text-[14px]">지역 분포</div>
        <span className="text-[11.5px] text-text-soft ml-auto">
          {rows.length}개 지역
        </span>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="지역 정보가 없습니다." />
      ) : (
        <>
          <div className="space-y-2.5">
            {visible.map((r) => (
              <DistributionRow key={r.label} label={r.label} cell={r.cell} max={max} />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full justify-center mt-3"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <ChevronUp size={13} /> 접기
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> 더 보기 ({rows.length - AREA_DEFAULT_SHOW}개)
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ===== 분포 한 행 — 좌측 라벨, 중간 stacked 막대 (A+B), 우측 카운트 ===== */
function DistributionRow({
  label,
  cell,
  max,
}: {
  label: string
  cell: AdminBalVoteBucketStat
  max: number
}) {
  const sum = cell.a + cell.b
  const aWidth = (cell.a / max) * 100
  const bWidth = (cell.b / max) * 100

  return (
    <div className="grid grid-cols-[100px_1fr_auto] items-center gap-3">
      <span className="text-[12px] font-bold text-text-sub truncate" title={label}>
        {label}
      </span>
      <div
        className="flex h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: '#EDEAE6' }}
      >
        <div className="h-full transition-all" style={{ width: `${aWidth}%`, backgroundColor: COLOR_A }} />
        <div className="h-full transition-all" style={{ width: `${bWidth}%`, backgroundColor: COLOR_B }} />
      </div>
      <div className="text-[11.5px] font-bold flex items-baseline gap-2 whitespace-nowrap">
        <span style={{ color: COLOR_A }}>{cell.a}</span>
        <span className="text-text-soft">/</span>
        <span style={{ color: COLOR_B }}>{cell.b}</span>
        <span className="text-text-soft">({sum})</span>
      </div>
    </div>
  )
}
