import { useState } from 'react'
import {
  useNotices,
  useCreateNoticeMutation,
  useSendNoticeMutation,
  formatDateTime,
  formatNumber,
  NOTICE_STATUS,
  NOTICE_TARGET_TYPE,
  NOTICE_TARGET_TYPE_LABEL,
  validators,
} from '@ef-fe-admin/shared'
import type { NoticeStatus, NoticeTargetType, Notice } from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import FilterChips from '../components/ui/FilterChips'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { NoticeStatusBadge } from '../components/ui/Badge'

const STATUS_OPTIONS: { value: NoticeStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: NOTICE_STATUS.DRAFT, label: '임시저장' },
  { value: NOTICE_STATUS.SCHEDULED, label: '예약됨' },
  { value: NOTICE_STATUS.SENT, label: '발송됨' },
  { value: NOTICE_STATUS.CANCELED, label: '취소됨' },
]

export default function NoticesPage() {
  const [status, setStatus] = useState<NoticeStatus | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)

  const { data, isLoading } = useNotices({ status, page, size: 12 })

  return (
    <>
      <Topbar title="공지사항" subtitle="전체 유저 대상 알림·이벤트 공지" />

      <div className="flex items-center justify-between mb-4">
        <FilterChips value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={STATUS_OPTIONS} />
        <button className="btn btn-primary btn-sm" onClick={() => setComposeOpen(true)}>
          + 새 공지 작성
        </button>
      </div>

      {composeOpen && <NoticeComposer onClose={() => setComposeOpen(false)} />}

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="공지가 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>대상</th>
                <th>상태</th>
                <th>예약/발송 시각</th>
                <th>발송/읽음</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((n) => (
                <NoticeRow key={n.id} notice={n} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}

function NoticeRow({ notice }: { notice: Notice }) {
  const sendMutation = useSendNoticeMutation()
  const canSend = notice.status === 'DRAFT' || notice.status === 'SCHEDULED'
  return (
    <tr>
      <td className="font-extrabold">{notice.title}</td>
      <td>{NOTICE_TARGET_TYPE_LABEL[notice.target_type]}</td>
      <td><NoticeStatusBadge status={notice.status} /></td>
      <td className="text-text-sub">
        {formatDateTime(notice.sent_at ?? notice.scheduled_at)}
      </td>
      <td className="text-text-sub">
        {notice.status === 'SENT'
          ? `${formatNumber(notice.sent_count)} / ${formatNumber(notice.read_count)}`
          : '-'}
      </td>
      <td>
        {canSend && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => sendMutation.mutate(notice.uuid)}
            disabled={sendMutation.isPending}
          >
            즉시 발송
          </button>
        )}
      </td>
    </tr>
  )
}

function NoticeComposer({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<NoticeTargetType>('ALL')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateNoticeMutation({
    onSuccess: () => {
      setTitle(''); setBody(''); setScheduledAt('')
      onClose()
    },
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    const titleCheck = validators.noticeTitle(title)
    const bodyCheck = validators.noticeBody(body)
    if (!titleCheck.valid) return setError(titleCheck.message ?? '')
    if (!bodyCheck.valid) return setError(bodyCheck.message ?? '')
    createMutation.mutate({
      title,
      body,
      target_type: targetType,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    })
  }

  return (
    <div className="card mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-[14px]">📝 새 공지 작성</div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>닫기</button>
      </div>
      <div>
        <label className="form-label">제목 (푸시 제목)</label>
        <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="form-label">본문</label>
        <textarea className="form-textarea" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">대상</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(NOTICE_TARGET_TYPE) as NoticeTargetType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${targetType === t ? 'active' : ''}`}
                onClick={() => setTargetType(t)}
              >
                {NOTICE_TARGET_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">예약 발송 (비우면 임시저장)</label>
          <input
            type="datetime-local"
            className="form-input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
      <div className="flex justify-end gap-2">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>취소</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
