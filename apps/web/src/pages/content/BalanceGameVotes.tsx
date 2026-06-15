import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Vote, RefreshCw } from 'lucide-react'
import {
  useBalGameBeDetail,
  useBalGameVotesBe,
  formatDateTime,
  formatNumber,
} from '@ef-fe-admin/shared'
import type {
  AdminBalVote,
  BalVoteChoice,
  BalGameBe,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import {
  GameSummaryCard,
  VoteRatioCard,
  COLOR_A,
  COLOR_B,
} from './BalanceGameDetail'

const CHOICE_OPTIONS: { value: BalVoteChoice | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'A', label: 'A 선택' },
  { value: 'B', label: 'B 선택' },
]

/**
 * 어드민 — 한 게임의 개별 투표자 목록 페이지.
 * 댓글 페이지(`/balance/:id/comments`) 와 동일한 UX 패턴.
 */
export default function BalanceGameVotesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const gameId = id != null ? Number(id) : undefined

  const { data: game } = useBalGameBeDetail(gameId)
  const [choice, setChoice] = useState<BalVoteChoice | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useBalGameVotesBe(gameId, {
    choice: choice === 'ALL' ? undefined : choice,
    page,
    size: 50,
  })

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => gameId != null && navigate(`/balance/${gameId}`)}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} /> 게임 상세
        </button>
      </div>

      <Topbar
        title="투표자 목록"
        subtitle={
          game
            ? `${game.optionA} VS ${game.optionB} · 총 ${formatNumber(game.totalCount)}표`
            : '불러오는 중...'
        }
      />

      {game && (
        <>
          <GameSummaryCard game={game} />
          {game.totalCount > 0 && game.voteStats && (
            <VoteRatioCard game={game} stats={game.voteStats} />
          )}
        </>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Vote size={14} className="text-point-dark" />
            <div className="font-extrabold text-[14px]">
              투표자 {data ? formatNumber(data.totalElements) : 0}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {CHOICE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${choice === o.value ? 'active' : ''}`}
                onClick={() => {
                  setChoice(o.value)
                  setPage(0)
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="해당 조건의 투표가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>닉네임</th>
                  <th>나이</th>
                  <th>지역</th>
                  <th>선택</th>
                  <th>첫 투표</th>
                  <th>재투표</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((v) => (
                  <VoterRow key={v.voteId} v={v} game={game} navigate={navigate} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 0}
          onChange={setPage}
        />
      </div>
    </>
  )
}

/* ===== 한 투표자 행 ===== */
function VoterRow({
  v,
  game,
  navigate,
}: {
  v: AdminBalVote
  game: BalGameBe | undefined
  navigate: (path: string) => void
}) {
  const optionLabel =
    game == null ? v.choice : v.choice === 'A' ? game.optionA : game.optionB
  const reVoted = v.updateTime !== v.createTime

  return (
    <tr>
      <td>
        {v.userNickname ? (
          <button
            type="button"
            className="font-extrabold hover:text-point-dark hover:underline text-left"
            onClick={() => navigate(`/users/${v.userId}`)}
          >
            {v.userNickname}
          </button>
        ) : (
          <span className="text-text-soft italic">(탈퇴)</span>
        )}
      </td>
      <td className="text-text-sub">
        {v.userAge != null ? `${v.userAge}세` : '-'}
      </td>
      <td className="text-text-sub">{v.userArea ?? '-'}</td>
      <td>
        <span
          className="text-[11px] font-extrabold rounded-md px-2 py-0.5"
          style={{
            backgroundColor: v.choice === 'A' ? COLOR_A : COLOR_B,
            color: '#fff',
          }}
        >
          {v.choice}{' '}
          <span className="opacity-80 ml-0.5 font-bold">{optionLabel}</span>
        </span>
      </td>
      <td className="text-text-sub">{formatDateTime(v.createTime)}</td>
      <td>
        {reVoted ? (
          <Badge tone="warn">
            <RefreshCw size={10} className="inline mr-0.5" />
            재투표 ({formatShort(v.updateTime)})
          </Badge>
        ) : (
          <span className="text-text-soft">-</span>
        )}
      </td>
    </tr>
  )
}

/** "2026-05-19T16:01:00" → "5/19 16:01" */
function formatShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const m = d.getMonth() + 1
  const day = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${hh}:${mm}`
}
