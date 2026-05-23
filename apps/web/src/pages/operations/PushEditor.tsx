import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Clock,
  Send,
  Bell,
  AlertTriangle,
  Link2,
} from 'lucide-react'
import {
  useAdminNoticeDetail,
  usePushDetail,
  useCreatePushMutation,
  useSendPushNowMutation,
  useCancelPushMutation,
  formatDateTime,
  formatNumber,
  PUSH_TARGET_LABEL,
  PUSH_KIND_LABEL,
  PUSH_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  PushTarget,
  PushKind,
  PushUpsertRequest,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const TARGETS: { value: PushTarget; label: string; desc: string }[] = [
  { value: 'ALL', label: '전체', desc: '모든 활성 유저' },
  { value: 'IOS', label: 'iOS', desc: 'iOS 앱 사용자만' },
  { value: 'ANDROID', label: 'Android', desc: 'Android 앱 사용자만' },
  { value: 'PREMIUM', label: '프리미엄', desc: '프리미엄 구독 중' },
  { value: 'SEGMENT', label: '세그먼트', desc: '맞춤 조건 지정' },
]
const KINDS: { value: PushKind; label: string }[] = [
  { value: 'NOTICE_LINK', label: '공지 연동' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'EMERGENCY', label: '긴급' },
  { value: 'CUSTOM', label: '일반' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 10, 20, 30, 40, 50] as const

/**
 * 푸시 등록/상세 페이지.
 *   /pushes/new                      : 신규 작성
 *   /pushes/new?fromNotice=<id>      : 공지에서 진입 — 제목/본문/딥링크 자동 prefill
 *   /pushes/:id                      : 상세 (SENT 면 readOnly, SCHEDULED 면 즉시 발송/취소)
 */
export default function PushEditorPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEdit = Boolean(idParam)
  const pushId = idParam ? Number(idParam) : undefined

  const fromNotice = searchParams.get('fromNotice')
  const fromNoticeId = fromNotice ? Number(fromNotice) : undefined
  const isFromNotice = !isEdit && fromNoticeId != null && !Number.isNaN(fromNoticeId)

  const { data: existing } = usePushDetail(pushId)
  const { data: noticeSource } = useAdminNoticeDetail(
    isFromNotice ? fromNoticeId : undefined
  )

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [deepLink, setDeepLink] = useState('')
  const [target, setTarget] = useState<PushTarget>('ALL')
  const [segmentDesc, setSegmentDesc] = useState('')
  const [kind, setKind] = useState<PushKind>('CUSTOM')
  const [linkedNoticeId, setLinkedNoticeId] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledHour, setScheduledHour] = useState<number | ''>('')
  const [scheduledMinute, setScheduledMinute] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [pendingMode, setPendingMode] = useState<
    'DRAFT' | 'SCHEDULED' | 'SENT' | null
  >(null)
  // 확인 팝업 상태 — DRAFT 는 confirm 없음, SCHEDULED/SENT(즉시발송)/SEND_NOW(예약→즉시)/CANCEL(예약취소) 만
  const [confirmKind, setConfirmKind] = useState<
    'SCHEDULED' | 'SENT' | 'SEND_NOW' | 'CANCEL' | null
  >(null)

  // 기존 푸시 로드 (상세 — readOnly)
  useEffect(() => {
    if (!isEdit || !existing) return
    setTitle(existing.title)
    setBody(existing.body)
    setDeepLink(existing.deepLink ?? '')
    setTarget(existing.target)
    setSegmentDesc(existing.segmentDesc ?? '')
    setKind(existing.kind)
    setLinkedNoticeId(existing.linkedNoticeId)
    if (existing.scheduledAt) {
      const [d, t] = existing.scheduledAt.split('T')
      const [h, m] = (t ?? '00:00:00').split(':')
      setScheduledDate(d)
      setScheduledHour(Number(h))
      setScheduledMinute(Number(m))
    }
  }, [existing, isEdit])

  // 공지에서 진입 시 한 번만 prefill
  const noticePrefilledRef = useRef(false)
  useEffect(() => {
    if (!isFromNotice || !noticeSource || noticePrefilledRef.current) return
    setTitle(noticeSource.title)
    // 공지 본문이 길면 푸시는 첫 줄/요약만
    const firstLine = noticeSource.content.split('\n')[0] ?? ''
    setBody(firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine)
    setDeepLink(`ef://notice/${noticeSource.id}`)
    setKind('NOTICE_LINK')
    setLinkedNoticeId(noticeSource.id)
    noticePrefilledRef.current = true
  }, [isFromNotice, noticeSource])

  const createMutation = useCreatePushMutation({
    onSuccess: (p) => navigate(`/pushes/${p.id}`, { replace: true }),
    onError: (e) => setError(e.message),
  })
  const sendNowMutation = useSendPushNowMutation({
    onError: (e) => setError(e.message),
  })
  const cancelMutation = useCancelPushMutation({
    onError: (e) => setError(e.message),
  })

  const readOnly =
    isEdit && existing && (existing.status === 'SENT' || existing.status === 'CANCELED' || existing.status === 'FAILED')
  const pending =
    createMutation.isPending || sendNowMutation.isPending || cancelMutation.isPending

  const minDate = useMemo(() => {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const hasScheduleInputs =
    !!scheduledDate && scheduledHour !== '' && scheduledMinute !== ''

  const buildScheduledIso = (): string | null => {
    if (!hasScheduleInputs) return null
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${scheduledDate}T${pad(Number(scheduledHour))}:${pad(Number(scheduledMinute))}:00`
  }

  const validate = (status: 'DRAFT' | 'SCHEDULED' | 'SENT'): PushUpsertRequest | null => {
    setError(null)
    if (!title.trim()) return setError('제목을 입력해주세요.'), null
    if (title.length > 60) return setError('제목은 60자 이하로 입력해주세요.'), null
    if (!body.trim()) return setError('본문을 입력해주세요.'), null
    if (body.length > 140) return setError('본문은 140자 이하로 입력해주세요.'), null
    if (target === 'SEGMENT' && !segmentDesc.trim()) {
      return setError('세그먼트 설명을 입력해주세요. (예: 7일 미접속자)'), null
    }

    let scheduledIso: string | null = null
    if (status === 'SCHEDULED') {
      if (!hasScheduleInputs) {
        setError('예약 발행: 날짜·시·분을 모두 선택해주세요.')
        return null
      }
      const iso = buildScheduledIso()!
      if (new Date(iso).getTime() <= Date.now()) {
        setError('예약 시각은 현재 시각 이후여야 합니다.')
        return null
      }
      if (Number(scheduledMinute) % 10 !== 0) {
        setError('예약은 10분 단위로만 가능합니다.')
        return null
      }
      scheduledIso = iso
    }

    return {
      title: title.trim(),
      body: body.trim(),
      deepLink: deepLink.trim() || null,
      target,
      segmentDesc: target === 'SEGMENT' ? segmentDesc.trim() : null,
      kind,
      linkedNoticeId,
      scheduledAt: scheduledIso,
      status,
    }
  }

  const handleSubmit = (status: 'DRAFT' | 'SCHEDULED' | 'SENT') => {
    const payload = validate(status)
    if (!payload) return
    setPendingMode(status)
    createMutation.mutate(payload, {
      onSettled: () => setPendingMode(null),
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() =>
            isFromNotice && fromNoticeId
              ? navigate(`/notices/${fromNoticeId}/edit`)
              : navigate('/pushes')
          }
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} />{' '}
          {isFromNotice ? '공지 상세' : '푸시 목록'}
        </button>
      </div>

      <Topbar
        title={isEdit ? '푸시 상세' : '새 푸시 작성'}
        subtitle={
          isEdit && existing
            ? `${PUSH_KIND_LABEL[existing.kind]} · ${PUSH_STATUS_LABEL[existing.status]}`
            : isFromNotice
              ? `공지 #${fromNoticeId} 에서 진입 — 제목·본문이 자동 입력됐어요. 다듬어서 발송하세요.`
              : '발송 대상과 시점을 지정해 푸시 알림을 작성합니다.'
        }
      />

      {isFromNotice && noticeSource && (
        <div className="card mb-4 border-l-4 border-l-point bg-point-softer">
          <div className="flex items-center gap-2 text-[12.5px]">
            <Link2 size={14} className="text-point-dark" />
            <span className="font-bold">
              원본 공지 #{noticeSource.id} ·{' '}
              <span className="text-text-sub font-normal">"{noticeSource.title}"</span>
            </span>
          </div>
        </div>
      )}

      {readOnly && existing && (
        <div className="card mb-4 border-l-4 border-l-warn bg-[#FDF8EF]">
          <div className="flex items-center gap-2 text-[12.5px]">
            <AlertTriangle size={14} className="text-warn" />
            <span className="font-bold">
              {existing.status === 'SENT'
                ? `발송 완료된 푸시는 수정할 수 없습니다. ${formatDateTime(existing.sentAt!)} · ${formatNumber(existing.sentCount)} 명 발송`
                : existing.status === 'CANCELED'
                  ? '취소된 푸시입니다.'
                  : '발송에 실패한 푸시입니다.'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* 좌측 — 작성 폼 */}
        <div className="space-y-4">
          {/* 종류 */}
          <div className="card">
            <label className="form-label">종류</label>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  disabled={!!readOnly}
                  className={`chip ${kind === k.value ? 'active' : ''} ${
                    readOnly ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !readOnly && setKind(k.value)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목·본문 */}
          <div className="card space-y-3">
            <div>
              <label className="form-label">
                푸시 제목 <span className="text-text-soft font-normal">(최대 60자)</span>
              </label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!!readOnly}
                maxLength={60}
                placeholder="예) 5월 신규 회원 혜택 이벤트"
              />
              <div className="text-[11px] text-text-soft text-right mt-1">
                {title.length} / 60
              </div>
            </div>

            <div>
              <label className="form-label">
                본문 <span className="text-text-soft font-normal">(최대 140자)</span>
              </label>
              <textarea
                className="form-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!!readOnly}
                maxLength={140}
                style={{ minHeight: 90 }}
                placeholder="알림 미리보기에 표시되는 본문을 입력하세요."
              />
              <div className="text-[11px] text-text-soft text-right mt-1">
                {body.length} / 140
              </div>
            </div>

            <div>
              <label className="form-label">
                딥링크 <span className="text-text-soft font-normal">(선택)</span>
              </label>
              <input
                className="form-input"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                disabled={!!readOnly}
                placeholder="예) ef://notice/12, ef://home, ef://premium"
              />
            </div>
          </div>

          {/* 대상 */}
          <div className="card">
            <label className="form-label">발송 대상</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TARGETS.map((t) => {
                const selected = target === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    disabled={!!readOnly}
                    onClick={() => !readOnly && setTarget(t.value)}
                    className={`rounded-md border-[1.5px] p-3 text-left transition ${
                      selected
                        ? 'border-point bg-point-softer'
                        : 'border-border bg-surface hover:border-point-soft'
                    } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`text-[12.5px] font-extrabold ${
                        selected ? 'text-point-dark' : ''
                      }`}
                    >
                      {t.label}
                    </div>
                    <div className="text-[10.5px] text-text-soft mt-0.5">
                      {t.desc}
                    </div>
                  </button>
                )
              })}
            </div>
            {target === 'SEGMENT' && (
              <div className="mt-3">
                <label className="form-label">세그먼트 설명</label>
                <input
                  className="form-input"
                  value={segmentDesc}
                  onChange={(e) => setSegmentDesc(e.target.value)}
                  disabled={!!readOnly}
                  placeholder="예) 7일 이상 미접속자, 20-25세 서울 거주"
                />
              </div>
            )}
          </div>

          {/* 예약 */}
          {!readOnly && (
            <div className="card">
              <label className="form-label">
                예약 발송 시각 <span className="text-text-soft font-normal">(선택 · 10분 단위)</span>
              </label>
              <div className="flex items-end gap-2 flex-wrap">
                <input
                  type="date"
                  className="form-input w-[170px]"
                  value={scheduledDate}
                  min={minDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
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
                {hasScheduleInputs && (
                  <>
                    <span className="text-[12px] text-point-dark font-bold ml-1 mb-1">
                      → {scheduledDate} {String(Number(scheduledHour)).padStart(2, '0')}:
                      {String(Number(scheduledMinute)).padStart(2, '0')}
                    </span>
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
                  </>
                )}
              </div>
              <div className="text-[11px] text-text-soft mt-2">
                비워두면 "초안 저장" 또는 "즉시 발송"만 가능합니다.
              </div>
            </div>
          )}
        </div>

        {/* 우측 — 미리보기 + 대상 정보 */}
        <aside className="space-y-3">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-alt/40">
              <div className="text-[10.5px] font-extrabold text-text-soft tracking-wider uppercase">
                알림 미리보기
              </div>
            </div>
            <div className="p-4">
              <PushPreview title={title} body={body} />
            </div>
          </div>

          <div className="card text-[12px] space-y-2">
            <Row label="대상" value={PUSH_TARGET_LABEL[target]} />
            {target === 'SEGMENT' && segmentDesc && (
              <Row label="세그먼트" value={segmentDesc} />
            )}
            <Row
              label="예상 발송"
              value={`약 ${formatNumber(estimateCount(target))} 명`}
            />
            {linkedNoticeId != null && (
              <Row label="연동 공지" value={`#${linkedNoticeId}`} />
            )}
          </div>

          {error && (
            <div className="card bg-danger-soft text-danger text-[12.5px] font-bold">
              {error}
            </div>
          )}
        </aside>
      </div>

      {/* 액션 바 */}
      {!readOnly && !isEdit && (
        <div className="card mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[11.5px] text-text-soft">
            ※ 발송 후에는 수정/취소가 불가합니다. 대상 인원을 다시 확인하세요.
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              disabled={pending}
              onClick={() => handleSubmit('DRAFT')}
            >
              <Save size={13} /> 초안 저장
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pending || !hasScheduleInputs}
              onClick={() => setConfirmKind('SCHEDULED')}
              title={!hasScheduleInputs ? '예약 시각을 먼저 선택하세요' : ''}
            >
              <Clock size={13} /> 예약 발송
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() => setConfirmKind('SENT')}
            >
              <Send size={13} />{' '}
              {pendingMode === 'SENT' ? '발송 중...' : '지금 발송'}
            </button>
          </div>
        </div>
      )}

      {/* 상세에서 SCHEDULED 상태일 때 — 즉시 발송 / 취소 */}
      {isEdit && existing && existing.status === 'SCHEDULED' && (
        <div className="card mt-4 flex items-center justify-end gap-2">
          <button
            className="btn btn-secondary btn-sm"
            disabled={cancelMutation.isPending}
            onClick={() => setConfirmKind('CANCEL')}
          >
            예약 취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={sendNowMutation.isPending}
            onClick={() => setConfirmKind('SEND_NOW')}
          >
            <Send size={13} /> 즉시 발송
          </button>
        </div>
      )}

      {confirmKind === 'SCHEDULED' && (
        <ConfirmDialog
          title="예약 발송하시겠습니까?"
          body={`예약 시각에 자동 발송됩니다. (예상 ${formatNumber(estimateCount(target))}명)`}
          confirmLabel="예, 예약"
          pending={pending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => {
            setConfirmKind(null)
            handleSubmit('SCHEDULED')
          }}
        />
      )}
      {confirmKind === 'SENT' && (
        <ConfirmDialog
          title="지금 즉시 발송하시겠습니까?"
          body={`발송 후 취소할 수 없습니다. (예상 ${formatNumber(estimateCount(target))}명)`}
          confirmLabel="예, 발송"
          tone="danger"
          pending={pending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => {
            setConfirmKind(null)
            handleSubmit('SENT')
          }}
        />
      )}
      {confirmKind === 'SEND_NOW' && existing && (
        <ConfirmDialog
          title="예약 푸시를 지금 발송하시겠습니까?"
          body={`예약을 무시하고 즉시 발송됩니다. (예상 ${formatNumber(existing.targetCount)}명)`}
          confirmLabel="예, 발송"
          tone="danger"
          pending={sendNowMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => {
            sendNowMutation.mutate(
              { id: existing.id },
              { onSettled: () => setConfirmKind(null) }
            )
          }}
        />
      )}
      {confirmKind === 'CANCEL' && existing && (
        <ConfirmDialog
          title="예약을 취소하시겠습니까?"
          body="이 푸시는 예약된 시각에 발송되지 않습니다."
          confirmLabel="예, 취소"
          tone="warn"
          pending={cancelMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => {
            cancelMutation.mutate(
              { id: existing.id },
              { onSettled: () => setConfirmKind(null) }
            )
          }}
        />
      )}
    </>
  )
}

function PushPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-[#1C1A1F] text-white px-4 py-3 shadow-md">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-md bg-point flex items-center justify-center flex-shrink-0">
          <Bell size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-extrabold">EF</span>
            <span className="text-[10.5px] text-white/60">지금</span>
          </div>
          <div className="text-[13px] font-extrabold mt-0.5 break-words">
            {title || '(제목을 입력하세요)'}
          </div>
          <div className="text-[11.5px] text-white/80 mt-0.5 break-words line-clamp-3">
            {body || '본문이 여기에 표시됩니다.'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-soft font-bold">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function estimateCount(target: PushTarget): number {
  switch (target) {
    case 'ALL': return 14_320
    case 'IOS': return 8_120
    case 'ANDROID': return 6_200
    case 'PREMIUM': return 1_420
    case 'SEGMENT': return 2_180
  }
}
