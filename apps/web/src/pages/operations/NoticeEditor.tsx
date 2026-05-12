import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Save, Send, Clock, ArrowLeft, AlertTriangle, GitBranch, Archive, Bell } from 'lucide-react'
import {
  useAdminNoticeDetail,
  useCreateAdminNoticeMutation,
  useUpdateAdminNoticeMutation,
  formatDateTime,
  NOTICE_BE_CATEGORY_LABEL,
  NOTICE_BE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  NoticeBeCategory,
  NoticeBeStatus,
  NoticeBeUpsertRequest,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'

/** 일반 카테고리 — 정정(AMEND)은 기존 PUBLISHED 공지에서 [정정하기] 로만 작성 가능 */
const NORMAL_CATEGORIES: NoticeBeCategory[] = ['NOTICE', 'EVENT', 'UPDATE']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 10, 20, 30, 40, 50] as const

/**
 * 공지 등록/수정 페이지.
 * - 임시저장(DRAFT) / 예약 발행(SCHEDULED) / 즉시 발행(PUBLISHED) 버튼 분리
 * - 예약은 10분 단위(분 선택지: 00/10/20/30/40/50)
 * - PUBLISHED 후에는 수정 불가 (BE 정책) → 읽기 전용으로 표시
 */
export default function NoticeEditorPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEdit = Boolean(idParam)
  const noticeId = idParam ? Number(idParam) : undefined

  // 정정 모드: /notices/new?amend=<원본ID>
  const amendOf = searchParams.get('amend')
  const amendSourceId = amendOf ? Number(amendOf) : undefined
  const isAmendMode = !isEdit && amendSourceId != null && !Number.isNaN(amendSourceId)

  const { data: existing, isLoading } = useAdminNoticeDetail(noticeId)
  const { data: amendSource, isLoading: amendLoading } = useAdminNoticeDetail(
    isAmendMode ? amendSourceId : undefined
  )

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoticeBeCategory>('NOTICE')
  const [originalNoticeId, setOriginalNoticeId] = useState<string>('')
  // 예약 시각: 날짜 + 시 + 분(10분 단위)을 분리해서 관리
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [scheduledHour, setScheduledHour] = useState<number | ''>('')
  const [scheduledMinute, setScheduledMinute] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && existing) {
      setTitle(existing.title)
      setContent(existing.content)
      setCategory(existing.category)
      setOriginalNoticeId(
        existing.originalNoticeId != null ? String(existing.originalNoticeId) : ''
      )
      if (existing.scheduledAt) {
        // "2026-05-14T18:00:00" → 부분 파싱
        const [d, t] = existing.scheduledAt.split('T')
        const [h, m] = (t ?? '00:00:00').split(':')
        setScheduledDate(d)
        setScheduledHour(Number(h))
        setScheduledMinute(Number(m))
      }
    }
  }, [existing, isEdit])

  // 정정 모드: 원본 공지 로드 시 한 번만 프리필 (사용자가 이후 수정할 수 있어야 하므로)
  const amendPrefilledRef = useRef(false)
  useEffect(() => {
    if (!isAmendMode || !amendSource || amendPrefilledRef.current) return
    setTitle(amendSource.title)
    setContent(amendSource.content)
    setCategory('AMEND')
    setOriginalNoticeId(String(amendSource.id))
    amendPrefilledRef.current = true
  }, [isAmendMode, amendSource])

  const createMutation = useCreateAdminNoticeMutation({
    onSuccess: (n) => {
      setToast('✅ 저장되었습니다.')
      setTimeout(() => navigate(`/notices/${n.id}/edit`, { replace: true }), 500)
    },
    onError: (e) => setError(e.message),
  })

  const updateMutation = useUpdateAdminNoticeMutation({
    onSuccess: () => setToast('✅ 저장되었습니다.'),
    onError: (e) => setError(e.message),
  })

  const pending = createMutation.isPending || updateMutation.isPending
  const readOnly =
    isEdit &&
    existing?.status &&
    (existing.status === 'PUBLISHED' || existing.status === 'ARCHIVED')

  // 자동 토스트 사라짐
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const minDate = useMemo(() => {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const hasScheduleInputs =
    !!scheduledDate && scheduledHour !== '' && scheduledMinute !== ''

  const validate = (): NoticeBeUpsertRequest | null => {
    setError(null)
    if (!title.trim()) return setError('제목을 입력해주세요.'), null
    if (title.length > 100) return setError('제목은 100자 이하로 입력해주세요.'), null
    if (!content.trim()) return setError('내용을 입력해주세요.'), null
    if (content.length > 2000) return setError('내용은 2000자 이하로 입력해주세요.'), null
    if (category === 'AMEND' && !originalNoticeId.trim()) {
      return setError('정정 공지는 원본 공지 ID 가 필요합니다.'), null
    }
    return {
      title: title.trim(),
      content,
      category,
      originalNoticeId:
        category === 'AMEND' ? Number(originalNoticeId.trim()) : null,
      status: 'DRAFT',
      scheduledAt: null,
    }
  }

  const buildScheduledIso = (): string | null => {
    if (!hasScheduleInputs) return null
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${scheduledDate}T${pad(Number(scheduledHour))}:${pad(Number(scheduledMinute))}:00`
  }

  // 확인 팝업 상태 — 검증을 통과한 payload 를 들고 사용자가 확인할 때까지 대기
  const [pendingPayload, setPendingPayload] = useState<NoticeBeUpsertRequest | null>(null)

  const handleClickAction = (status: NoticeBeStatus) => {
    const base = validate()
    if (!base) return

    let scheduledAtIso: string | null = null
    if (status === 'SCHEDULED') {
      if (!hasScheduleInputs) {
        setError('예약 날짜·시·분을 모두 선택해주세요.')
        return
      }
      const iso = buildScheduledIso()!
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) {
        setError('올바른 예약 시각을 입력해주세요.')
        return
      }
      if (d.getTime() <= Date.now()) {
        setError('예약 시각은 현재 시각 이후여야 합니다.')
        return
      }
      if (Number(scheduledMinute) % 10 !== 0) {
        setError('예약은 10분 단위로만 가능합니다.')
        return
      }
      scheduledAtIso = iso
    }

    setPendingPayload({
      ...base,
      status,
      scheduledAt: scheduledAtIso,
    })
  }

  const executeSubmit = () => {
    if (!pendingPayload) return
    if (isEdit && noticeId != null) {
      updateMutation.mutate(
        { id: noticeId, payload: pendingPayload },
        { onSettled: () => setPendingPayload(null) }
      )
    } else {
      createMutation.mutate(pendingPayload, {
        onSettled: () => setPendingPayload(null),
      })
    }
  }

  if ((isEdit && isLoading) || (isAmendMode && amendLoading)) {
    return (
      <>
        <Topbar title={isEdit ? '공지 수정' : isAmendMode ? '정정 공지 작성' : '공지 등록'} />
        <div className="card text-center py-12 text-text-soft text-[13px]">
          불러오는 중...
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/notices')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 공지 목록
        </button>
      </div>

      <Topbar
        title={isEdit ? '공지 수정' : isAmendMode ? '정정 공지 작성' : '공지 등록'}
        subtitle={
          isEdit
            ? `공지 #${noticeId} · 게시 후에는 수정이 제한됩니다`
            : isAmendMode
            ? `공지 #${amendSourceId} 의 내용을 가져왔습니다. 정정할 부분을 수정하세요.`
            : '카테고리 · 본문 작성 후 임시저장 / 예약 발행 / 즉시 발행을 선택하세요'
        }
      />

      {isAmendMode && amendSource && (
        <div className="card mb-4 border-l-4 border-l-warn bg-[#FDF8EF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12.5px]">
              <GitBranch size={14} className="text-warn" />
              <span className="font-bold">
                원본 공지 #{amendSource.id} ·{' '}
                <span className="text-text-sub font-normal">"{amendSource.title}"</span>
              </span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/notices/${amendSource.id}/edit`)}
              title="원본 공지 보기"
            >
              원본 보기
            </button>
          </div>
        </div>
      )}

      {/* 상태 헤더 */}
      <div className="card mb-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6">
          <div>
            <div className="text-[11px] text-text-soft font-bold mb-1">현재 상태</div>
            {existing ? (
              <StatusBadge status={existing.status} />
            ) : (
              <Badge tone="neutral">신규</Badge>
            )}
          </div>
          {existing && (
            <div className="flex gap-6 text-[12px]">
              <div>
                <div className="text-text-soft font-bold">작성자</div>
                <div className="font-bold mt-0.5">{existing.author}</div>
              </div>
              <div>
                <div className="text-text-soft font-bold">작성 시각</div>
                <div className="mt-0.5">{formatDateTime(existing.createTime)}</div>
              </div>
              {existing.publishedAt && (
                <div>
                  <div className="text-text-soft font-bold">게시 시각</div>
                  <div className="mt-0.5">{formatDateTime(existing.publishedAt)}</div>
                </div>
              )}
              {existing.scheduledAt && (
                <div>
                  <div className="text-text-soft font-bold">예약 시각</div>
                  <div className="mt-0.5">{formatDateTime(existing.scheduledAt)}</div>
                </div>
              )}
            </div>
          )}
          <div />
        </div>
      </div>

      {readOnly && existing && (
        <div className="card mb-4 border-l-4 border-l-warn bg-[#FDF8EF]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-[12.5px]">
              <AlertTriangle size={14} className="text-warn" />
              <span className="font-bold">
                {existing.status === 'PUBLISHED'
                  ? '게시된 공지의 본문/카테고리는 수정할 수 없습니다. 본문을 바꾸려면 정정 공지를 작성하세요.'
                  : '종료된 공지입니다. 본문/카테고리는 수정 불가. 다시 게시하려면 아래 버튼을 누르세요.'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {existing.status === 'PUBLISHED' && (
                <>
                  {noticeId != null && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/pushes/new?fromNotice=${noticeId}`)}
                      title="이 공지로 푸시 알림 작성"
                    >
                      <Bell size={13} /> 이 글로 푸시 보내기
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleClickAction('ARCHIVED')}
                  >
                    <Archive size={13} /> 종료 처리
                  </button>
                  {noticeId != null && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/notices/new?amend=${noticeId}`)}
                    >
                      <GitBranch size={13} /> 정정 공지 작성
                    </button>
                  )}
                </>
              )}
              {existing.status === 'ARCHIVED' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleClickAction('PUBLISHED')}
                >
                  <Send size={13} /> 재게시
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 본문 카드 */}
      <div className="card space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <label className="form-label">제목 (최대 100자)</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!!readOnly}
              maxLength={100}
              placeholder="예) 5월 시스템 점검 안내"
            />
            <div className="text-[11px] text-text-soft text-right mt-1">
              {title.length} / 100
            </div>
          </div>
          <div className="w-[260px]">
            <label className="form-label">
              카테고리
              {isAmendMode && (
                <span className="ml-1 text-[10.5px] text-warn font-bold">
                  (정정 모드 · 잠금)
                </span>
              )}
            </label>
            {/* 정정 모드: AMEND 칩 하나만 잠금 표시
                일반 신규/편집: NORMAL_CATEGORIES (정정 제외) */}
            <div className="flex flex-wrap gap-2">
              {isAmendMode || category === 'AMEND' ? (
                <button
                  type="button"
                  disabled
                  className="chip active opacity-90 cursor-not-allowed"
                >
                  {NOTICE_BE_CATEGORY_LABEL.AMEND}
                </button>
              ) : (
                NORMAL_CATEGORIES.map((c) => {
                  const disabled = !!readOnly
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={disabled}
                      className={`chip ${category === c ? 'active' : ''} ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => !disabled && setCategory(c)}
                    >
                      {NOTICE_BE_CATEGORY_LABEL[c]}
                    </button>
                  )
                })
              )}
            </div>
            {!isAmendMode && !readOnly && category !== 'AMEND' && (
              <div className="text-[10.5px] text-text-soft mt-1.5 leading-tight">
                ※ 정정 공지는 기존 게시된 공지에서 [정정하기] 로만 작성됩니다.
              </div>
            )}
          </div>
        </div>

        {category === 'AMEND' && (
          <div className="bg-surface-alt border border-border rounded-md p-3">
            <label className="form-label">
              원본 공지 ID
              {isAmendMode && (
                <span className="ml-1 text-[10.5px] text-warn font-bold">(자동 설정)</span>
              )}
            </label>
            <input
              className="form-input w-[200px]"
              type="number"
              value={originalNoticeId}
              onChange={(e) => setOriginalNoticeId(e.target.value)}
              disabled={!!readOnly || isAmendMode}
              placeholder="예) 12"
            />
            <div className="text-[11px] text-text-soft mt-1">
              정정 공지는 원본 공지의 ID 를 지정해야 합니다.
            </div>
          </div>
        )}

        <div>
          <label className="form-label">내용 (최대 2000자)</label>
          <textarea
            className="form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!!readOnly}
            maxLength={2000}
            style={{ minHeight: 220 }}
            placeholder="공지 본문을 입력하세요..."
          />
          <div className="text-[11px] text-text-soft text-right mt-1">
            {content.length} / 2000
          </div>
        </div>

        {!readOnly && (
          <div className="border-t border-border pt-4">
            <label className="form-label">예약 시각 (선택 · 10분 단위)</label>
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <div className="text-[11px] text-text-soft font-bold mb-1">날짜</div>
                <input
                  type="date"
                  className="form-input w-[170px]"
                  value={scheduledDate}
                  min={minDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <div className="text-[11px] text-text-soft font-bold mb-1">시</div>
                <select
                  className="form-input w-[90px]"
                  value={scheduledHour}
                  onChange={(e) =>
                    setScheduledHour(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">--</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}시
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] text-text-soft font-bold mb-1">분</div>
                <select
                  className="form-input w-[90px]"
                  value={scheduledMinute}
                  onChange={(e) =>
                    setScheduledMinute(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">--</option>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}분
                    </option>
                  ))}
                </select>
              </div>
              {hasScheduleInputs && (
                <div className="ml-2 mb-1 text-[12px] text-point-dark font-bold">
                  → {scheduledDate} {String(Number(scheduledHour)).padStart(2, '0')}:
                  {String(Number(scheduledMinute)).padStart(2, '0')} 예약
                </div>
              )}
              {hasScheduleInputs && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm ml-auto"
                  onClick={() => {
                    setScheduledDate('')
                    setScheduledHour('')
                    setScheduledMinute('')
                  }}
                >
                  예약 해제
                </button>
              )}
            </div>
            <div className="text-[11px] text-text-soft mt-2">
              비워두면 "임시저장" 또는 "즉시 발행"만 가능합니다. 분은 00/10/20/30/40/50 만
              선택할 수 있어요.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-danger-soft text-danger text-[12.5px] font-bold rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {toast && (
          <div className="bg-[#E8F3EC] text-success text-[12.5px] font-bold rounded-md px-3 py-2">
            {toast}
          </div>
        )}
      </div>

      {/* 액션 바 */}
      {!readOnly && (
        <div className="card mt-4 flex items-center justify-between">
          <div className="text-[11.5px] text-text-soft">
            ※ 이 화면은 게시판 등록만 합니다. 푸시 알림은 발행 후 [이 글로 푸시 보내기] 또는 [푸시 발송] 페이지에서 별도로 작성합니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pending}
              onClick={() => handleClickAction('DRAFT')}
            >
              <Save size={13} /> 임시저장
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pending || !hasScheduleInputs}
              onClick={() => handleClickAction('SCHEDULED')}
              title={!hasScheduleInputs ? '예약 날짜·시·분을 모두 선택하세요' : ''}
            >
              <Clock size={13} /> 예약 발행
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() => handleClickAction('PUBLISHED')}
            >
              <Send size={13} /> {pending ? '저장 중...' : '즉시 발행'}
            </button>
          </div>
        </div>
      )}

      {pendingPayload && (
        <ConfirmActionDialog
          payload={pendingPayload}
          pending={pending}
          onCancel={() => setPendingPayload(null)}
          onConfirm={executeSubmit}
        />
      )}
    </>
  )
}

