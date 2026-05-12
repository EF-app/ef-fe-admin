import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  EyeOff,
  Eye,
  AlertTriangle,
  MessageCircle,
  Heart,
  Ban,
  UserCheck,
} from 'lucide-react'
import {
  usePostItsBe,
  useHidePostItBeMutation,
  useRestorePostItBeMutation,
  useSuspendUserMutation,
  formatDateTime,
  formatNumber,
  POST_IT_CATEGORY,
  POST_IT_CATEGORY_LABEL,
  POST_IT_COLOR_HEX,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  calcSuspensionEndsAt,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type {
  PostItBe,
  PostItCategory,
  SuspensionType,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'

const CATEGORY_OPTIONS: { value: PostItCategory | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...Object.values(POST_IT_CATEGORY).map((v) => ({
    value: v,
    label: POST_IT_CATEGORY_LABEL[v],
  })),
]

const VISIBILITY_OPTIONS: { value: 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'VISIBLE', label: '게시 중' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'DELETED', label: '삭제됨' },
]

export default function PostItsPage() {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<PostItCategory | undefined>(undefined)
  const [visibility, setVisibility] = useState<'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED'>(
    'ALL'
  )
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<PostItBe | null>(null)

  const { data, isLoading } = usePostItsBe({
    keyword: keyword || undefined,
    categoryCode: category,
    isHidden:
      visibility === 'ALL' || visibility === 'DELETED'
        ? undefined
        : visibility === 'HIDDEN',
    isDeleted: visibility === 'DELETED' ? true : undefined,
    page,
    size: 10,
  })

  return (
    <>
      <Topbar
        title="포스트잇"
        subtitle="유저가 작성한 글 — 카드 클릭 시 전체 본문 + 숨김/제재 처리"
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-full sm:w-[300px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="작성자 닉네임 / 본문 검색"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={visibility}
            onChange={(v) => {
              setVisibility(v)
              setPage(0)
            }}
            options={VISIBILITY_OPTIONS}
          />
          <div className="text-[11.5px] text-text-soft ml-auto">
            전체 {data?.totalElements ?? 0}건
          </div>
        </div>
        <div className="mt-3">
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
        <div className="card text-center py-10 text-text-soft">불러오는 중...</div>
      ) : !data?.content?.length ? (
        <EmptyState title="조건에 맞는 글이 없습니다." />
      ) : (
        // 100% 화면(보통 1280~1440px) 에서는 2열, 더 넓어지면 3열까지.
        // 카드 자체 크기는 그대로 두고, gap 만 크게 잡아 여백을 확보.
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
          {data.content.map((p) => (
            <PostItCard key={p.uuid} post={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 0}
        onChange={setPage}
      />

      {selected && (
        <PostItDetailModal
          post={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

/**
 * 포스트잇 카드 — 최종 레이아웃:
 *
 *   [💭 일상]  [신고 3]  [숨김]                            ← 같은 줄
 *   [작성자]                                        2시간 전
 *   ────────────────────────────────────────────────────
 *      본문 (최대 4줄, 잘리면 …)
 *   ────────────────────────────────────────────────────
 *   N시간 후 만료                          ❤ 12   💬 24
 *
 *  - 익명 글: 작성자 자리에 "익명 · 작성자 보기" 버튼.
 *    클릭하면 실제 닉네임/나이/지역 노출 (어드민 전용).
 */
function PostItCard({
  post,
  onClick,
}: {
  post: PostItBe
  onClick: () => void
}) {
  const [reveal, setReveal] = useState(false)
  const isPinned = post.pinnedUntil && new Date(post.pinnedUntil) > new Date()
  const isExpired = new Date(post.expiresAt) < new Date()
  const bg = POST_IT_COLOR_HEX[post.color] ?? '#EEE9F6'

  const expiryText = (() => {
    if (isExpired) return '⏱ 만료됨'
    const ms = new Date(post.expiresAt).getTime() - Date.now()
    const hours = Math.max(1, Math.round(ms / 1000 / 60 / 60))
    return `${hours}시간 후 만료`
  })()

  const toggleReveal = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    setReveal((v) => !v)
  }

  return (
    <button
      onClick={onClick}
      className="text-left transition rounded-[18px] p-5 hover:shadow-md relative w-full max-w-[420px] mx-auto flex flex-col"
      style={{
        backgroundColor: bg,
        border: '1.5px solid rgba(150,134,191,0.18)',
        minHeight: 240,
        boxShadow: '0 4px 12px rgba(150,134,191,0.10)',
      }}
    >
      {/* 1행: 카테고리 (왼쪽) ↔ 신고·숨김 (오른쪽 정렬) */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className="text-[11px] font-extrabold rounded-md px-2 py-0.5"
          style={{
            backgroundColor: 'rgba(150,134,191,0.18)',
            color: '#6A579A',
            letterSpacing: -0.2,
          }}
        >
          {POST_IT_CATEGORY_LABEL[post.categoryCode]}
        </span>
        {isPinned && (
          <span className="text-[10.5px] font-extrabold text-warn">📌 고정</span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {post.reportCount > 0 && (
            <Badge tone="danger">
              <AlertTriangle size={10} className="inline" /> 신고 {post.reportCount}
            </Badge>
          )}
          {post.isHidden && (
            <Badge tone="warn">
              <EyeOff size={10} className="inline" /> 숨김
            </Badge>
          )}
          {post.isDeleted && <Badge tone="neutral">삭제됨</Badge>}
        </div>
      </div>

      {/* 2행: 작성자 정보 ↔ 작성 시각 */}
      <div className="flex items-baseline justify-between mb-3 gap-2">
        <div className="text-[12.5px] font-bold flex items-baseline gap-1.5 min-w-0 flex-1">
          {post.isAnonymous && !reveal ? (
            <span
              role="button"
              tabIndex={0}
              onClick={toggleReveal}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleReveal(e)
              }}
              className="inline-flex items-center gap-1 cursor-pointer text-text-sub hover:text-point-dark transition rounded px-1.5 py-0.5 -ml-1.5"
              style={{ backgroundColor: 'rgba(150,134,191,0.10)' }}
              title="익명 글의 실제 작성자를 표시"
            >
              <UserCheck size={11} />
              <span className="font-extrabold text-[12px]">작성자 보기</span>
            </span>
          ) : post.isAnonymous && reveal ? (
            <span
              role="button"
              tabIndex={0}
              onClick={toggleReveal}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleReveal(e)
              }}
              className="inline-flex items-baseline gap-1.5 cursor-pointer rounded px-1.5 py-0.5 -ml-1.5 hover:bg-[rgba(150,134,191,0.06)] transition"
              title="다시 익명으로 숨기기"
            >
              <UserCheck size={11} className="text-point-dark self-center" />
              <span className="font-extrabold truncate text-[12px]" style={{ color: '#7E6BAD' }}>
                {post.userNickname}
              </span>
              {post.userAge != null && (
                <span className="text-text-sub text-[11.5px]">· {post.userAge}세</span>
              )}
              {post.userArea && (
                <span className="text-text-sub text-[11.5px]">· {post.userArea}</span>
              )}
            </span>
          ) : (
            <>
              <span className="font-extrabold truncate" style={{ color: '#1C1A1F' }}>
                {post.userNickname}
              </span>
              {post.userAge != null && (
                <span className="text-text-sub text-[11.5px]">· {post.userAge}세</span>
              )}
              {post.userArea && (
                <span className="text-text-sub text-[11.5px]">· {post.userArea}</span>
              )}
            </>
          )}
        </div>
        <span
          className="text-[10.5px] text-text-soft font-bold whitespace-nowrap flex-shrink-0"
          title={formatDateTime(post.createTime)}
        >
          {relativeAgo(post.createTime)}
        </span>
      </div>

      {/* 본문 — 글이 짧으면 자연스럽게 끝나고, 아래는 빈 공간으로 둠 */}
      <div
        className="text-[13px] break-words"
        style={{
          color: '#1C1A1F',
          lineHeight: '1.55',
          letterSpacing: -0.1,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.content}
      </div>

      {/* 본문과 푸터 사이 가변 spacer — 본문이 짧아도 푸터가 카드 하단에 고정 */}
      <div className="flex-1 min-h-[12px]" />

      {/* 하단: ─ + 만료 (좌측) + 좋아요/답글 (우측) — 항상 카드 바닥에 고정 */}
      <div className="pt-3 border-t border-[rgba(150,134,191,0.20)] flex items-center justify-between">
        <span
          className={`text-[10.5px] font-bold ${
            isExpired ? 'text-danger' : 'text-text-soft'
          }`}
        >
          {expiryText}
        </span>
        <div className="flex items-center gap-3 text-[12px] font-extrabold text-point-dark">
          <span className="inline-flex items-center gap-1">
            <Heart size={13} /> {formatNumber(post.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={13} /> {formatNumber(post.replyCount)}
          </span>
        </div>
      </div>
    </button>
  )
}

function relativeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}

/* ===== 상세 모달 ===== */
function PostItDetailModal({
  post,
  onClose,
}: {
  post: PostItBe
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [confirmMode, setConfirmMode] = useState<'hide' | 'restore' | null>(null)
  const [hideReason, setHideReason] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  // 모달도 익명 글은 기본 숨김. 토글로 작성자 노출
  const [revealAuthor, setRevealAuthor] = useState(false)

  const hideMutation = useHidePostItBeMutation({ onSuccess: onClose })
  const restoreMutation = useRestorePostItBeMutation({ onSuccess: onClose })

  const bg = POST_IT_COLOR_HEX[post.color] ?? '#EEE9F6'
  const showAuthor = !post.isAnonymous || revealAuthor

  return (
    <>
      <Modal open onClose={onClose} title="포스트잇 상세" maxWidth={560}>
        <div className="space-y-4">
          {/* 메타 뱃지들 (같은 줄) */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="point">{POST_IT_CATEGORY_LABEL[post.categoryCode]}</Badge>
            {post.isAnonymous && <Badge tone="neutral">익명 글</Badge>}
            <div className="flex-1" />
            {post.reportCount > 0 && (
              <Badge tone="danger">
                <AlertTriangle size={10} /> 신고 {post.reportCount}
              </Badge>
            )}
            {post.isHidden && <Badge tone="warn">숨김 처리됨</Badge>}
            {post.isDeleted && <Badge tone="neutral">삭제됨</Badge>}
          </div>

          {/* 작성자 — 익명 글이면 기본 숨김, 버튼으로 토글 */}
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-[13.5px] flex items-baseline gap-2">
              {showAuthor ? (
                <>
                  <button
                    onClick={() => navigate(`/users/${post.userUuid}`)}
                    className="font-extrabold text-point-dark hover:underline"
                  >
                    {post.userNickname}
                  </button>
                  {post.userAge != null && (
                    <span className="text-text-sub text-[12px]">{post.userAge}세</span>
                  )}
                  {post.userArea && (
                    <span className="text-text-sub text-[12px]">· {post.userArea}</span>
                  )}
                  {post.isAnonymous && (
                    <button
                      type="button"
                      onClick={() => setRevealAuthor(false)}
                      className="ml-1 text-[11px] font-bold text-text-soft hover:text-point-dark underline"
                    >
                      익명으로 숨기기
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealAuthor(true)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12.5px] font-extrabold text-point-dark hover:bg-point-softer transition"
                  style={{ backgroundColor: 'rgba(150,134,191,0.10)' }}
                >
                  <UserCheck size={12} /> 작성자 보기
                </button>
              )}
            </div>
            <span className="text-[11.5px] text-text-soft whitespace-nowrap">
              {relativeAgo(post.createTime)}
            </span>
          </div>

          {/* 본문 */}
          <div
            className="rounded-[14px] p-4 sm:p-5 text-[14px] whitespace-pre-wrap break-words"
            style={{
              backgroundColor: bg,
              border: '1.5px solid rgba(150,134,191,0.18)',
              color: '#1C1A1F',
              lineHeight: '1.6',
            }}
          >
            {post.content}
          </div>

          {/* 메타 — 1행: UUID/작성/만료, 2행: 신고/좋아요/채팅/색상 */}
          <div className="bg-surface-alt rounded-md p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <Field label="UUID">
                <span className="font-mono text-[10.5px] break-all">{post.uuid}</span>
              </Field>
              <Field label="작성 시각">{formatDateTime(post.createTime)}</Field>
              <Field label="만료 시각">{formatDateTime(post.expiresAt)}</Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] pt-2 border-t border-border">
              <Field label="신고 수">
                <AlertTriangle size={11} className="inline mr-0.5" /> {post.reportCount}
              </Field>
              <Field label="좋아요 수">
                <Heart size={11} className="inline mr-0.5" /> {post.likeCount}
              </Field>
              <Field label="채팅 수">
                <MessageCircle size={11} className="inline mr-0.5" /> {post.replyCount}
              </Field>
              <Field label="색상">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
                  style={{ backgroundColor: bg, border: '1px solid rgba(0,0,0,0.08)' }}
                />
                {post.color}
              </Field>
            </div>
          </div>

          {!post.isDeleted && (
            <>
              <hr className="border-border" />

              {/* 숨김 처리 확인 */}
              {confirmMode === 'hide' && (
                <div className="bg-danger-soft rounded-md p-3 space-y-3">
                  <div className="text-[12.5px] font-extrabold text-danger">
                    이 글을 숨김 처리할까요?
                  </div>
                  <textarea
                    className="form-textarea"
                    value={hideReason}
                    onChange={(e) => setHideReason(e.target.value)}
                    placeholder="숨김 사유 (선택, 감사 로그에 기록됨)"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmMode(null)}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={hideMutation.isPending}
                      onClick={() =>
                        hideMutation.mutate({
                          uuid: post.uuid,
                          reason: hideReason || undefined,
                        })
                      }
                    >
                      숨김 확정
                    </button>
                  </div>
                </div>
              )}

              {/* 숨김 해제 확인 */}
              {confirmMode === 'restore' && (
                <div className="bg-point-softer rounded-md p-3 space-y-3">
                  <div className="text-[12.5px] font-extrabold">
                    숨김을 해제할까요? 글이 다시 노출되며, 신고 누적 카운트는 0으로 리셋됩니다.
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmMode(null)}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(post.uuid)}
                    >
                      해제 확정
                    </button>
                  </div>
                </div>
              )}

              {/* 액션 버튼 — 익명 글도 작성자 제재 가능 */}
              {confirmMode === null && (
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSuspendOpen(true)}
                  >
                    <Ban size={13} /> 작성자 제재
                  </button>
                  {!post.isHidden ? (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmMode('hide')}
                    >
                      <EyeOff size={13} /> 숨김 처리
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setConfirmMode('restore')}
                    >
                      <Eye size={13} /> 숨김 해제
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {suspendOpen && (
        <SuspendAuthorModal
          userUuid={post.userUuid}
          nickname={post.userNickname}
          isAnonymous={post.isAnonymous}
          onClose={() => setSuspendOpen(false)}
          onDone={onClose}
        />
      )}
    </>
  )
}

/* ===== 작성자 제재 모달 ===== */
function SuspendAuthorModal({
  userUuid,
  nickname,
  isAnonymous,
  onClose,
  onDone,
}: {
  userUuid: string
  nickname: string
  isAnonymous: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useSuspendUserMutation({
    onSuccess: () => {
      onClose()
      onDone()
    },
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    if (!reason.trim()) {
      setError('제재 사유를 입력해주세요.')
      return
    }
    mutation.mutate({
      uuid: userUuid,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(
          type,
          type === 'TEMPORARY' ? durationDays : undefined
        ),
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`작성자 제재 — ${nickname}${isAnonymous ? ' (익명 글 작성자)' : ''}`}
      maxWidth={540}
    >
      <div className="space-y-3">
        <div className="bg-surface-alt rounded-md p-3 text-[12.5px]">
          <strong>{nickname}</strong> 에게 적용할 제재를 선택하세요.
          {isAnonymous && (
            <div className="text-warn text-[11.5px] font-bold mt-1">
              ⚠️ 익명 글이지만 실제 작성자에게 제재가 적용됩니다.
            </div>
          )}
        </div>

        <div>
          <label className="form-label">제재 유형</label>
          <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
          <label className="form-label">사유 (유저에게 통보됨)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예) 카톡 ID 유도 / 스팸성 광고"
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
            {mutation.isPending ? '처리 중...' : '제재 발동'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-[12.5px]">{children}</div>
    </div>
  )
}
