import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
  useFeedbackDetail,
  useUpdateFeedbackMutation,
  formatDateTime,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_CATEGORY_LABEL,
} from '@ef-fe-admin/shared'
import type { FeedbackStatus, FeedbackType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fbId = id ? Number(id) : undefined
  const { data: feedback, isLoading } = useFeedbackDetail(fbId)

  const [status, setStatus] = useState<FeedbackStatus>('RECEIVED')
  const [reply, setReply] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status)
      setReply(feedback.admin_reply ?? '')
      setMemo(feedback.admin_internal_memo ?? '')
    }
  }, [feedback?.id])

  // 저장 후 목록으로 이동하지 않고 이 상세에 머무름 — 변경 내용은 쿼리 무효화로 즉시 반영.
  const updateMutation = useUpdateFeedbackMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    if (!feedback) return
    setError(null)
    setSaved(false)
    // 빈 문자열도 그대로 전송 — 답변/메모를 비우는 수정이 가능하도록
    updateMutation.mutate({
      id: feedback.id,
      payload: {
        status,
        admin_reply: reply.trim(),
        admin_internal_memo: memo.trim(),
      },
    })
  }

  if (isLoading || !feedback) {
    return (
      <>
        <Topbar title="피드백 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/feedback')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 피드백 목록
        </button>
      </div>
      <Topbar title="피드백 상세" subtitle={`#${feedback.id} · @${feedback.reporter_nickname ?? '-'}`} />

      <div className="card mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FeedbackTypeBadge type={feedback.feedback_type} />
          <Badge tone="neutral">{FEEDBACK_CATEGORY_LABEL[feedback.category_code]}</Badge>
          <FeedbackStatusBadge status={feedback.status} />
        </div>

        <div className="text-[17px] sm:text-[18px] font-extrabold break-keep">
          {feedback.title}
        </div>

        <div className="bg-surface-alt rounded-md p-4 text-[13px] whitespace-pre-wrap break-words">
          {feedback.content}
        </div>

        {feedback.screenshot_urls && feedback.screenshot_urls.length > 0 && (
          <div>
            <div className="text-[11px] text-text-soft font-bold mb-2">스크린샷</div>
            <div className="flex gap-2 flex-wrap">
              {feedback.screenshot_urls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`shot-${idx + 1}`}
                    className="w-28 h-36 sm:w-32 sm:h-40 object-cover rounded-md border border-border hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-text-sub bg-surface-alt rounded-md p-3">
          <Field label="버전">{feedback.app_version ?? '-'}</Field>
          <Field label="디바이스">{feedback.device_info ?? '-'}</Field>
          <Field label="네트워크">{feedback.network_type ?? '-'}</Field>
        </div>

        <div className="text-[11.5px] text-text-soft">
          작성자{' '}
          <button
            type="button"
            onClick={() => navigate(`/users/${feedback.reporter_id}`)}
            className="font-bold text-point-dark hover:underline"
          >
            @{feedback.reporter_nickname ?? '-'} · #{feedback.reporter_id} ·{' '}
            {feedback.reporter_login_id ?? '-'}
          </button>
          {' · '}
          {formatDateTime(feedback.create_time)}
        </div>
      </div>

      <div className="card mb-4 space-y-3">
        <div className="text-[14px] font-extrabold">처리</div>

        <div>
          <label className="form-label">처리 상태</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(FEEDBACK_STATUS).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${status === s ? 'active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {FEEDBACK_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">
            유저에게 보낼 답변 (선택)
            {feedback.admin_reply_at && (
              <span className="text-text-soft font-normal ml-1">
                · 답변 일시 {formatDateTime(feedback.admin_reply_at)}
              </span>
            )}
          </label>
          <textarea
            className="form-textarea"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="답변 내용을 입력하면 유저에게 노출됩니다."
          />
        </div>

        <div>
          <label className="form-label">내부 메모 (유저 비공개)</label>
          <textarea
            className="form-textarea"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="담당자 인계, 우선순위 메모 등"
            style={{ minHeight: 80 }}
          />
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/feedback')}>
            목록으로
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/feedback')}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 저장 완료 팝업 — 2.5초 후 자동 사라짐 */}
      {saved && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
          <div className="bg-surface rounded-xl shadow-lg border border-border px-6 py-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-[14px] font-extrabold">수정되었습니다.</span>
          </div>
        </div>
      )}
    </>
  )
}

function FeedbackTypeBadge({ type }: { type: FeedbackType }) {
  return <Badge tone={type === 'BUG' ? 'danger' : 'point'}>{FEEDBACK_TYPE_LABEL[type]}</Badge>
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const tone =
    status === 'RESOLVED' ? 'normal' :
    status === 'CLOSED' || status === 'DEFERRED' ? 'neutral' :
    status === 'IN_PROGRESS' ? 'point' :
    'warn'
  return <Badge tone={tone}>{FEEDBACK_STATUS_LABEL[status]}</Badge>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-text-soft text-[10.5px]">{label}</div>
      <div>{children}</div>
    </div>
  )
}
