import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseInt0, useUrlFilters } from '../../hooks/useUrlFilters'
import { useScrollRestoration } from '../../hooks/useScrollRestoration'
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
  postItsBeApi,
  formatDateTime,
  formatNumber,
  POST_IT_CATEGORY,
  POST_IT_CATEGORY_LABEL,
  POST_IT_COLOR_HEX,
} from '@ef-fe-admin/shared'
import type {
  PostItBe,
  PostItCategory,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SuspendInlineModal from '../../components/suspension/SuspendInlineModal'

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
  useScrollRestoration()
  const navigate = useNavigate()
  const [filters, setFilters] = useUrlFilters<{
    keyword: string
    category: PostItCategory | undefined
    visibility: 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED'
    page: number
  }>({
    keyword: { default: '' },
    category: { default: undefined },
    visibility: { default: 'ALL' },
    page: { default: 0, parse: parseInt0 },
  })
  const { keyword, category, visibility, page } = filters
  const setKeyword = (v: string) => setFilters({ keyword: v, page: 0 })
  const setCategory = (v: PostItCategory | undefined) => setFilters({ category: v, page: 0 })
  const setVisibility = (v: 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED') => setFilters({ visibility: v, page: 0 })
  const setPage = (p: number) => setFilters({ page: p })
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

  // 신고 목록 등에서 ?focus={postItId} 로 진입 시 해당 포스트잇 상세 모달 자동 오픈.
  // 목록 페이지 필터/페이지에 안 보여도 단건 detail 로 직접 가져옴.
  const [searchParams] = useSearchParams()
  const focusPostItId = searchParams.get('focus')
  useEffect(() => {
    if (!focusPostItId || selected) return
    let cancelled = false
    postItsBeApi
      .detail(Number(focusPostItId))
      .then((p) => {
        if (!cancelled) setSelected(p)
      })
      .catch(() => {
        // 미존재/삭제 등 — 조용히 무시 (목록은 일반대로 표시)
      })
    return () => {
      cancelled = true
    }
  }, [focusPostItId, selected])

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
            onChange={setVisibility}
            options={VISIBILITY_OPTIONS}
          />
          <div className="text-[11.5px] text-text-soft ml-auto">
            전체 {data?.totalElements ?? 0}건
          </div>
        </div>
        <div className="mt-3">
          <FilterChips
            value={category}
            onChange={setCategory}
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
            <PostItCard key={p.id} post={p} onClick={() => setSelected(p)} />
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
          onClose={() => {
            setSelected(null)
            // ?focus= 로 진입한 경우 (예: 신고 목록 → 포스트잇 보기) 닫으면 이전 페이지로 복귀.
            if (focusPostItId) navigate(-1)
          }}
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
        {post.anonymous && <Badge tone="neutral">익명 글</Badge>}
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
          {post.hidden && (
            <Badge tone="warn">
              <EyeOff size={10} className="inline" /> 숨김
            </Badge>
          )}
          {post.deleted && <Badge tone="neutral">삭제됨</Badge>}
        </div>
      </div>

      {/* 2행: 작성자 정보 ↔ 작성 시각 */}
      <div className="flex items-baseline justify-between mb-3 gap-2">
        <div className="text-[12.5px] font-bold flex items-baseline gap-1.5 min-w-0 flex-1">
          {post.anonymous && !reveal ? (
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
          ) : post.anonymous && reveal ? (
            <span className="inline-flex items-baseline gap-1.5 min-w-0">
              <UserCheck size={11} className="text-point-dark self-center flex-shrink-0" />
              <span className="font-extrabold truncate text-[12px]" style={{ color: '#7E6BAD' }}>
                {post.userNickname}
              </span>
              {post.userAge != null && (
                <span className="text-text-sub text-[11.5px]">· {post.userAge}세</span>
              )}
              {post.userArea && (
                <span className="text-text-sub text-[11.5px]">· {post.userArea}</span>
              )}
              <button
                type="button"
                onClick={toggleReveal}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleReveal(e)
                }}
                className="ml-1 text-[10.5px] font-bold text-text-soft hover:text-point-dark underline flex-shrink-0"
              >
                익명으로 숨기기
              </button>
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
  // 마지막 [확정] 클릭 후 띄우는 통일 ConfirmDialog
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  // 모달도 익명 글은 기본 숨김. 토글로 작성자 노출
  const [revealAuthor, setRevealAuthor] = useState(false)

  const hideMutation = useHidePostItBeMutation({ onSuccess: onClose })
  const restoreMutation = useRestorePostItBeMutation({ onSuccess: onClose })

  const bg = POST_IT_COLOR_HEX[post.color] ?? '#EEE9F6'
  const showAuthor = !post.anonymous || revealAuthor

  return (
    <>
      <Modal open onClose={onClose} title="포스트잇 상세" maxWidth={560}>
        <div className="space-y-4">
          {/* 메타 뱃지들 (같은 줄) */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="point">{POST_IT_CATEGORY_LABEL[post.categoryCode]}</Badge>
            {post.anonymous && <Badge tone="neutral">익명 글</Badge>}
            <div className="flex-1" />
            {post.reportCount > 0 && (
              <Badge tone="danger">
                <AlertTriangle size={10} /> 신고 {post.reportCount}
              </Badge>
            )}
            {post.hidden && <Badge tone="warn">숨김 처리됨</Badge>}
            {post.deleted && <Badge tone="neutral">삭제됨</Badge>}
          </div>

          {/* 작성자 — 익명 글이면 기본 숨김, 버튼으로 토글 */}
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-[13.5px] flex items-baseline gap-2">
              {showAuthor ? (
                <>
                  <button
                    onClick={() => navigate(`/users/${post.userId}`)}
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
                  {post.anonymous && (
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

          {/* 메타 — 1행: ID/작성/만료, 2행: 신고/좋아요/채팅/색상 */}
          <div className="bg-surface-alt rounded-md p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <Field label="ID">
                <span className="font-mono text-[10.5px] break-all">{post.id}</span>
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

          {!post.deleted && (
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
                      onClick={() => setFinalConfirmOpen(true)}
                    >
                      숨김 확정
                    </button>
                  </div>
                </div>
              )}

              {/* 숨김 해제 — 사유 입력 없음, 바로 ConfirmDialog 띄움 */}
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
                      onClick={() => setFinalConfirmOpen(true)}
                    >
                      해제 확정
                    </button>
                  </div>
                </div>
              )}

              {/* 액션 버튼 — 익명 글도 작성자 제재 가능. 순서: 숨김 → 제재 */}
              {confirmMode === null && (
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {!post.hidden ? (
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
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSuspendOpen(true)}
                  >
                    <Ban size={13} /> 작성자 제재
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {suspendOpen && (
        <SuspendInlineModal
          userId={post.userId}
          userNickname={post.userNickname}
          isAnonymous={post.anonymous}
          contextPrefill={`포스트잇 #${post.id} (${POST_IT_CATEGORY_LABEL[post.categoryCode as PostItCategory] ?? post.categoryCode})\n본문: "${
            (post.content ?? '').length > 200
              ? `${post.content.slice(0, 200)}…`
              : post.content ?? ''
          }"\n사유: `}
          onClose={() => setSuspendOpen(false)}
          onSuccess={onClose}
        />
      )}

      {finalConfirmOpen && confirmMode === 'hide' && (
        <ConfirmDialog
          title="포스트잇을 숨김 처리하시겠습니까?"
          body={
            hideReason
              ? `사유: ${hideReason}`
              : '사유 없이 즉시 숨김 처리됩니다.'
          }
          confirmLabel="예, 숨김"
          tone="danger"
          pending={hideMutation.isPending}
          onCancel={() => setFinalConfirmOpen(false)}
          onConfirm={() =>
            hideMutation.mutate(
              { id: post.id, reason: hideReason || undefined },
              { onSettled: () => setFinalConfirmOpen(false) }
            )
          }
        />
      )}
      {finalConfirmOpen && confirmMode === 'restore' && (
        <ConfirmDialog
          title="숨김을 해제하시겠습니까?"
          body="글이 다시 노출되고 신고 누적 카운트가 0으로 리셋됩니다."
          confirmLabel="예, 해제"
          tone="warn"
          pending={restoreMutation.isPending}
          onCancel={() => setFinalConfirmOpen(false)}
          onConfirm={() =>
            restoreMutation.mutate(post.id, {
              onSettled: () => setFinalConfirmOpen(false),
            })
          }
        />
      )}
    </>
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
