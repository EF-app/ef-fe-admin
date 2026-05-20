import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  EyeOff,
  Eye,
  Ban,
  UserCheck,
  Flag,
  MessageSquare,
} from 'lucide-react'
import {
  useBalGameBeDetail,
  useBalGameCommentsBe,
  useHideBalCommentMutation,
  useSuspendUserMutation,
  formatDateTime,
  formatNumber,
  validators,
  calcSuspensionEndsAt,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  TEMPORARY_DURATION_OPTIONS,
  BAL_BE_CATEGORIES,
} from '@ef-fe-admin/shared'
import type {
  BalCommentBe,
  BalCommentReplyBe,
  CommentAvatarColor,
  SuspensionType,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

const AV_COLOR_MAP: Record<CommentAvatarColor, { bg: string; color: string }> = {
  purple: { bg: 'rgba(150,134,191,0.18)', color: '#9686BF' },
  green: { bg: 'rgba(139,191,168,0.18)', color: '#6AAD94' },
  amber: { bg: 'rgba(196,136,90,0.14)', color: '#B07840' },
  pink: { bg: 'rgba(191,150,170,0.16)', color: '#A8607A' },
  blue: { bg: 'rgba(100,150,210,0.14)', color: '#5580B0' },
}

/**
 * 어드민 밸런스 게임 댓글 페이지.
 * - FE BalGameCommentsScreen 디자인 차용
 * - 댓글마다 닉네임 토글(displayNick ↔ 실제 닉네임) + 제재 / 신고 처리 버튼
 */
export default function BalGameCommentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const gameId = id != null ? Number(id) : undefined

  const { data: game } = useBalGameBeDetail(gameId)
  const { data: comments, isLoading } = useBalGameCommentsBe(gameId)

  const [suspendTarget, setSuspendTarget] = useState<{
    userUuid: string
    nickname: string
    contextPrefill: string
  } | null>(null)

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/balance')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 밸런스 게임 목록
        </button>
      </div>

      <Topbar
        title="밸런스 게임 댓글"
        subtitle={
          game
            ? `${game.optionA} VS ${game.optionB} · 댓글 ${formatNumber(game.commentCount)}개`
            : '불러오는 중...'
        }
      />

      {/* 게임 요약 카드 */}
      {game && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {(() => {
                const cat = BAL_BE_CATEGORIES.find((c) => c.value === game.categoryCode)
                return (
                  <Badge tone="point">
                    {cat?.emoji} {cat?.label}
                  </Badge>
                )
              })()}
              <Badge tone="neutral">#{game.id}</Badge>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/balance/${game.id}/edit`)}
            >
              게임 편집
            </button>
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
      )}

      {/* 댓글 목록 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={14} className="text-point-dark" />
          <div className="font-extrabold text-[14px]">
            댓글 {comments?.length ?? 0}
          </div>
        </div>
        {isLoading ? (
          <div className="py-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !comments?.length ? (
          <EmptyState title="댓글이 없습니다." />
        ) : (
          <div className="divide-y divide-border">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                onSuspend={() =>
                  setSuspendTarget({
                    userUuid: c.authorUserUuid,
                    nickname: c.authorRealNickname,
                    contextPrefill: `밸런스 댓글 #${c.id} — `,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {suspendTarget && (
        <SuspendInlineModal
          target={suspendTarget}
          onClose={() => setSuspendTarget(null)}
        />
      )}
    </>
  )
}

/* ===== 게임 미니 옵션 (페이지 헤더용) ===== */
function MiniOption({
  side,
  emoji,
  label,
  desc,
  count,
  total,
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

/* ===== 댓글 한 줄 (메인 + 답글) ===== */
function CommentRow({
  comment,
  onSuspend,
}: {
  comment: BalCommentBe
  onSuspend: () => void
}) {
  return (
    <div className="py-3.5">
      <CommentBody item={comment} gameId={comment.gameId} isReply={false} onSuspend={onSuspend} />
      {comment.replies.length > 0 && (
        <div
          className="ml-[42px] mt-3 pl-3"
          style={{ borderLeft: '2px solid var(--color-border)' }}
        >
          {comment.replies.map((r) => (
            <CommentBody
              key={r.id}
              item={r}
              gameId={comment.gameId}
              isReply={true}
              onSuspend={() => {
                /* 답글도 동일 부모 흐름 — 부모에서 처리해도 됨, 여기선 inline 호출 */
                ;(window as unknown as { __replySuspend?: () => void }).__replySuspend?.()
              }}
              replyParentId={comment.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentBody({
  item,
  gameId,
  isReply,
  onSuspend,
}: {
  item: BalCommentBe | BalCommentReplyBe
  gameId: number
  isReply: boolean
  onSuspend: () => void
  replyParentId?: number
}) {
  const [revealReal, setRevealReal] = useState(false)
  const [reportProcessed, setReportProcessed] = useState(false)
  const hideMutation = useHideBalCommentMutation()

  const av = AV_COLOR_MAP[item.avColor]
  const size = isReply ? 26 : 32
  const isVote = !isReply && 'voteChoice' in item && item.voteChoice
  const displayName = revealReal ? item.authorRealNickname : item.displayNick

  const handleHide = () => {
    if (item.hidden) {
      if (!confirm('숨김을 해제할까요? 신고 카운트가 0으로 리셋됩니다.')) return
    } else {
      if (!confirm('이 댓글을 숨김 처리할까요?')) return
    }
    hideMutation.mutate({ gameId, commentId: item.id })
  }

  return (
    <div className="flex items-start gap-2.5">
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          width: size,
          height: size,
          backgroundColor: av.bg,
        }}
      >
        <span className="font-extrabold" style={{ fontSize: 11, color: av.color }}>
          {item.letter}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* 1행: 닉네임 + 토글 + 시각 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <button
            type="button"
            onClick={() => setRevealReal((v) => !v)}
            className="inline-flex items-center gap-1 hover:underline"
            title={revealReal ? '표시 닉네임으로 보기' : '실제 작성자 보기'}
          >
            <span
              className="font-extrabold"
              style={{
                fontSize: isReply ? 11 : 11.5,
                color: revealReal ? '#6A579A' : '#9686BF',
              }}
            >
              {displayName}
            </span>
            <UserCheck size={10} className="text-text-soft" />
          </button>
          {revealReal && (
            <span className="text-[9.5px] text-text-soft">(실제 닉네임)</span>
          )}
          {!isReply && isVote && (
            <Badge tone="point">
              <Flag size={9} /> {(item as BalCommentBe).voteChoice} 투표
            </Badge>
          )}
          {item.hidden && <Badge tone="warn">숨김</Badge>}
          {item.deleted && <Badge tone="neutral">삭제</Badge>}
          {item.reportCount > 0 && (
            <Badge tone="danger">
              <AlertTriangle size={9} /> 신고 {item.reportCount}
            </Badge>
          )}
          <span className="ml-auto text-[10.5px] text-text-soft font-bold">
            {formatDateTime(item.createTime)}
          </span>
        </div>

        {/* 본문 — 숨김/삭제도 본문은 노출. 상태는 1행의 뱃지로 표시. */}
        <div
          className={`break-words leading-relaxed ${
            isReply ? 'text-[12.5px]' : 'text-[13.5px]'
          } ${item.hidden || item.deleted ? 'opacity-60' : ''}`}
          style={{ color: '#1C1A1F' }}
        >
          {item.text}
        </div>

        {/* 액션 행 — 삭제된 댓글은 추가 조치 불가하므로 숨김 */}
        {!item.deleted && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-text-soft">
              <Heart size={11} />
              <span className="text-[11px] font-bold">{item.likes}</span>
            </span>

            <div className="flex-1" />

            <button
              type="button"
              className={`btn btn-sm ${item.hidden ? 'btn-primary' : 'btn-danger'}`}
              onClick={handleHide}
              disabled={hideMutation.isPending}
            >
              {item.hidden ? (
                <>
                  <Eye size={11} /> 해제
                </>
              ) : (
                <>
                  <EyeOff size={11} /> 숨김
                </>
              )}
            </button>

            {item.reportCount > 0 && !reportProcessed && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (
                    confirm(
                      `이 댓글의 신고 ${item.reportCount}건을 처리됨으로 표시할까요?`
                    )
                  ) {
                    setReportProcessed(true)
                  }
                }}
              >
                <Flag size={11} /> 신고 처리
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onSuspend}
            >
              <Ban size={11} /> 제재
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== 인라인 제재 모달 ===== */
function SuspendInlineModal({
  target,
  onClose,
}: {
  target: { userUuid: string; nickname: string; contextPrefill: string }
  onClose: () => void
}) {
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState(7)
  const [reason, setReason] = useState(target.contextPrefill)
  const [error, setError] = useState<string | null>(null)

  const mutation = useSuspendUserMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    const check = validators.suspensionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    mutation.mutate({
      uuid: target.userUuid,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  return (
    <Modal open onClose={onClose} title={`작성자 제재 — ${target.nickname}`} maxWidth={520}>
      <div className="space-y-3">
        <div>
          <label className="form-label">제재 유형</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(SUSPENSION_TYPE) as SuspensionType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${type === t ? 'active' : ''}`}
                onClick={() => setType(t)}
              >
                {SUSPENSION_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        {type === 'TEMPORARY' && (
          <div>
            <label className="form-label">기간</label>
            <div className="flex gap-2 flex-wrap">
              {TEMPORARY_DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  className={`chip ${durationDays === opt.days ? 'active' : ''}`}
                  onClick={() => setDurationDays(opt.days)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="form-label">사유</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '처리 중...' : '제재 발동'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