function ConfirmActionDialog({
  payload,
  pending,
  onCancel,
  onConfirm,
}: {
  payload: NoticeBeUpsertRequest
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { status, scheduledAt, title, category } = payload
  const meta = (() => {
    if (status === 'DRAFT') {
      return {
        title: '임시저장하시겠습니까?',
        body: '게시판에 노출되지 않고, 이후에 다시 열어서 수정·발행할 수 있습니다.',
        confirmLabel: '임시저장',
        confirmTone: 'secondary' as const,
        icon: <Save size={14} className="text-text-soft" />,
      }
    }
    if (status === 'SCHEDULED') {
      const display = scheduledAt
        ? scheduledAt.slice(0, 16).replace('T', ' ')
        : ''
      return {
        title: '예약 발행하시겠습니까?',
        body: (
          <>
            지정하신 <strong>{display}</strong> 에 자동으로 게시됩니다. 예약 발행
            전까지는 수정·취소가 가능합니다.
          </>
        ),
        confirmLabel: '예약',
        confirmTone: 'primary' as const,
        icon: <Clock size={14} className="text-point-dark" />,
      }
    }
    if (status === 'ARCHIVED') {
      return {
        title: '이 공지를 종료(ARCHIVED) 처리할까요?',
        body: (
          <>
            게시판에서 더 이상 노출되지 않습니다. 필요 시 다시 게시 상태로
            전환할 수 있습니다.
          </>
        ),
        confirmLabel: '종료',
        confirmTone: 'secondary' as const,
        icon: <Archive size={14} className="text-text-sub" />,
      }
    }
    // PUBLISHED — 신규 즉시 발행 vs 종료 → 재게시 구분
    return {
      title: '지금 즉시 발행하시겠습니까?',
      body: (
        <>
          발행 후에는 본문/카테고리 <strong>수정이 제한</strong>됩니다. 수정이
          필요하면 정정 공지를 새로 작성해야 합니다. (게시 ↔ 종료 상태 전환은
          가능)
        </>
      ),
      confirmLabel: '발행',
      confirmTone: 'primary' as const,
      icon: <Send size={14} className="text-point-dark" />,
    }
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,39,48,0.5)] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-[460px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2">
          {meta.icon}
          <div className="text-[17px] font-extrabold">{meta.title}</div>
        </div>
        <div className="text-[13px] text-text-sub leading-relaxed mb-4">
          {meta.body}
        </div>

        <div className="bg-surface-alt rounded-md p-3 text-[12px] space-y-1 mb-5">
          <Row label="제목" value={title} />
          <Row
            label="카테고리"
            value={
              category === 'AMEND'
                ? `정정 (원본 #${payload.originalNoticeId ?? '-'})`
                : NOTICE_BE_CATEGORY_LABEL[category]
            }
          />
          <Row label="상태" value={NOTICE_BE_STATUS_LABEL[status]} />
          {status === 'SCHEDULED' && scheduledAt && (
            <Row label="예약 시각" value={scheduledAt.slice(0, 16).replace('T', ' ')} />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={pending}>
            취소
          </button>
          <button
            className={`btn btn-sm ${
              meta.confirmTone === 'primary' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? '처리 중...' : meta.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-text-soft font-bold w-[80px] flex-shrink-0">{label}</span>
      <span className="text-text text-right break-words flex-1">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: NoticeBeStatus }) {
  const tone =
    status === 'PUBLISHED' ? 'normal' :
    status === 'SCHEDULED' ? 'point' :
    status === 'ARCHIVED' ? 'neutral' :
    'warn'
  return <Badge tone={tone}>{NOTICE_BE_STATUS_LABEL[status]}</Badge>
}
